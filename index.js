import { auth, db, onAuthStateChanged, doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from './firebase.js';

const $ = id => document.getElementById(id);

// Replace with your actual ImgBB API Key
const IMGBB_API_KEY = "c98dd32e4c593b29c792c38630d3e10a"; 

let currentUser = null;

function renderOrderCard(d) {
  const rawStatus = (d.status || 'Packaging').toString();
  const statusClass = `status-${rawStatus.toLowerCase().replace(/\s+/g, '-')}`;
  const imgUrl = d.imageUrl;

  const imageHTML = imgUrl
    ? `<div class="order-img-wrap">
         <img src="${imgUrl}" alt="Uploaded sticker design" class="order-img" loading="lazy"
              onerror="this.onerror=null; this.parentElement.innerHTML='<p class=\\'img-error\\'>Image unavailable</p>';"/>
       </div>`
    : '';

  // Handle Firebase Timestamps properly
  const timestamp = d.timestamp ? (d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp)) : null;
  const dateText = timestamp && !isNaN(timestamp) ? timestamp.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
  
  // Handle custom Delivery text
  const deliveredText = d.Delivered ? d.Delivered : 'Pending Delivery';

  return `
    <div class="order-card">
      <div class="order-header">
        <strong>Submitted: ${dateText}</strong>
        <span class="order-status ${statusClass}">${rawStatus}</span>
      </div>
      ${imageHTML}
      <div class="order-body">
        <p><strong>Details</strong> ${d.details || 'Custom sticker'}</p>
        <p><strong>Delivered</strong> ${deliveredText}</p>
      </div>
    </div>
  `;
}

// Fetch orders straight from Firebase
async function fetchLiveOrdersFromFirebase(user) {
  const ordersContainer = $('userOrdersContainer');
  if (!ordersContainer) return;

  if (!user) {
    ordersContainer.innerHTML = `<p style="color:var(--ink-faint);">Sign in to see your order history here.</p>`;
    return;
  }

  try {
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    
    let orders = [];
    snap.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Sort descending by timestamp
    orders.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    if (orders.length === 0) {
      ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for <strong>${user.email}</strong> yet.</p>`;
      return;
    }

    ordersContainer.innerHTML = `<div class="orders-grid">${orders.map(renderOrderCard).join('')}</div>`;
  } catch (err) {
    console.error("Error fetching firebase data:", err);
    ordersContainer.innerHTML = `<p style="color:var(--stamp);">Couldn't load live order data right now. Try refreshing in a moment.</p>`;
  }
}

// Handle real form submission, ImgBB upload, and Firebase saving
const orderForm = $('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please sign in to place an order.");
      window.location.href = 'auth.html';
      return;
    }

    if (IMGBB_API_KEY === "YOUR_IMGBB_API_KEY_HERE") {
        alert("Developer: Please set your ImgBB API key in index.js!");
        return;
    }

    const fileInput = $('stickerUpload');
    const notesInput = $('orderNotes');
    const file = fileInput.files[0];
    if (!file) return;

    const submitBtn = $('submitOrderBtn');
    const statusEl = $('orderStatusText');

    const setStatus = (text, mode) => {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'tb-status';
      if (mode) statusEl.classList.add(mode);
    };

    submitBtn.disabled = true;
    
    // START: Reset truck state
    submitBtn.classList.remove('is-done', 'is-animating');
    void submitBtn.offsetWidth; // trigger reflow
    
    try {
      setStatus('Uploading design...', 'is-active');

      // 1. Upload to ImgBB
      const formData = new FormData();
      formData.append('image', file);

      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const imgbbData = await imgbbRes.json();

      if (!imgbbData.success) throw new Error("Image upload failed");
      const imageUrl = imgbbData.data.url;

      setStatus('Saving to ledger...', 'is-active');

      // 2. Save order to Firebase Firestore
      await addDoc(collection(db, 'orders'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        imageUrl: imageUrl,
        details: notesInput.value,
        status: 'Packaging', // New Default Status
        Delivered: '',       // Admin will edit this manually later
        timestamp: serverTimestamp()
      });

      // 3. Play Success Truck Animation
      submitBtn.classList.add('is-animating');
      setStatus('Packing your sticker order…', 'is-active');
      
      setTimeout(() => setStatus('Truck loaded — heading out…', 'is-active'), 650);
      setTimeout(() => setStatus('On the way to our workshop…', 'is-active'), 1400);

      setTimeout(() => {
        submitBtn.classList.remove('is-animating');
        submitBtn.classList.add('is-done');
        setStatus('Order placed ✓', 'is-done');
        
        // Refresh Orders Grid
        fetchLiveOrdersFromFirebase(currentUser);
        
        // Reset the form after success
        setTimeout(() => {
          submitBtn.classList.remove('is-done');
          submitBtn.disabled = false;
          orderForm.reset();
          setStatus('');
        }, 3000);
      }, 2250);

    } catch (error) {
      console.error("Order error:", error);
      setStatus('Failed to dispatch order. Try again.', 'is-error');
      submitBtn.disabled = false;
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
      
      // Go to profile on click
      $('navUser').addEventListener('click', () => window.location.href = 'auth.html?settings');
    } catch (error) {
      console.error("Error fetching profile metadata:", error);
    }
  } else {
    if ($('navSignIn')) {
        $('navSignIn').style.display = 'inline-block';
        $('navSignIn').addEventListener('click', () => window.location.href = 'auth.html');
    }
    if ($('navUser')) $('navUser').style.display = 'none';
  }

  fetchLiveOrdersFromFirebase(user);
});

// Mobile Nav Toggle
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