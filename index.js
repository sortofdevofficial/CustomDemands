import { auth, db, onAuthStateChanged, doc, getDoc, collection, getDocs, query, where } from './firebase.js';

const $ = id => document.getElementById(id);

// Fetch Total System Orders & User Orders
async function initializeAppData(user) {
  try {
    // 1. Fetch Total Orders across all database users/demands
    const demandsSnap = await getDocs(collection(db, 'demands'));
    const totalCount = demandsSnap.size;
    if ($('totalOrdersCount')) {
      $('totalOrdersCount').textContent = totalCount > 0 ? totalCount : '0 Active Dockets';
    }

    // 2. Fetch specific user orders container data if logged in
    const ordersContainer = $('userOrdersContainer');
    if (!ordersContainer) return;

    if (user) {
      const q = query(collection(db, 'demands'), where('uid', '==', user.uid));
      const userDemandsSnap = await getDocs(q);

      if (userDemandsSnap.empty) {
        ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders logged to your UID profile yet. Submit your details through the Google Form order link!</p>`;
      } else {
        let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        userDemandsSnap.forEach(docSnap => {
          const d = docSnap.data();
          html += `
            <div style="background:var(--surface); border:1px solid var(--border); padding:16px; border-radius:6px;">
              <strong>Docket ID:</strong> ${d.id || docSnap.id}<br>
              <strong>Status:</strong> <span style="color:var(--stamp);">${d.status || 'Received'}</span><br>
              <strong>Details:</strong> ${d.details || 'Custom Sticker'}
            </div>
          `;
        });
        html += '</div>';
        ordersContainer.innerHTML = html;
      }
    } else {
      ordersContainer.innerHTML = `<p style="color:var(--ink-faint);">Sign in using your account to track your localized orders.</p>`;
    }
  } catch (err) {
    console.error("Error fetching ledger data:", err);
    if ($('totalOrdersCount')) $('totalOrdersCount').textContent = 'Unavailable';
  }
}

// Auth State Listener
onAuthStateChanged(auth, async user => {
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if ($('navUsernameText')) $('navUsernameText').textContent = '@' + (data.username || 'user');
      } else {
        if ($('navUsernameText')) $('navUsernameText').textContent = '@' + (user.displayName || 'member');
      }
      if ($('navAvatar')) $('navAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=1E2621&color=ECE6D6`;
      if ($('navSignIn')) $('navSignIn').style.display = 'none';
      if ($('navUser')) $('navUser').style.display = 'flex';
    } catch (error) {
      console.error("Error fetching user session metadata:", error);
    }
  } else {
    if ($('navSignIn')) $('navSignIn').style.display = 'inline-block';
    if ($('navUser')) $('navUser').style.display = 'none';
  }

  // Run database sync loaders
  initializeAppData(user);
});