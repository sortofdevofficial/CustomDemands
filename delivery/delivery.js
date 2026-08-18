import { 
  auth, db, googleProvider, signInWithPopup, onAuthStateChanged, 
  collection, query, onSnapshot, doc, updateDoc, serverTimestamp, deleteField 
} from '../firebase.js';

const $ = id => document.getElementById(id);

let activeWatchId = null;
let activeTrackingOrderId = null;

if ($('driverSignInBtn')) {
  $('driverSignInBtn').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Driver Sign-In Error:", err);
      alert("Sign in failed. Please try again.");
    }
  });
}

function renderDriverOrderCard(order) {
  const isTrackingThis = activeTrackingOrderId === order.id;
  const orderTitle = order.orderNo ? `Order #${order.orderNo}` : `Order ID: ${order.id.slice(0, 8)}`;

  return `
    <div class="order-card" id="driver-card-${order.id}">
      <div class="order-header">
        <strong>${orderTitle}</strong>
        <span class="order-status status-${(order.status || 'packaging').toLowerCase().replace(/\s+/g, '-')}">${order.status || 'Packaging'}</span>
      </div>
      
      ${order.imageUrl ? `
        <div class="order-img-wrap">
          <img src="${order.imageUrl}" alt="Order item" class="order-img" />
        </div>` : ''}

      <div class="order-body">
        <p><strong>Details:</strong> ${order.details || 'Custom Sticker'}</p>
        <p><strong>Customer Email:</strong> ${order.userEmail || 'N/A'}</p>
        
        <div style="margin-top:15px; display:flex; flex-direction:column; gap:10px;">
          <label style="font-family:var(--font-mono); font-size:0.75rem; text-transform:uppercase;">Update Status:</label>
          <select id="status-select-${order.id}" class="ainput" style="padding:8px;">
            <option value="Packaging" ${order.status === 'Packaging' ? 'selected' : ''}>Packaging</option>
            <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>

          <button onclick="window.updateOrderStatus('${order.id}')" class="btn-secondary" style="justify-content:center; padding:8px;">
            Save Status
          </button>

          ${order.status === 'Out for Delivery' ? `
            <button onclick="window.toggleGpsBroadcast('${order.id}')" class="${isTrackingThis ? 'btn-primary' : 'btn-secondary'}" style="justify-content:center; background:${isTrackingThis ? '#2F6B4F' : ''}; color:${isTrackingThis ? '#fff' : ''};">
              ${isTrackingThis ? 'Stop GPS Broadcast' : 'Start Live GPS Broadcast'}
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

window.updateOrderStatus = async (orderId) => {
  const select = document.getElementById(`status-select-${orderId}`);
  if (!select) return;

  const isNowDelivered = select.value === 'Delivered';

  try {
    if (isNowDelivered && activeTrackingOrderId === orderId) {
      stopGpsBroadcast();
    }

    const orderRef = doc(db, 'orders', orderId);
    const update = {
      status: select.value,
      Delivered: isNowDelivered ? 'Completed' : 'Pending Delivery'
    };

    if (isNowDelivered) {
      update.driverLat = deleteField();
      update.driverLng = deleteField();
      update.driverSpeed = deleteField();
      update.lastGpsUpdate = deleteField();
      update.deliveredTime = serverTimestamp(); 
    }

    await updateDoc(orderRef, update);
    alert(`Status updated to ${select.value}`);
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status.");
  }
};

window.toggleGpsBroadcast = (orderId) => {
  if (activeTrackingOrderId === orderId) {
    stopGpsBroadcast();
    return;
  }
  startGpsBroadcast(orderId);
};

function startGpsBroadcast(orderId) {
  if (!navigator.geolocation) {
    alert("GPS Geolocation is not supported by your browser.");
    return;
  }

  stopGpsBroadcast();

  activeTrackingOrderId = orderId;
  $('gpsBadge').textContent = 'GPS Live Broadcast Active';
  $('gpsBadge').className = 'order-status status-delivered';

  activeWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const { latitude, longitude, speed } = pos.coords;
      const speedKmH = speed ? `${Math.round(speed * 3.6)} km/h` : 'Moving';

      $('driverCoords').textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      $('driverSpeed').textContent = speedKmH;

      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          driverLat: latitude,
          driverLng: longitude,
          driverSpeed: speedKmH,
          lastGpsUpdate: serverTimestamp()
        });
      } catch (err) {
        console.error("Error sending GPS updates:", err);
      }
    },
    (err) => {
      console.error("GPS Broadcast Error:", err);
      alert("GPS Error: " + err.message);
      stopGpsBroadcast();
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

function stopGpsBroadcast() {
  if (activeWatchId !== null) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }
  activeTrackingOrderId = null;
  if ($('gpsBadge')) {
    $('gpsBadge').textContent = 'GPS Offline';
    $('gpsBadge').className = 'order-status status-packaging';
  }
  if ($('driverCoords')) $('driverCoords').textContent = 'Broadcasting stopped.';
}

function listenToAllOrdersForDrivers() {
  const container = $('driverOrdersContainer');
  if (!container) return;

  const q = query(collection(db, 'orders'));
  onSnapshot(q, (snap) => {
    let orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));

    orders.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

    if (orders.length === 0) {
      container.innerHTML = `<p>No orders currently in system.</p>`;
      return;
    }

    container.innerHTML = `<div class="orders-grid">${orders.map(renderDriverOrderCard).join('')}</div>`;
  }, (err) => {
    console.error("Error loading driver orders:", err);
    container.innerHTML = `<p style="color:var(--stamp);">Failed to load dispatch orders.</p>`;
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if ($('driverSignInBtn')) $('driverSignInBtn').style.display = 'none';
    if ($('driverUser')) $('driverUser').style.display = 'flex';
    if ($('driverName')) $('driverName').textContent = user.displayName || user.email;
    if ($('driverAvatar')) $('driverAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}`;
  } else {
    if ($('driverSignInBtn')) $('driverSignInBtn').style.display = 'inline-block';
    if ($('driverUser')) $('driverUser').style.display = 'none';
  }
  listenToAllOrdersForDrivers();
});