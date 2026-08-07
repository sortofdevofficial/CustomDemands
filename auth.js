import {
  auth, googleProvider, db, signInWithPopup, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs
} from './firebase.js';

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

onAuthStateChanged(auth, async user => {
  if (!user) { showOnly('screenSignIn'); return; }
  try {
    let data = await getUserData(user.uid);
    if (!data) {
      const nd = { uid: user.uid, email: user.email || '', displayName: user.displayName || '', photoURL: user.photoURL || '', username: '', phone: '', address: '', createdAt: Date.now() };
      await setDoc(doc(db, 'users', user.uid), nd);
      data = nd;
    }
    const hasUN = data.username && data.username.length >= 3;
    if (!hasUN) {
      $('unInput').value = ''; $('unError').textContent = '';
      showOnly('screenUsername'); setTimeout(() => $('unInput').focus(), 280);
    } else if (IS_SETTINGS) {
      fillSettings(user, data); showOnly('screenSettings');
    } else {
      $('alreadyAvatar').src = avatarURL(user);
      $('alreadyTitle').textContent = 'Hey, @' + data.username;
      $('alreadyEmail').textContent = user.email || '';
      showOnly('screenAlready');
    }
  } catch (err) {
    console.error('Firestore Error:', err);
    if (user && !IS_SETTINGS) showOnly('screenAlready');
    else showOnly('screenSignIn');
  }
});

$('btnGoogle').addEventListener('click', async () => {
  $('signInError').textContent = '';
  $('btnGoogle').disabled = true;
  $('btnGoogle').textContent = 'Connecting…';
  try { await signInWithPopup(auth, googleProvider); }
  catch (err) {
    $('btnGoogle').disabled = false;
    $('btnGoogle').innerHTML = 'Continue with Google';
    $('signInError').textContent = 'Sign-in failed. Try again.';
  }
});

if ($('btnAlreadySignOut')) $('btnAlreadySignOut').addEventListener('click', doSignOut);
if ($('btnSignOut')) $('btnSignOut').addEventListener('click', doSignOut);

$('btnSaveUsername').addEventListener('click', saveNewUsername);

async function saveNewUsername() {
  const user = auth.currentUser; if (!user) return;
  const val = $('unInput').value.trim().toLowerCase();
  const ve = validateU(val);
  
  if (ve) { $('unError').textContent = ve; return; }
  
  $('unError').textContent = '';
  $('btnSaveUsername').disabled = true;
  $('btnSaveUsername').textContent = 'Checking availability…';
  
  try {
    const q = query(collection(db, 'users'), where('username', '==', val));
    const snap = await getDocs(q);
    if (!snap.empty) {
      $('unError').textContent = 'Username taken — try another.';
      $('btnSaveUsername').disabled = false;
      $('btnSaveUsername').textContent = 'Save & Continue';
      return;
    }
    await updateDoc(doc(db, 'users', user.uid), { username: val, updatedAt: Date.now() });
    $('redirOverlay').classList.add('show');
    window.location.replace('index.html');
  } catch (err) {
    console.error(err);
    $('unError').textContent = 'Could not save. Please try again.';
    $('btnSaveUsername').disabled = false;
  }
}

function fillSettings(user, data) {
  const u = data.username || user.displayName || 'user';
  $('spAvatar').src = avatarURL(user);
  $('spUsername').textContent = '@' + u;
  $('spEmail').textContent = user.email || '';
  
  $('settingsUsername').value = u;
  $('settingsPhone').value = data.phone || '';
  $('settingsAddress').value = data.address || '';
  
  $('sError').textContent = ''; $('sSuccess').textContent = '';
}

$('btnSaveSettings').addEventListener('click', saveSettings);

async function saveSettings() {
  const user = auth.currentUser; if (!user) return;
  const newUsername = $('settingsUsername').value.trim().toLowerCase();
  const newPhone = $('settingsPhone').value.trim();
  const newAddress = $('settingsAddress').value.trim();
  const ve = validateU(newUsername);
  
  $('sError').textContent = ''; $('sSuccess').textContent = '';
  if (ve) { $('sError').textContent = ve; return; }
  
  $('btnSaveSettings').disabled = true;
  $('btnSaveSettings').textContent = 'Saving details…';
  
  try {
    const data = await getUserData(user.uid);
    const cur = data ? data.username : '';
    
    if (newUsername !== cur) {
      const q = query(collection(db, 'users'), where('username', '==', newUsername));
      const snap = await getDocs(q);
      if (!snap.empty) {
        $('sError').textContent = 'Username already taken by someone else.';
        $('btnSaveSettings').disabled = false;
        $('btnSaveSettings').textContent = 'Save All Details';
        return;
      }
    }
    
    await updateDoc(doc(db, 'users', user.uid), { 
      username: newUsername,
      phone: newPhone,
      address: newAddress,
      updatedAt: Date.now() 
    });
    
    $('spUsername').textContent = '@' + newUsername;
    $('sSuccess').textContent = '✓ Details saved successfully!';
    setTimeout(() => { $('sSuccess').textContent = ''; }, 3000);
  } catch (err) {
    console.error(err);
    $('sError').textContent = 'Could not save. Please try again.';
  } finally {
    $('btnSaveSettings').disabled = false;
    $('btnSaveSettings').textContent = 'Save All Details';
  }
}

async function doSignOut() {
  $('redirOverlay').classList.add('show');
  try { await signOut(auth); window.location.replace('auth.html'); }
  catch (e) { $('redirOverlay').classList.remove('show'); }
}