import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, collection, serverTimestamp } from './firebase.js';

const $ = id => document.getElementById(id);

let currentUser = null;

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        $('navUsernameText').textContent = '@' + (data.username || 'user');
        if (data.phone) $('dfPhone').value = data.phone;
        if (data.address) $('dfAddress').value = data.address;
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

// Accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Live Form Submission directly to Firestore
const liveForm = $('liveOrderForm');
if (liveForm) {
  liveForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('btnSubmitDemand');
    const err = $('dfError');
    const ok = $('dfSuccess');
    
    err.textContent = '';
    ok.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Submitting Docket...';

    const category = $('dfCategory').value;
    const details = $('dfDetails').value.trim();
    const phone = $('dfPhone').value.trim();
    const address = $('dfAddress').value.trim();

    try {
      const demandRef = doc(collection(db, 'demands'));
      await setDoc(demandRef, {
        id: demandRef.id,
        uid: currentUser ? currentUser.uid : null,
        email: currentUser ? currentUser.email : '',
        category,
        details,
        phone,
        address,
        status: 'Pending Quote',
        createdAt: serverTimestamp()
      });

      ok.textContent = '✓ Demand filed successfully! We will quote you on WhatsApp shortly.';
      liveForm.reset();
    } catch (error) {
      console.error('Firestore Order Error:', error);
      err.textContent = 'Failed to submit demand. Please check permissions or network connection.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Demand Docket';
    }
  });
}