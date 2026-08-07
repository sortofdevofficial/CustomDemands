import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);

onAuthStateChanged(auth, async user => {
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        $('navUsernameText').textContent = '@' + (data.username || 'user');
      }
      $('navAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=1E2621&color=ECE6D6`;

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

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});