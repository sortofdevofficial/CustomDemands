/* ================================
   CUSTOM DEMANDS — Main Logic
   ================================ */

// Security / Anti-theft
['copy','cut','paste','selectstart','contextmenu'].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault(), { passive: false })
);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c','x','u','a','s','p'].includes(e.key.toLowerCase()))
    e.preventDefault();
});

/* ══════════ DATA FALLBACKS ══════════ */
// Using placeholder data if data/ files fail to load
const fallbackStickers = [
  { id: 1, name: "Naruto Uzumaki", desc: "Hokage style sticker", styles: ["anime"], price: 25 },
  { id: 2, name: "Pikachu Cute", desc: "Classic yellow mouse", styles: ["kawaii", "chibi"], price: 15 },
  { id: 3, name: "Gryffindor Crest", desc: "Hogwarts house crest", styles: ["harrypotter"], price: 30 }
];
const fallbackPosters = [
  { id: 1, name: "Avengers Assemble", desc: "A3 glossy MCU poster", styles: ["marvel"], price: 149 },
  { id: 2, name: "Gojo Satoru Domain", desc: "JJK A2 poster", styles: ["anime"], price: 199 }
];

const stData = typeof STICKERS !== 'undefined' ? STICKERS : fallbackStickers;
const ptData = typeof POSTERS !== 'undefined' ? POSTERS : fallbackPosters;

/* ══════════ HTML GENERATORS ══════════ */

function buildSizeSelector(item, type) {
  const sizes = item.sizes || ['2×2 in', '3×3 in', '4×4 in'];
  const options = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
  return `
    <div class="size-selector">
      <select class="size-select" id="size-${type}-${item.id}">
        <option value="">Select Size...</option>
        ${options}
        <option value="Custom Size">Custom Size (Tell us in form)</option>
      </select>
    </div>`;
}

function generateOrderAction(itemName, type, itemId) {
  return `onclick="processOrder('${itemName.replace(/'/g,"\\'")}', '${type}', '${itemId}')"`;
}

// Global Order Processor -> Copies to clipboard and opens Google form
window.processOrder = function(itemName, type, itemId) {
  const selectEl = document.getElementById(`size-${type}-${itemId}`);
  const size = selectEl ? selectEl.value : "Default";
  
  if(!size) {
    alert("Please select a size first!");
    selectEl.focus();
    return;
  }

  const orderString = `Hello! I would like to order:\n\nItem: ${itemName}\nType: ${type.toUpperCase()}\nSize: ${size}\n\n`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(orderString).then(() => {
    alert(`✅ Order details copied to clipboard!\n\n"${orderString.trim()}"\n\nRedirecting you to the Google Order Form. Please paste the details there!`);
    window.open("https://forms.gle/F4xaUFUTsSJaR2EcA", "_blank");
  }).catch(err => {
    // Fallback if clipboard fails
    alert(`Please enter these details in the form:\nItem: ${itemName} | Size: ${size}`);
    window.open("https://forms.gle/F4xaUFUTsSJaR2EcA", "_blank");
  });
};

function buildCard(item, type) {
  const stylesStr = (item.styles || []).join(' ');
  const priceHTML = item.price ? `<div style="font-weight:800; color:var(--accent); margin-bottom:8px;">₹${item.price}</div>` : '';
  const imgUrl = item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=F3F4F6&color=111827&size=250`;

  return `
    <article class="card" data-styles="${stylesStr.toLowerCase()}">
      <div class="card-img-wrap">
        <img src="${imgUrl}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-name">${item.name}</h3>
        <p class="card-desc">${item.desc}</p>
        ${priceHTML}
        ${buildSizeSelector(item, type)}
        <button class="cbtn-order" ${generateOrderAction(item.name, type, item.id)}>Proceed to Order</button>
      </div>
    </article>`;
}

/* ══════════ RENDERING & FILTERING ══════════ */

function renderGrid(containerId, data, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = data.map(item => buildCard(item, type)).join('');
}

function initFilters(pillContainerId, gridId) {
  const pills = document.querySelectorAll(`#${pillContainerId} .fpill`);
  const cards = document.querySelectorAll(`#${gridId} .card`);
  
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      // Toggle Active Class
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      const filter = pill.getAttribute('data-filter') || pill.getAttribute('data-postfilter');
      
      // Filter Logic
      cards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-styles').includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  renderGrid('stickerGrid', stData, 'sticker');
  renderGrid('posterGrid', ptData, 'poster');
  initFilters('filterPills', 'stickerGrid');
  initFilters('posterFilterPills', 'posterGrid');
});