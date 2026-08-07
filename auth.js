import {
  auth,
  googleProvider,
  db,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  equalTo,
  limitToFirst
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
  return user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=F3F4F6&color=111827&size=100&bold=true`;
}

function validateU(u) {
  if (!u || u.length < 3) return 'At least 3 characters required.';
  if (u.length > 24) return '24 characters maximum.';
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Only letters, numbers, and underscores.';
  return null;
}

async function getUserData(uid) {
  const snap = await get(ref(db, 'users/' + uid));
  return snap.exists() ? snap.val() : null;
}

onAuthStateChanged(auth, async user => {
  if (!user) { showOnly('screenSignIn'); return; }
  try {
    let data = await getUserData(user.uid);
    if (!data) {
      const nd = { uid: user.uid, email: user.email || '', displayName: user.displayName || '', photoURL: user.photoURL || '', username: '', createdAt: Date.now() };
      await set(ref(db, 'users/' + user.uid), nd);
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
    console.error('DB Error:', err);
    if (IS_SETTINGS) { fillSettingsFallback(user); showOnly('screenSettings'); }
    else if (user) {
      $('alreadyAvatar').src = avatarURL(user);
      $('alreadyTitle').textContent = 'Hey, ' + (user.displayName || 'there');
      $('alreadyEmail').textContent = user.email || '';
      showOnly('screenAlready');
    } else { showOnly('screenSignIn'); }
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
$('unInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveNewUsername(); });

async function saveNewUsername() {
  const user = auth.currentUser; if (!user) return;
  const val = $('unInput').value.trim().toLowerCase();
  const ve = validateU(val);
  
  if (ve) { $('unError').textContent = ve; return; }
  
  $('unError').textContent = '';
  $('btnSaveUsername').disabled = true;
  $('btnSaveUsername').textContent = 'Saving…';
  
  try {
    const q = query(ref(db, 'users'), orderByChild('username'), equalTo(val), limitToFirst(1));
    const snap = await get(q);
    if (snap.exists()) {
      $('unError').textContent = 'Username taken — try another.';
      $('btnSaveUsername').disabled = false;
      $('btnSaveUsername').textContent = 'Save & Continue';
      return;
    }
    await update(ref(db, 'users/' + user.uid), { username: val, updatedAt: Date.now() });
    $('redirOverlay').classList.add('show');
    window.location.replace('index.html');
  } catch (err) {
    console.error(err);
    $('unError').textContent = 'Could not save. Please try again.';
    $('btnSaveUsername').disabled = false;
    $('btnSaveUsername').textContent = 'Save & Continue';
  }
}

function fillSettings(user, data) {
  const u = data.username || user.displayName || 'user';
  $('spAvatar').src = avatarURL(user);
  $('spUsername').textContent = '@' + u;
  $('spEmail').textContent = user.email || '';
  $('settingsUsername').value = u;
  $('sError').textContent = ''; $('sSuccess').textContent = '';
}

function fillSettingsFallback(user) {
  fillSettings(user, { username: user.displayName || 'user', createdAt: null });
}

$('btnSaveSettings').addEventListener('click', saveSettings);
$('settingsUsername').addEventListener('keydown', e => { if (e.key === 'Enter') saveSettings(); });

async function saveSettings() {
  const user = auth.currentUser; if (!user) return;
  const val = $('settingsUsername').value.trim().toLowerCase();
  const ve = validateU(val);
  
  $('sError').textContent = ''; $('sSuccess').textContent = '';
  if (ve) { $('sError').textContent = ve; return; }
  
  $('btnSaveSettings').disabled = true;
  $('btnSaveSettings').textContent = 'Saving…';
  
  try {
    const data = await getUserData(user.uid);
    const cur = data ? data.username : '';
    if (val !== cur) {
      const q = query(ref(db, 'users'), orderByChild('username'), equalTo(val), limitToFirst(1));
      const snap = await get(q);
      if (snap.exists()) {
        $('sError').textContent = 'Username taken — try another.';
        $('btnSaveSettings').disabled = false;
        $('btnSaveSettings').textContent = 'Save Changes';
        return;
      }
    }
    await update(ref(db, 'users/' + user.uid), { username: val, updatedAt: Date.now() });
    $('spUsername').textContent = '@' + val;
    $('sSuccess').textContent = '✓ Saved successfully!';
    setTimeout(() => { $('sSuccess').textContent = ''; }, 3000);
  } catch (err) {
    console.error(err);
    $('sError').textContent = 'Could not save. Please try again.';
  } finally {
    $('btnSaveSettings').disabled = false;
    $('btnSaveSettings').textContent = 'Save Changes';
  }
}

async function doSignOut() {
  $('redirOverlay').classList.add('show');
  try { await signOut(auth); window.location.replace('auth.html'); }
  catch (e) { $('redirOverlay').classList.remove('show'); }
}