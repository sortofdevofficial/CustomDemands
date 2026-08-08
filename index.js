import { auth, db, onAuthStateChanged, doc, getDoc } from './firebase.js';

const $ = id => document.getElementById(id);
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxA6UClnGl2B_NlpV0yXaA5UaNAuP4rt20yhnAo1hxSmUeNRjuIVKw8FyiKP0prG9mF/exec";

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
  // Grabs whatever exact text is in the 'Order Status' or 'Status' column
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

// ---- REVIEW SYSTEM ADDITIONS ----

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

async function fetchPublicReviews() {
  const container = $('reviewsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${GOOGLE_SHEET_API_URL}?action=getReviews`);
    const reviews = await res.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = `<p style="color:var(--ink-faint); text-align:center; grid-column: 1/-1;">No reviews yet. Be the first to leave one!</p>`;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="order-card">
        <div class="order-header">
          <strong>${r.username || 'Anonymous'}</strong>
          <span style="color:var(--brass); font-family:var(--font-mono);">${'★'.repeat(r.rating || 5)}</span>
        </div>
        ${r.imageUrl ? `
          <div class="order-img-wrap">
            <img src="${r.imageUrl}" class="order-img" loading="lazy" alt="Review photo" />
          </div>` : ''}
        <div class="order-body">
          <p>${r.comment || ''}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error fetching reviews:', err);
    container.innerHTML = `<p style="color:var(--stamp); text-align:center; grid-column: 1/-1;">Failed to load reviews.</p>`;
  }
}

const reviewForm = $('reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('submitReviewBtn');
    btn.disabled = true;
    btn.textContent = 'Posting…';

    try {
      const fileInput = $('reviewImageInput');
      let base64Data = null;
      let fileName = null;
      let fileType = null;

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        base64Data = await fileToBase64(file);
        fileName = `review_${Date.now()}_${file.name}`;
        fileType = file.type;
      }

      const payload = {
        action: "addReview",
        username: currentUser ? (currentUser.displayName || 'Member') : 'Anonymous',
        rating: $('reviewRating').value,
        comment: $('reviewComment').value,
        base64Data: base64Data,
        fileName: fileName,
        fileType: fileType
      };

      const res = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.status === 'success') {
        alert('Review posted successfully!');
        reviewForm.reset();
        fetchPublicReviews();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to post review. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Post Review';
    }
  });
}

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
fetchPublicReviews(); // Load reviews on startup

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