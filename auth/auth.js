import {
  auth, googleProvider, db, signInWithPopup, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs
} from '../firebase.js';

const IS_SETTINGS = new URLSearchParams(window.location.search).has('settings');
const $ = id => document.getElementById(id);
const SCREENS = ['screenSignIn', 'screenAlready', 'screenUsername', 'screenSettings'];

function showOnly(id) {
  SCREENS.forEach(s => {
    const el = $(s);
    if (el) el.style.display = (s === id) ? '' : 'none';
  });
}

function avatarURL(user) {
  return user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=000&color=fff&size=100`;
}

function validateU(u) {
  if (!u || u.length < 3) return 'Username requires at least 3 characters.';
  if (u.length > 24) return '24 characters maximum.';
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Only letters, numbers, and underscores.';
  return null;
}

async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

async function fillSettings(user, data) {
  if ($('spAvatar')) $('spAvatar').src = avatarURL(user);
  if ($('spUsername')) $('spUsername').textContent = '@' + (data.username || 'username');
  if ($('spEmail')) $('spEmail').textContent = user.email || '';
  
  if ($('settingsUsername')) $('settingsUsername').value = data.username || '';
  if ($('settingsPhone')) $('settingsPhone').value = data.phone || '';
  if ($('settingsAddress')) $('settingsAddress').value = data.address || '';

  if ($('spCreatedAt')) {
    const d = data.createdAt ? new Date(data.createdAt) : null;
    $('spCreatedAt').textContent = d && !isNaN(d) ? d.toLocaleDateString() : '—';
  }

  if ($('spTotalOrders')) {
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      $('spTotalOrders').textContent = snap.size;
    } catch {
      $('spTotalOrders').textContent = '—';
    }
  }
}

// Event Listeners
if ($('btnGoogle')) {
  $('btnGoogle').addEventListener('click', async () => {
    try {
      if ($('signInError')) $('signInError').textContent = '';
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign in failed:", err);
      if ($('signInError')) $('signInError').textContent = 'Sign in failed. Try again.';
    }
  });
}

if ($('btnSaveUsername')) {
  $('btnSaveUsername').addEventListener('click', async () => {
    const val = $('unInput').value.trim();
    const err = validateU(val);
    if (err) { $('unError').textContent = err; return; }

    const u = auth.currentUser;
    if (!u) return;

    try {
      await updateDoc(doc(db, 'users', u.uid), { username: val });
      window.location.href = '../index/index.html';
    } catch (e) {
      console.error(e);
      $('unError').textContent = 'Could not save username.';
    }
  });
}

if ($('btnSaveSettings')) {
  $('btnSaveSettings').addEventListener('click', async () => {
    const u = auth.currentUser;
    if (!u) return;

    const un = $('settingsUsername').value.trim();
    const err = validateU(un);
    if (err) { $('sError').textContent = err; return; }

    try {
      $('sError').textContent = '';
      $('sSuccess').textContent = '';
      await updateDoc(doc(db, 'users', u.uid), {
        username: un,
        phone: $('settingsPhone').value.trim(),
        address: $('settingsAddress').value.trim()
      });
      $('sSuccess').textContent = 'Details updated successfully!';
      const data = await getUserData(u.uid);
      fillSettings(u, data);
    } catch (e) {
      console.error(e);
      $('sError').textContent = 'Failed to update settings.';
    }
  });
}

const handleSignOut = async () => {
  try {
    await signOut(auth);
    showOnly('screenSignIn');
  } catch (err) {
    console.error("Sign out error:", err);
  }
};

if ($('btnSignOut')) $('btnSignOut').addEventListener('click', handleSignOut);
if ($('btnAlreadySignOut')) $('btnAlreadySignOut').addEventListener('click', handleSignOut);

onAuthStateChanged(auth, async user => {
  if (!user) { 
    showOnly('screenSignIn'); 
    return; 
  }

  try {
    let data = await getUserData(user.uid);
    if (!data) {
      const nd = { 
        uid: user.uid, 
        email: user.email || '', 
        displayName: user.displayName || '', 
        photoURL: user.photoURL || '', 
        username: '', 
        phone: '', 
        address: '', 
        createdAt: Date.now() 
      };
      await setDoc(doc(db, 'users', user.uid), nd);
      data = nd;
    }

    const hasUN = data.username && data.username.length >= 3;
    if (!hasUN) {
      $('unInput').value = ''; 
      $('unError').textContent = '';
      showOnly('screenUsername'); 
      setTimeout(() => $('unInput').focus(), 280);
    } else if (IS_SETTINGS) {
      fillSettings(user, data); 
      showOnly('screenSettings');
    } else {
      $('alreadyAvatar').src = avatarURL(user);
      $('alreadyTitle').textContent = 'Hey, @' + data.username;
      $('alreadyEmail').textContent = user.email || '';
      showOnly('screenAlready');
    }
  } catch (err) {
    console.error("Auth state error:", err);
  }
});