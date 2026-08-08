import { auth, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);

// Replace with your actual Google Apps Script Web App URL
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwObDIl7NRo2UBHw1mLcz7EGhP8pKw6vUz9noX6BzQoJG47FKTM5D2uy2oi-sfKtg2d/exec";

async function fetchLiveOrdersFromSheet(user) {
  const ordersContainer = $('userOrdersContainer');
  const countDisplay = $('totalOrdersCount');

  try {
    const response = await fetch(GOOGLE_SHEET_API_URL);
    const orders = await response.json();

    // 1. Update total orders count in Hero
    if (countDisplay) {
      countDisplay.textContent = orders.length > 0 ? `${orders.length} Active Dockets` : '0 Active Dockets';
    }

    // 2. Filter & Display user specific orders if logged in
    if (!ordersContainer) return;

    if (user) {
      const userOrders = orders.filter(order => String(order.uid) === String(user.uid));

      if (userOrders.length === 0) {
        ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for your profile. Submit your details through the Google Form order link!</p>`;
      } else {
        let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        userOrders.forEach(d => {
          html += `
            <div style="background:var(--surface); border:1px solid var(--border); padding:16px; border-radius:6px;">
              <strong>Docket ID:</strong> ${d.id || 'N/A'}<br>
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
    console.error("Error fetching live sheet data:", err);
    if (countDisplay) countDisplay.textContent = 'Unavailable';
    if (ordersContainer) ordersContainer.innerHTML = `<p style="color:var(--stamp);">Failed to load live spreadsheet data.</p>`;
  }
}

// Auth Listener
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
      console.error("Error fetching profile metadata:", error);
    }
  } else {
    if ($('navSignIn')) $('navSignIn').style.display = 'inline-block';
    if ($('navUser')) $('navUser').style.display = 'none';
  }

  fetchLiveOrdersFromSheet(user);
});