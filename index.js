import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbz7pUUSJoM3ChTZNdMEE5XydZaBMEew3yFt2OHaWXxbcN9ekE14Nr5gZtDVqnCl8vmy/exec";

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
  const rawStatus = (d["order status"] || d["status"] || 'Pending').toString();
  const statusClass = `status-${rawStatus.toLowerCase().replace(/\s+/g, '-')}`;
  const imgUrl = extractImageUrl(d["upload design"] || d["upload image"] || null);

  const editUrl = d["form link"] || "https://forms.gle/cr2yXjXRaYkXe4FDA";
  const orderId = d["order id"] || 'N/A';

  const imageHTML = imgUrl
    ? `<div class="order-img-wrap">
         <img src="${imgUrl}" alt="Uploaded sticker design" class="order-img" loading="lazy"
              onerror="this.onerror=null; this.parentElement.innerHTML='<p class=\\'img-error\\'>Image unavailable</p>';"/>
       </div>`
    : '';

  const timestamp = d["timestamp"] ? new Date(d["timestamp"]) : null;
  const dateText = timestamp && !isNaN(timestamp) ? timestamp.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

  return `
    <div class="order-card">
      <div class="order-header">
        <strong>ID: ${orderId}</strong>
        <span class="order-status ${statusClass}">${rawStatus}</span>
      </div>
      ${imageHTML}
      <div class="order-body">
        <p><strong>Details</strong> ${d["order details"] || 'Custom sticker'}</p>
        <p><strong>Submitted</strong> ${dateText}</p>
        <a href="${editUrl}" target="_blank" rel="noopener" class="btn-secondary" style="margin-top:12px; width:100%; justify-content:center; text-align:center; font-size:0.85rem; padding:8px 14px;">
          ✏️ Edit Response / Add Photos
        </a>
      </div>
    </div>
  `;
}

async function fetchLiveOrdersFromSheet(user) {
  const ordersContainer = $('userOrdersContainer');
  setTotalOrders('loading');

  if (!user) {
    if (ordersContainer) ordersContainer.innerHTML = `<p style="color:var(--ink-faint);">Sign in to see your order history here.</p>`;
    setTotalOrders('error');
    return;
  }

  let orders = [];
  try {
    const fetchUrl = `${GOOGLE_SHEET_API_URL}?email=${encodeURIComponent(user.email)}`;
    const response = await fetch(fetchUrl, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`Sheet responded with ${response.status}`);
    const result = await response.json();
    
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

// ---- TRUCK DELIVERY BUTTON ----
// Click plays a "box gets loaded → truck drives off → delivered ✓" animation.
// The link still opens in a new tab as normal; this is just the flourish.

document.querySelectorAll('.truck-btn').forEach(btn => {
  let resetTimer = null;

  btn.addEventListener('click', () => {
    clearTimeout(resetTimer);
    btn.classList.remove('is-done');

    // Restart the CSS animation cleanly even if it's already mid-run.
    const truck = btn.querySelector('.tb-truck');
    const box = btn.querySelector('.tb-box');
    btn.classList.remove('is-animating');
    if (truck) truck.style.animation = 'none';
    if (box) box.style.animation = 'none';
    void btn.offsetWidth; // force reflow so the animation restarts
    if (truck) truck.style.animation = '';
    if (box) box.style.animation = '';
    btn.classList.add('is-animating');

    // Truck animation runs ~2.25s (0.55s delay + 1.7s drive) before it's "delivered".
    resetTimer = setTimeout(() => {
      btn.classList.remove('is-animating');
      btn.classList.add('is-done');
      // Hold the success state a moment, then reset so it can be replayed.
      resetTimer = setTimeout(() => btn.classList.remove('is-done'), 2200);
    }, 2250);
  });
});

// ---- AUTH & INIT ----

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