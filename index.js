import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwObDIl7NRo2UBHw1mLcz7EGhP8pKw6vUz9noX6BzQoJG47FKTM5D2uy2oi-sfKtg2d/exec";

async function fetchLiveOrdersFromSheet(user) {
  const ordersContainer = $('userOrdersContainer');
  const countDisplay = $('totalOrdersCount');

  try {
    const response = await fetch(GOOGLE_SHEET_API_URL);
    const orders = await response.json();

    if (countDisplay) {
      countDisplay.textContent = `${orders.length} Active Dockets`;
    }

    if (!ordersContainer) return;

    if (user) {
      const userOrders = orders.filter(order => 
        order["Email address"] && order["Email address"].toLowerCase() === user.email.toLowerCase()
      );

      if (userOrders.length === 0) {
        ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for <strong>${user.email}</strong>. Submit your details through the Google Form order link!</p>`;
      } else {
        let html = '<div class="orders-grid">';
        userOrders.forEach(d => {
          
          const rawStatus = d["Order Status"] || d["Status"] || 'Pending';
          const statusClass = `status-${rawStatus.toLowerCase().replace(/\s+/g, '-')}`;

          // Safely extract Google Drive file ID for thumbnail rendering
          let rawImgUrl = d["Upload Design"] || d["Upload Image"] || null;
          let imgUrl = null;
          
          if (rawImgUrl) {
            let driveId = null;
            if (rawImgUrl.includes('id=')) {
              driveId = rawImgUrl.split('id=')[1].split('&')[0];
            } else if (rawImgUrl.includes('/d/')) {
              driveId = rawImgUrl.split('/d/')[1].split('/')[0];
            }

            if (driveId) {
              // Direct image view endpoint that bypasses Drive embedding limits
              imgUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
            } else if (rawImgUrl.startsWith('http')) {
              imgUrl = rawImgUrl.split(',')[0].trim(); 
            }
          }

          const imageHTML = imgUrl 
            ? `<div class="order-img-wrap">
                 <img src="${imgUrl}" alt="Ordered Sticker" class="order-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<p class=\\'img-error\\'>Image unavailable</p>';"/>
               </div>` 
            : '';

          html += `
            <div class="order-card">
              <div class="order-header">
                <strong>ID: ${d["Order ID"] || 'N/A'}</strong>
                <span class="order-status ${statusClass}">${rawStatus}</span>
              </div>
              ${imageHTML}
              <div class="order-body">
                <p><strong>Details:</strong> ${d["Order Details"] || 'Custom Sticker'}</p>
                <p><strong>Submitted:</strong> ${d["Timestamp"] ? new Date(d["Timestamp"]).toLocaleDateString() : 'Recently'}</p>
              </div>
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
    console.error("Error fetching sheet data:", err);
    if (countDisplay) countDisplay.textContent = 'Unavailable';
    if (ordersContainer) ordersContainer.innerHTML = `<p style="color:var(--stamp);">Failed to load live spreadsheet data.</p>`;
  }
}

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