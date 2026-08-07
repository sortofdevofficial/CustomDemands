import { auth, db, onAuthStateChanged, ref, get } from './firebase.js';

const $ = id => document.getElementById(id);

// Handle Auth State on Homepage
onAuthStateChanged(auth, async user => {
  if (user) {
    try {
      const snap = await get(ref(db, 'users/' + user.uid));
      if (snap.exists()) {
        const data = snap.val();
        $('navUsernameText').textContent = '@' + (data.username || 'user');
      }
      $('navAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=000&color=fff`;
      
      $('navSignIn').style.display = 'none';
      $('navUser').style.display = 'flex';
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    $('navSignIn').style.display = 'inline-block';
    $('navUser').style.display = 'none';
  }
});

// Security
['copy','cut','paste','selectstart','contextmenu'].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault(), { passive: false })
);