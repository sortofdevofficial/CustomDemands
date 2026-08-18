import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  doc, getDoc, collection, addDoc, query, where, onSnapshot, getDocs, serverTimestamp 
} from '../firebase.js';

const $ = id => document.getElementById(id);
const IMGBB_API_KEY = "c98dd32e4c593b29c792c38630d3e10a"; 

let currentUser = null;
let activeMaps = {};

if ($('navSignIn')) {
  $('navSignIn').addEventListener('click', () => {
    window.location.href = '../auth/auth.html';
  });
}

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

  const timestamp = d.timestamp ? (d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp)) : null;
  const dateText = timestamp && !isNaN(timestamp) ? timestamp.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
  const deliveredText = d.Delivered ? d.Delivered : 'Pending Delivery';
  const isOutForDelivery = rawStatus.toLowerCase() === 'out for delivery';
  const orderTitle = d.orderNo ? `Order #${d.orderNo}` : `Order #${d.id.slice(0, 8)}`;

  return `
    <div class="order-card" id="card-${d.id}">
      <div class="order-header">
        <strong>${orderTitle} | ${dateText}</strong>
        <span class="order-status ${statusClass}">${rawStatus}</span>
      </div>
      ${imageHTML}
      <div class="order-body">
        <p><strong>Details:</strong> ${d.details || 'Custom sticker'}</p>
        <p><strong>Status:</strong> ${deliveredText}</p>
        
        ${isOutForDelivery ? `
          <div class="driver-status-badge">
            <span class="pulse-dot"></span> Driver Location Active
          </div>
          <div class="tracker-wrap">
            <div class="tracker-header">
              <span>Live Delivery Route</span>
              <span id="speed-${d.id}">${d.driverSpeed || 'Moving'}</span>
            </div>
            <div id="map-${d.id}" class="tracker-map"></div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function updateLiveMap(orderId, lat, lng) {
  const container = document.getElementById(`map-${orderId}`);
  if (!container || typeof L === 'undefined') return;

  const coords = [lat || 28.6139, lng || 77.2090];

  if (activeMaps[orderId]) {
    activeMaps[orderId].marker.setLatLng(coords);
    activeMaps[orderId].map.panTo(coords, { animate: true, duration: 1.0 });
  } else {
    const map = L.map(`map-${orderId}`).setView(coords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const marker = L.marker(coords).addTo(map)
      .bindPopup('Your driver is here!')
      .openPopup();

    activeMaps[orderId] = { map, marker };
  }
}

function listenToLiveOrdersFromFirebase(user) {
  const ordersContainer = $('userOrdersContainer');
  if (!ordersContainer || !user) return;

  const q = query(collection(db, 'orders'), where('userId', '==', user.uid));

  onSnapshot(q, (snap) => {
    let orders = [];
    snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

    orders.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    if (orders.length === 0) {
      ordersContainer.innerHTML = `<p style="color:var(--ink-muted);">No sticker orders found for <strong>${user.email}</strong> yet.</p>`;
      return;
    }

    ordersContainer.innerHTML = `<div class="orders-grid">${orders.map(renderOrderCard).join('')}</div>`;

    orders.forEach(order => {
      if ((order.status || '').toLowerCase() === 'out for delivery' && order.driverLat) {
        setTimeout(() => updateLiveMap(order.id, order.driverLat, order.driverLng), 100);
      }
    });
  }, (err) => {
    console.error("Error listening to live orders:", err);
    ordersContainer.innerHTML = `<p style="color:var(--stamp);">Couldn't load live tracking data.</p>`;
  });
}

const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateCount(el, to) {
  if (!el) return;
  const from = parseInt(el.textContent, 10) || 0;
  if (prefersReducedMotion || from === to) { el.textContent = to; return; }
  const duration = 650;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function fetchPlatformStats() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const ordersSnap = await getDocs(collection(db, 'orders'));
    
    if($('totalUsersCount')) animateCount($('totalUsersCount'), usersSnap.size);
    if($('totalOrdersCount')) animateCount($('totalOrdersCount'), ordersSnap.size);
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}
fetchPlatformStats();

const orderForm = $('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in to place an order.");
      window.location.href = '../auth/auth.html';
      return;
    }

    const fileInput = $('stickerUpload');
    const notesInput = $('orderNotes');
    const file = fileInput.files[0];

    const submitBtn = $('submitOrderBtn');
    const statusEl = $('orderStatusText');

    const setStatus = (text, mode) => {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'tb-status';
      if (mode) statusEl.classList.add(mode);
    };

    submitBtn.disabled = true;
    submitBtn.classList.remove('is-done', 'is-animating');
    void submitBtn.offsetWidth;
    
    try {
      let finalImageUrl = null;

      if (file) {
        setStatus('Uploading design...', 'is-active');
        const formData = new FormData();
        formData.append('image', file);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });
        const imgbbData = await imgbbRes.json();
        if (!imgbbData.success) throw new Error("Image upload failed");
        finalImageUrl = imgbbData.data.url;
      }

      setStatus('Saving to ledger...', 'is-active');

      const ordersSnap = await getDocs(collection(db, 'orders'));
      const nextOrderNo = ordersSnap.size + 1;

      await addDoc(collection(db, 'orders'), {
        orderNo: nextOrderNo,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        imageUrl: finalImageUrl,
        details: notesInput.value,
        status: 'Packaging',
        Delivered: 'Pending Delivery',
        driverLat: 28.6139,
        driverLng: 77.2090,
        driverSpeed: '0 km/h',
        timestamp: serverTimestamp(),
        orderSentTime: serverTimestamp() 
      });

      submitBtn.classList.add('is-animating');
      setStatus('Packing your sticker order…', 'is-active');
      
      setTimeout(() => setStatus('Truck loaded — heading out…', 'is-active'), 600);
      setTimeout(() => setStatus('Racing to the workshop…', 'is-active'), 1300);

      setTimeout(() => {
        submitBtn.classList.remove('is-animating');
        submitBtn.classList.add('is-done');
        setStatus(`Order #${nextOrderNo} submitted ✓ — give us ~1 day, then track your driver live below`, 'is-done');
        
        fetchPlatformStats();
        
        setTimeout(() => {
          submitBtn.classList.remove('is-done');
          submitBtn.disabled = false;
          orderForm.reset();
          setStatus('');
        }, 4500);
      }, 2150);

    } catch (error) {
      console.error("Order error:", error);
      setStatus('Failed to dispatch order. Try again.', 'is-error');
      submitBtn.disabled = false;
    }
  });
}

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const userData = snap.exists() ? snap.data() : null;
      const uname = userData ? userData.username : null;
      const displayUname = uname || user.displayName || user.email.split('@')[0];
      
      if ($('navUsernameText')) $('navUsernameText').textContent = '@' + displayUname;
      if ($('navAvatar')) $('navAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUname)}&background=1E2621&color=ECE6D6`;
      if ($('navSignIn')) $('navSignIn').style.display = 'none';
      if ($('navUser')) $('navUser').style.display = 'flex';
      
      if ($('dashboardSection')) {
        $('dashboardSection').style.display = 'block';

        let createdText = 'Unknown';
        if (userData && userData.createdAt) {
          const createdDate = new Date(userData.createdAt);
          if (!isNaN(createdDate)) {
            createdText = createdDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
          }
        }

        let myOrdersCount = '…';
        try {
          const myOrdersSnap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid)));
          myOrdersCount = myOrdersSnap.size;
        } catch (e) {
          console.error("Error counting user's orders:", e);
          myOrdersCount = '—';
        }

        $('profileDetails').innerHTML = `
           <strong>Email:</strong> ${user.email} <br/> 
           <strong>Username:</strong> @${displayUname} <br/>
           <strong>Account ID:</strong> ${user.uid} <br/>
           <strong>Member Since:</strong> ${createdText} <br/>
           <strong>Total Orders (this account):</strong> ${myOrdersCount}
        `;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  } else {
    if ($('navSignIn')) $('navSignIn').style.display = 'inline-block';
    if ($('navUser')) $('navUser').style.display = 'none';
    if ($('dashboardSection')) $('dashboardSection').style.display = 'none';
    if ($('userOrdersContainer')) $('userOrdersContainer').innerHTML = `<p style="color:var(--ink-faint);">Sign in to see your order history and live tracking.</p>`;
  }

  listenToLiveOrdersFromFirebase(user);
});

const navToggle = $('navToggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

const navEl = document.querySelector('.nav');
if (navEl) {
  const onNavScroll = () => navEl.classList.toggle('is-scrolled', window.scrollY > 8);
  onNavScroll();
  window.addEventListener('scroll', onNavScroll, { passive: true });
}

const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
if (revealEls.length) {
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }
}