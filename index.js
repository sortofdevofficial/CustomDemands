import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwObDIl7NRo2UBHw1mLcz7EGhP8pKw6vUz9noX6BzQoJG47FKTM5D2uy2oi-sfKtg2d/exec";

// SECURITY NOTE: this endpoint currently returns every order row (including
// every customer's email address) to any visitor, and filtering happens here
// in the browser. That means anyone can open dev tools → Network and read
// everybody's orders. Ideally the Apps Script itself should accept an
// ?email= parameter and only return that person's rows server-side. Until
// that's changed, treat this feed as effectively public.

let currentUser = null;

function setTotalOrders(state, count) {
  const el = $('totalOrdersCount');
  if (!el) return;
  el.classList.remove('is-loading', 'is-error');
  if (state === 'loading') { el.textContent = 'Loading…'; el.classList.add('is-loading'); }
  else if (state === 'error') { el.textContent = 'Unavailable'; el.classList.add('is-error'); }
  else { el.textContent = `${count} Active Docket${count === 1 ? '' : 's'}`; }
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

  let orders;
  try {
    const response = await fetch(GOOGLE_SHEET_API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Sheet responded with ${response.status}`);
    const data = await response.json();
    // Apps Script sometimes returns {error: "..."} instead of an array on failure.
    if (!Array.isArray(data)) throw new Error('Unexpected response shape from order sheet');
    orders = data;
  } catch (err) {
    console.error("Error fetching sheet data:", err);
    setTotalOrders('error');
    if (ordersContainer) {
      ordersContainer.innerHTML = `<p style="color:var(--stamp);">Couldn't load live order data right now. Try refreshing in a moment.</p>`;
    }
    return;
  }

  setTotalOrders('ok', orders.length);
  if (!ordersContainer) return;

  if (!user) {
    ordersContainer.innerHTML = `<p style="color:var(--ink-faint);">Sign in to see your order history here.</p>`;
    return;
  }

  const userOrders = orders.filter(order =>
    order["Email address"] && order["Email address"].toLowerCase() === user.email.toLowerCase()
  );

  if (userOrders.length === 0) {
    ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for <strong>${user.email}</strong> yet. Place one through the order form above.</p>`;
    return;
  }

  ordersContainer.innerHTML = `<div class="orders-grid">${userOrders.map(renderOrderCard).join('')}</div>`;
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

// Refresh the live feed periodically so the count/status stay current
// without needing a page reload.
setInterval(() => fetchLiveOrdersFromSheet(currentUser), 60000);

// Mobile nav toggle
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