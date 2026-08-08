import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwObDIl7NRo2UBHw1mLcz7EGhP8pKw6vUz9noX6BzQoJG47FKTM5D2uy2oi-sfKtg2d/exec";

let currentUser = null;

function setTotalOrders(state, count) {
  const el = $('totalOrdersCount');
  if (!el) return;
  el.classList.remove('is-loading', 'is-error');
  if (state === 'loading') { el.textContent = 'Loading…'; el.classList.add('is-loading'); }
  else if (state === 'error') { el.textContent = 'Unavailable'; el.classList.add('is-error'); }
  else { el.textContent = `${count}`; }
}

function extractImageUrl(raw) {
  if (!raw) return null;
  let driveId = null;
  if (raw.includes('id=')) driveId = raw.split('id=')[1].split('&')[0];
  else if (raw.includes('/d/')) driveId = raw.split('/d/')[1].split('/')[0];
  if (driveId) return `https://lh3.googleusercontent.com/d/${driveId}`;
  if (raw.startsWith('http')) return raw.split(',')[0].trim();
  return null;
}

function renderOrderCard(d) {
  const rawStatus = (d["Order Status"] || d["Status"] || 'Pending').toString();
  const statusClass = `status-${rawStatus.toLowerCase().replace(/\s+/g, '-')}`;
  const imgUrl = extractImageUrl(d["Upload Design"] || d["Upload Image"] || null);

  const imageHTML = imgUrl
    ? `<div class="order-img-wrap">
         <img src="${imgUrl}" alt="Uploaded sticker design" class="order-img" loading="lazy"
              onerror="this.onerror=null; this.parentElement.innerHTML='<p class=\\'img-error\\'>Image unavailable</p>';"/>
       </div>`
    : '';

  const timestamp = d["Timestamp"] ? new Date(d["Timestamp"]) : null;
  const dateText = timestamp && !isNaN(timestamp) ? timestamp.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

  return `
    <div class="order-card">
      <div class="order-header">
        <strong>ID: ${d["Order ID"] || 'N/A'}</strong>
        <span class="order-status ${statusClass}">${rawStatus}</span>
      </div>
      ${imageHTML}
      <div class="order-body">
        <p><strong>Details</strong> ${d["Order Details"] || 'Custom sticker'}</p>
        <p><strong>Submitted</strong> ${dateText}</p>
      </div>
    </div>
  `;
}

async function fetchLiveOrdersFromSheet(user) {
  const ordersContainer = $('userOrdersContainer');
  setTotalOrders('loading');

  if (!user) {
    if (ordersContainer) ordersContainer.innerHTML = `<p style="color:var(--ink-faint);">Sign in to see your order history here.</p>`;
    setTotalOrders('error'); // Hides count if not logged in
    return;
  }

  let orders = [];
  try {
    // Append email to the API URL securely
    const fetchUrl = `${GOOGLE_SHEET_API_URL}?email=${encodeURIComponent(user.email)}`;
    const response = await fetch(fetchUrl, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`Sheet responded with ${response.status}`);
    const result = await response.json();
    
    // Support the new structure { data: [], totalSystemOrders: number }
    if (result.data) {
        orders = result.data;
        setTotalOrders('ok', result.totalSystemOrders);
    } else {
        throw new Error('Unexpected response shape from order sheet');
    }
  } catch (err) {
    console.error("Error fetching sheet data:", err);
    setTotalOrders('error');
    if (ordersContainer) {
      ordersContainer.innerHTML = `<p style="color:var(--stamp);">Couldn't load live order data right now. Try refreshing in a moment.</p>`;
    }
    return;
  }

  if (!ordersContainer) return;

  if (orders.length === 0) {
    ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for <strong>${user.email}</strong> yet. Place one through the order form above.</p>`;
    return;
  }

  ordersContainer.innerHTML = `<div class="orders-grid">${orders.map(renderOrderCard).join('')}</div>`;
}

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const uname = snap.exists() ? snap.data().username : null;
      if ($('navUsernameText')) $('navUsernameText').textContent = '@' + (uname || user.displayName || 'member');
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

setInterval(() => fetchLiveOrdersFromSheet(currentUser), 60000);

const navToggle = $('navToggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); })
  );
}