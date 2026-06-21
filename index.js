/* ================================
   CUSTOM DEMANDS — index.js
   ================================ */

['copy','cut','paste','selectstart','contextmenu'].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault(), { passive: false })
);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c','x','u','a','s','p'].includes(e.key.toLowerCase()))
    e.preventDefault();
});

/* ════════════════ STYLE CONFIG ════════════════ */
const STYLE_CFG = {
  kawaii:      { label: '🌸 Kawaii',       color: '#ff6b9d', bg: '#ff6b9d18' },
  chibi:       { label: '🥰 Chibi',        color: '#a855f7', bg: '#a855f718' },
  anime:       { label: '⚡ Anime',        color: '#f97316', bg: '#f9731618' },
  hellokitty:  { label: '🎀 Hello Kitty',  color: '#e8003a', bg: '#e8003a12' },
  harrypotter: { label: '🧙 Harry Potter', color: '#740001', bg: '#74000112' },
  marvel:      { label: '🦸 Marvel',       color: '#e62429', bg: '#e6242914' },
  anything:    { label: '✦ Custom',        color: '#059669', bg: '#05966918' },
  sticker:     { label: '✨ Sticker',      color: '#7c4dff', bg: '#7c4dff18' }
};

/* ════════════════ STATE ════════════════ */
const ITEMS_PER_PAGE = 10;
let activeFilter      = 'all';
let activePosterFilter = 'all';
let searchQuery       = '';
let currentPage       = 1;
let _visibleCache     = [];

function getStyles(item) {
  return Array.isArray(item.style) ? item.style : [item.style || 'sticker'];
}

/* ════════════════ SIZE SELECTOR HTML ════════════════ */
function buildSizeSelector(item, type) {
  const sizes   = item.sizes || ['2×2 in', '3×3 in', '4×4 in'];
  const uid     = `size-${type}-${item.id}`;
  const options = sizes.map(s => `<option value="${s}">${s}</option>`).join('');

  return `
    <div class="size-selector" data-uid="${uid}">
      <label class="size-label" for="${uid}">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
        Size
      </label>
      <div class="size-row">
        <select id="${uid}" class="size-select" onchange="onSizeChange(this,'${item.name}','${type}')">
          <option value="">Choose size…</option>
          ${options}
          <option value="custom">✏️ Custom size…</option>
        </select>
        <input type="text" class="size-custom-input" id="${uid}-custom"
               placeholder="e.g. 5×5 in" style="display:none"
               onkeydown="onCustomSizeKey(event,this,'${item.name}','${type}')"
               oninput="onCustomSizeInput(this)"/>
      </div>
    </div>`;
}

/* ════════════════ SIZE EVENTS ════════════════ */
function onSizeChange(sel, itemName, type) {
  const wrap       = sel.closest('.size-selector');
  const customInput = wrap.querySelector('.size-custom-input');

  if (sel.value === 'custom') {
    customInput.style.display = '';
    customInput.focus();
    return;
  }
  customInput.style.display = 'none';

  if (sel.value) {
    // Prefill contact form with item + size and scroll there
    prefillContact(itemName, sel.value, type);
    scrollToContact();
  }
}

function onCustomSizeKey(e, input, itemName, type) {
  if (e.key === 'Enter' && input.value.trim()) {
    prefillContact(itemName, input.value.trim(), type);
    scrollToContact();
  }
}

function onCustomSizeInput(input) {
  // Show a small "Go →" hint after 3 chars
  let hint = input.nextElementSibling;
  if (!hint || !hint.classList.contains('size-go')) {
    hint = document.createElement('button');
    hint.className = 'size-go';
    hint.textContent = 'Go →';
    hint.type = 'button';
    hint.onclick = () => {
      if (input.value.trim()) {
        const wrap = input.closest('.size-selector');
        const sel  = wrap.querySelector('.size-select');
        const itemNameAttr = sel?.onchange?.toString().match(/'([^']+)'/)?.[1] || '';
        prefillContact(itemNameAttr || '', input.value.trim(), 'sticker');
        scrollToContact();
      }
    };
    input.after(hint);
  }
  hint.style.display = input.value.trim().length >= 2 ? '' : 'none';
}

function prefillContact(itemName, size, type) {
  const msgEl = document.getElementById('cf-msg');
  if (!msgEl) return;
  const kind = type === 'poster' ? 'poster' : 'sticker';
  if (!msgEl.value.trim()) {
    msgEl.value = `I want to order: ${itemName} — ${kind}, size ${size}`;
  }
  msgEl.focus();
}

function scrollToContact() {
  const sec = document.getElementById('contact');
  if (sec) window.scrollTo({ top: sec.offsetTop - 80, behavior: 'smooth' });
}
window.onSizeChange     = onSizeChange;
window.onCustomSizeKey  = onCustomSizeKey;
window.onCustomSizeInput = onCustomSizeInput;

/* ════════════════ BUILD STICKER CARD ════════════════ */
function buildCard(item, index) {
  const styles    = getStyles(item);
  const primary   = styles[0];
  const cfg       = STYLE_CFG[primary] || STYLE_CFG.sticker;
  const delay     = ((index % 5) * 0.05).toFixed(2) + 's';
  const num       = String(item.id).padStart(2, '0');
  const stylesStr = styles.join(' ');

  const priceHTML = item.price != null
    ? `<div class="card-price">₹${item.price}</div>` : '';

  const stockHTML = item.inStock === false
    ? `<div class="card-stock out">Out of Stock</div>`
    : `<div class="card-stock in">In Stock</div>`;

  const imgHTML = item.image
    ? `<img src="${item.image}" alt="${item.name} custom sticker India" class="card-img" loading="lazy"
         onerror="this.outerHTML='<div class=\\'card-ph\\'><span class=\\'card-num\\'>${num}</span><p>Missing</p></div>'">`
    : `<div class="card-ph"><span class="card-num">${num}</span><p>Add Image</p></div>`;

  const badgesHTML = styles.map(s => {
    const c = STYLE_CFG[s] || STYLE_CFG.sticker;
    return `<span class="card-cat" style="color:${c.color};background:${c.bg};border:1px solid ${c.color}28">${c.label}</span>`;
  }).join('');

  return `
    <article class="card" style="animation-delay:${delay}" role="listitem"
             data-name="${item.name.toLowerCase()}"
             data-desc="${item.desc.toLowerCase()}"
             data-styles="${stylesStr}"
             itemscope itemtype="https://schema.org/Product">
      ${priceHTML}
      <div class="card-img-wrap">${stockHTML}${imgHTML}</div>
      <div class="card-body">
        <div class="card-cats">${badgesHTML}</div>
        ${buildSizeSelector(item, 'sticker')}
        <h3 class="card-name" itemprop="name">${item.name}</h3>
        <p  class="card-desc" itemprop="description">${item.desc}</p>
        <div class="card-btns">
          <a href="#contact" class="cbtn-order" style="background:${cfg.color};border-color:${cfg.color}" onclick="prefillContact('${item.name.replace(/'/g,"\\'")}','',  'sticker')">Order Now</a>
          <a href="#contact" class="cbtn-sec">Customise</a>
        </div>
      </div>
    </article>`;
}

/* ════════════════ BUILD POSTER CARD ════════════════ */
function buildPosterCard(item, index) {
  const styles    = getStyles(item);
  const primary   = styles[0];
  const cfg       = STYLE_CFG[primary] || STYLE_CFG.sticker;
  const delay     = ((index % 4) * 0.06).toFixed(2) + 's';
  const num       = String(item.id).padStart(3, '0');
  const stylesStr = styles.join(' ');

  const priceHTML = item.price != null
    ? `<div class="card-price">₹${item.price}</div>` : '';

  const stockHTML = item.inStock === false
    ? `<div class="card-stock out">Out of Stock</div>`
    : `<div class="card-stock in">In Stock</div>`;

  const imgHTML = item.image
    ? `<img src="${item.image}" alt="${item.name} custom wall poster India" class="card-img poster-img" loading="lazy"
         onerror="this.outerHTML='<div class=\\'card-ph\\'><span class=\\'card-num\\'>${num}</span><p>Missing</p></div>'">`
    : `<div class="card-ph"><span class="card-num">${num}</span><p>Add Image</p></div>`;

  const badgesHTML = styles.map(s => {
    const c = STYLE_CFG[s] || STYLE_CFG.sticker;
    return `<span class="card-cat" style="color:${c.color};background:${c.bg};border:1px solid ${c.color}28">${c.label}</span>`;
  }).join('');

  return `
    <article class="card poster-card" style="animation-delay:${delay}" role="listitem"
             data-name="${item.name.toLowerCase()}"
             data-styles="${stylesStr}"
             itemscope itemtype="https://schema.org/Product">
      ${priceHTML}
      <div class="card-img-wrap poster-wrap">${stockHTML}${imgHTML}</div>
      <div class="card-body">
        <div class="card-cats">${badgesHTML}</div>
        ${buildSizeSelector(item, 'poster')}
        <h3 class="card-name" itemprop="name">${item.name}</h3>
        <p  class="card-desc" itemprop="description">${item.desc}</p>
        <div class="card-btns">
          <a href="#contact" class="cbtn-order" style="background:${cfg.color};border-color:${cfg.color}" onclick="prefillContact('${item.name.replace(/'/g,"\\'")}','','poster')">Order Poster</a>
          <a href="#contact" class="cbtn-sec">Custom Size</a>
        </div>
      </div>
    </article>`;
}

/* ════════════════ RENDER STICKERS ════════════════ */
function renderStickers() {
  const grid = document.getElementById('stickerGrid');
  if (!grid) return;
  if (typeof STICKERS === 'undefined' || !STICKERS.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px">No stickers — check data/stickers.js is loaded.</p>';
    return;
  }
  grid.innerHTML = STICKERS.map((item, i) => buildCard(item, i)).join('');
}

/* ════════════════ RENDER POSTERS ════════════════ */
function renderPosters() {
  const grid = document.getElementById('posterGrid');
  if (!grid) return;
  if (typeof POSTERS === 'undefined' || !POSTERS.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:40px">No posters yet — check data/posters.js is loaded.</p>';
    return;
  }
  grid.innerHTML = POSTERS.map((item, i) => buildPosterCard(item, i)).join('');
  applyPosterFilter();
}

/* ════════════════ STICKER FILTER + SEARCH + PAGINATION ════════════════ */
function applyFilters(resetPageFlag = true) {
  const grid    = document.getElementById('stickerGrid');
  const emptyEl = document.getElementById('emptyState');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;

  if (resetPageFlag) currentPage = 1;

  const all = Array.from(grid.querySelectorAll('.card'));
  _visibleCache = all.filter(card => {
    const cardStyles = card.dataset.styles.split(' ');
    const styleMatch = activeFilter === 'all' || cardStyles.includes(activeFilter);
    if (!styleMatch) return false;
    if (!searchQuery) return true;
    return card.dataset.name.includes(searchQuery) || card.dataset.desc.includes(searchQuery);
  });

  const total      = _visibleCache.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end   = start + ITEMS_PER_PAGE;

  requestAnimationFrame(() => {
    all.forEach(c => (c.style.display = 'none'));
    _visibleCache.forEach((c, i) => { if (i >= start && i < end) c.style.display = ''; });
  });

  if (countEl) {
    countEl.textContent = (searchQuery || activeFilter !== 'all')
      ? `${total} sticker${total !== 1 ? 's' : ''} found`
      : total > ITEMS_PER_PAGE ? `Showing ${start + 1}–${Math.min(end, total)} of ${total}` : '';
  }
  if (emptyEl) emptyEl.style.display = total === 0 ? '' : 'none';
  renderPagination(totalPages);
}

/* ════════════════ POSTER FILTER ════════════════ */
function applyPosterFilter() {
  const grid = document.getElementById('posterGrid');
  if (!grid) return;
  const all = Array.from(grid.querySelectorAll('.card'));
  all.forEach(card => {
    const cardStyles = card.dataset.styles.split(' ');
    const show = activePosterFilter === 'all' || cardStyles.includes(activePosterFilter);
    card.style.display = show ? '' : 'none';
  });
}

function initPosterFilters() {
  document.querySelectorAll('[data-postfilter]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-postfilter]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePosterFilter = pill.dataset.postfilter;
      applyPosterFilter();
    });
  });
}

/* ════════════════ PAGINATION ════════════════ */
function renderPagination(totalPages) {
  let el = document.getElementById('stickerPagination');
  if (totalPages <= 1) { if (el) el.style.display = 'none'; return; }

  if (!el) {
    el = document.createElement('div');
    el.id = 'stickerPagination';
    el.className = 'pagination';
    document.getElementById('stickerGrid').after(el);
  }
  el.style.display = '';

  const range = 2;
  let pageButtons = '';
  let prevEllipsis = false;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
      prevEllipsis = false;
      pageButtons += `<button class="pag-num${i === currentPage ? ' active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (!prevEllipsis) {
      prevEllipsis = true;
      pageButtons += `<span class="pag-dots">…</span>`;
    }
  }
  el.innerHTML = `
    <button class="pag-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg> Prev
    </button>
    <div class="pag-pages">${pageButtons}</div>
    <button class="pag-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
}

function changePage(n) {
  currentPage = n;
  applyFilters(false);
  const sec = document.getElementById('stickers');
  if (sec) window.scrollTo({ top: sec.offsetTop - 80, behavior: 'smooth' });
}
window.changePage = changePage;

/* ════════════════ RESET ════════════════ */
function resetFilters() {
  activeFilter = 'all'; searchQuery = ''; currentPage = 1;
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  if (input) input.value = '';
  if (clear) clear.style.display = 'none';
  document.querySelectorAll('.fpill[data-filter]').forEach(p =>
    p.classList.toggle('active', p.dataset.filter === 'all')
  );
  applyFilters(false);
}
window.resetFilters = resetFilters;

/* ════════════════ SEARCH ════════════════ */
function initSearch() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = input.value.trim().toLowerCase();
      clearBtn.style.display = searchQuery ? '' : 'none';
      applyFilters();
    }, 120);
  });
  clearBtn.addEventListener('click', () => {
    input.value = ''; searchQuery = '';
    clearBtn.style.display = 'none';
    input.focus(); applyFilters();
  });
}

/* ════════════════ FILTER PILLS (stickers) ════════════════ */
function initFilters() {
  document.querySelectorAll('.fpill[data-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.fpill[data-filter]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      applyFilters();
    });
  });
}

/* ════════════════ TESTIMONIALS ════════════════ */
function buildTestimonialCard(t, i) {
  const cfg      = STYLE_CFG[t.style] || STYLE_CFG.sticker;
  const delay    = ((i % 3) * 0.08).toFixed(2) + 's';
  const filled   = Math.min(t.rating || 5, 5);
  const stars    = '★'.repeat(filled) + '☆'.repeat(5 - filled);
  const initials = (t.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const mediaHTML = (t.media && t.mediaType === 'image')
    ? `<div class="tcard-media"><img src="${t.media}" alt="Customer review — ${t.name}" loading="lazy" onerror="this.parentElement.style.display='none'"/></div>` : '';
  const handleHTML = t.handle ? `<span class="tcard-handle">${t.handle}</span>` : '';
  return `
    <div class="tcard" style="animation-delay:${delay}" itemscope itemtype="https://schema.org/Review">
      <div class="tcard-top">
        <svg class="tcard-quote" viewBox="0 0 40 30" fill="currentColor"><path d="M0 30V18C0 7.163 5.373 1.373 16.12 0l2.24 3.36C13.147 4.8 10.24 7.787 9.6 12.48H16V30H0zm22 0V18C22 7.163 27.373 1.373 38.12 0l2.24 3.36C35.147 4.8 32.24 7.787 31.6 12.48H38V30H22z"/></svg>
        <div class="tcard-stars" aria-label="${filled} out of 5 stars">${stars}</div>
      </div>
      <p class="tcard-text" itemprop="reviewBody">${t.text}</p>
      ${mediaHTML}
      <div class="tcard-footer">
        <div class="tcard-avatar" style="background:${cfg.color}">${initials}</div>
        <div class="tcard-info">
          <span class="tcard-name" itemprop="author">${t.name}</span>
          ${handleHTML}
          <span class="tcard-date">${t.date || ''}</span>
        </div>
        <span class="tcard-badge" style="color:${cfg.color};background:${cfg.bg};border:1px solid ${cfg.color}28">${cfg.label}</span>
      </div>
    </div>`;
}

function renderTestimonials() {
  const grid  = document.getElementById('testimonialGrid');
  const empty = document.getElementById('testimonialEmpty');
  if (!grid) return;
  if (typeof TESTIMONIALS === 'undefined' || !TESTIMONIALS.length) {
    if (empty) empty.style.display = ''; return;
  }
  grid.innerHTML = TESTIMONIALS.map((t, i) => buildTestimonialCard(t, i)).join('');
}

/* ════════════════ CONTACT FORM ════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const email1  = document.getElementById('cf-email');
  const email2  = document.getElementById('cf-email2');
  const msg     = document.getElementById('cf-msg');
  const btnText = document.getElementById('cfBtnText');
  const spinner = document.getElementById('cfBtnSpinner');
  const submit  = document.getElementById('cfSubmit');
  const success = document.getElementById('cfSuccess');

  const setErr = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const clearErrs = () => {
    ['err-email','err-email2','err-msg'].forEach(id => setErr(id, ''));
    [email1, email2, msg].forEach(el => el?.classList.remove('input-err'));
  };
  const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  email2?.addEventListener('input', () => {
    if (email2.value && email1.value && email2.value !== email1.value) {
      setErr('err-email2', 'Emails do not match');
      email2.classList.add('input-err');
    } else {
      setErr('err-email2', '');
      email2.classList.remove('input-err');
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(); success.style.display = 'none';
    let valid = true;
    if (!email1.value || !isValidEmail(email1.value)) {
      setErr('err-email', 'Please enter a valid email address');
      email1.classList.add('input-err'); valid = false;
    }
    if (!email2.value || !isValidEmail(email2.value)) {
      setErr('err-email2', 'Please confirm your email address');
      email2.classList.add('input-err'); valid = false;
    } else if (email1.value !== email2.value) {
      setErr('err-email2', 'Emails do not match');
      email2.classList.add('input-err'); valid = false;
    }
    if (!msg.value.trim() || msg.value.trim().length < 10) {
      setErr('err-msg', 'Please write a message (at least 10 characters)');
      msg.classList.add('input-err'); valid = false;
    }
    if (!valid) return;

    submit.disabled = true; btnText.style.display = 'none'; spinner.style.display = '';
    try {
      const data = new FormData(form);
      data.delete('_confirmEmail');
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } });
      if (res.ok || res.status === 200) { success.style.display = ''; form.reset(); }
      else form.submit();
    } catch { form.submit(); }
    finally { submit.disabled = false; btnText.style.display = ''; spinner.style.display = 'none'; }
  });
}

/* ════════════════ NAV AUTH ════════════════ */
function initNavAuth() {
  const navUser     = document.getElementById('navUser');
  const navSignIn   = document.getElementById('navSignIn');
  const navAvatar   = document.getElementById('navAvatarCircle');
  const navUsername = document.getElementById('navUsernameText');
  const navLogout   = document.getElementById('navLogout');
  const mobSection  = document.getElementById('mobUserSection');
  if (!navUser || !navSignIn) return;
  try {
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        let username = user.displayName || 'user';
        try {
          const snap = await firebase.database().ref('users/' + user.uid + '/username').once('value');
          if (snap.exists() && snap.val()) username = snap.val();
        } catch(e) {}
        const initials = username.slice(0, 2).toUpperCase();
        const photo    = user.photoURL;
        if (navAvatar) navAvatar.innerHTML = photo ? `<img src="${photo}" alt="${username}" referrerpolicy="no-referrer"/>` : initials;
        if (navUsername) navUsername.textContent = '@' + username;
        navUser.style.display = 'flex'; navSignIn.style.display = 'none';
        if (mobSection) {
          mobSection.innerHTML = `
            <div class="mob-user-row">
              <div class="mob-avatar">${photo ? `<img src="${photo}" alt="${username}" referrerpolicy="no-referrer"/>` : initials}</div>
              <div class="mob-user-info"><div class="mob-user-name">@${username}</div><div class="mob-user-sub">${user.email || ''}</div></div>
              <a href="auth.html?settings" class="mob-settings-link" onclick="closeMob()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              </a>
              <button class="mob-logout-btn" id="mobLogoutBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>`;
          document.getElementById('mobLogoutBtn')?.addEventListener('click', doNavSignOut);
        }
        navLogout?.addEventListener('click', doNavSignOut);
      } else {
        navUser.style.display = 'none'; navSignIn.style.display = '';
        if (mobSection) mobSection.innerHTML = `<div class="mob-signin-row"><a href="auth.html" onclick="closeMob()">Sign In to Your Account</a></div>`;
      }
    });
  } catch(e) { navSignIn.style.display = ''; }
}
async function doNavSignOut() {
  try { await firebase.auth().signOut(); } catch(e) {}
  location.reload();
}

/* ════════════════ NAV ════════════════ */
function initNav() {
  const nav = document.getElementById('mainNav');
  const ham = document.getElementById('ham');
  const mobMenu = document.getElementById('mobMenu');

  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

  if (ham && mobMenu) {
    ham.addEventListener('click', e => {
      e.stopPropagation();
      const open = mobMenu.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', e => {
      if (!ham.contains(e.target) && !mobMenu.contains(e.target)) closeMob();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); closeMob(); window.scrollTo({ top: t.offsetTop - 74, behavior: 'smooth' }); }
    });
  });
}

function closeMob() {
  const ham = document.getElementById('ham');
  const mobMenu = document.getElementById('mobMenu');
  if (mobMenu) mobMenu.classList.remove('open');
  if (ham) { ham.classList.remove('open'); ham.setAttribute('aria-expanded', 'false'); }
}
window.closeMob = closeMob;
window.prefillContact = prefillContact;

/* ════════════════ BOOT ════════════════ */
function boot() {
  renderStickers();
  applyFilters(false);
  renderPosters();
  renderTestimonials();
  initSearch();
  initFilters();
  initPosterFilters();
  initNav();
  initNavAuth();
  initContactForm();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();