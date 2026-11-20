// Emara : menu, recherche, panier, favoris, filtres, fiche produit
(function () {
  const D = window.EMARA || [];
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // ---------- panneaux (menu, panier, recherche) ----------
  const ov = $('#ov');
  let ouvert = null;
  function ouvrir(el) { fermer(); ouvert = el; el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); ov.hidden = false; document.body.style.overflow = 'hidden'; }
  function fermer() { if (!ouvert) return; ouvert.classList.remove('open'); ouvert.setAttribute('aria-hidden', 'true'); ov.hidden = true; document.body.style.overflow = ''; ouvert = null; }
  ov.addEventListener('click', fermer);
  addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
  $('#menu-btn').addEventListener('click', () => ouvrir($('#menu')));
  $('#search-btn').addEventListener('click', () => { ouvrir($('#search')); setTimeout(() => $('#q').focus(), 50); chercher(''); });
  $('#cart-btn').addEventListener('click', () => { rendrePanier(); ouvrir($('#cartd')); });

  // ---------- recherche ----------
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function chercher(q) {
    const t = norm(q.trim());
    const r = D.filter(p => !t || norm(p.n + ' ' + p.c + ' ' + p.cols.join(' ')).includes(t));
    $('#res').innerHTML = r.length
      ? r.map(p => `<a href="${p.url}"><img src="${p.img}" alt="" loading="lazy"><p>${esc(p.n)}</p></a>`).join('')
      : '<p style="grid-column:1/-1;color:#6F6359">Aucune pièce ne correspond à ta recherche.</p>';
  }
  $('#q').addEventListener('input', e => chercher(e.target.value));

  // ---------- panier ----------
  let panier = store.get('emara-panier-v2', []);
  const nb = () => panier.reduce((s, x) => s + x.q, 0);
  function majPanier() { store.set('emara-panier-v2', panier); $('#cart').textContent = nb(); }
  function rendrePanier() {
    const box = $('#cart-items');
    $('#cart-n').textContent = nb();
    if (!panier.length) { box.innerHTML = '<p style="text-align:center;color:#6F6359;padding:40px 0">Ton panier est vide.</p>'; return; }
    box.innerHTML = panier.map((x, k) => { const p = D[x.id]; return `<div class="ci">
      <a href="${p.url}"><img src="${x.img || p.img}" alt=""></a>
      <div><p class="nm">${esc(p.n)}</p><div class="sub">${esc(x.col)} · Taille ${esc(x.size)}<br>[PRIX] €</div>
        <div class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="Retirer un">−</button><span>${x.q}</span><button type="button" data-q="${k}" data-d="1" aria-label="Ajouter un">+</button></div></div>
      <button class="rm" type="button" data-rm="${k}">Retirer</button></div>`; }).join('');
  }
  $('#cart-items').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rm) panier.splice(+b.dataset.rm, 1);
    if (b.dataset.q) { const x = panier[+b.dataset.q]; x.q += +b.dataset.d; if (x.q < 1) panier.splice(+b.dataset.q, 1); }
    majPanier(); rendrePanier();
  });
  $('#checkout').addEventListener('click', () => { $('#checkout-msg').hidden = false; });
  majPanier();

  // ---------- favoris ----------
  let favs = store.get('emara-favoris', []);
  function majFavs() {
    store.set('emara-favoris', favs);
    const c = $('#favc'); c.textContent = favs.length; c.hidden = !favs.length;
    $$('[data-pid].card .fav, .wish[data-pid]').forEach(b => {
      const id = +(b.dataset.pid ?? b.closest('.card').dataset.pid); const on = favs.includes(id);
      b.classList.toggle('liked', on); b.style.color = on ? '#9E1E45' : ''; b.setAttribute('aria-pressed', on);
    });
  }
  function basculerFav(id) { favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id]; majFavs(); rendreFavoris(); }
  function rendreFavoris() {
    const g = $('#fav-grid'); if (!g) return;
    g.innerHTML = favs.map(id => window.EMARA_CARDS[id]).join('');
    $('#fav-empty').hidden = favs.length > 0;
    majFavsBoutons();
  }
  function majFavsBoutons() { $$('#fav-grid .fav').forEach(b => { b.classList.add('liked'); b.style.color = '#9E1E45'; }); }
  majFavs(); rendreFavoris();

  // ---------- filtres de la collection ----------
  function filtrer(cat) {
    let n = 0;
    $$('.pill').forEach(p => { const on = p.dataset.f === cat; p.classList.toggle('on', on); p.setAttribute('aria-pressed', on); });
    $$('#grid .card').forEach(c => { const ok = cat === 'Tout' || c.dataset.cat === cat; c.style.display = ok ? '' : 'none'; if (ok) n++; });
    const cnt = $('#count'); if (cnt) cnt.textContent = n + (n > 1 ? ' pièces' : ' pièce');
    const em = $('#empty'); if (em) em.hidden = n > 0;
  }
  if ($('#grid')) {
    const lire = () => { const h = decodeURIComponent(location.hash.slice(1)); return h && h !== 'Nouveautés' ? h : 'Tout'; };
    filtrer(lire()); addEventListener('hashchange', () => filtrer(lire()));
  }

  // ---------- clics ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) return fermer();
    if (t.dataset.f) { history.replaceState(null, '', '#' + t.dataset.f); return filtrer(t.dataset.f); }
    if (t.classList.contains('fav')) { e.preventDefault(); return basculerFav(+t.closest('.card').dataset.pid); }
    if (t.classList.contains('wish')) return basculerFav(+t.dataset.pid);
    const parent = t.parentElement && t.parentElement.id;
    if (parent === 'thumbs' || parent === 'sw') {
      $('#main').src = t.dataset.img;
      [...t.parentElement.children].forEach(b => b.classList.toggle('on', b === t));
      if (t.dataset.col) $('#p-col').textContent = t.dataset.col;
      return;
    }
    if (parent === 'sizes') { [...t.parentElement.children].forEach(b => b.classList.toggle('on', b === t)); return; }
    if (t.id === 'add') {
      const id = +document.querySelector('main[data-pid]').dataset.pid;
      const col = $('#p-col').textContent, size = ($('#sizes .on') || {}).textContent || 'M';
      const ex = panier.find(x => x.id === id && x.col === col && x.size === size);
      if (ex) ex.q++; else panier.push({ id, col, size, q: 1, img: $('#main').getAttribute('src') });
      majPanier(); rendrePanier(); ouvrir($('#cartd'));
    }
  });

  // ---------- formulaires ----------
  const nl = $('#nl');
  if (nl) nl.addEventListener('submit', e => { e.preventDefault(); nl.outerHTML = '<p style="margin:0">Merci, tu es bien inscrite ✓</p>'; });
  const cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', e => { e.preventDefault(); $('#contact-msg').hidden = false; cf.querySelector('button').disabled = true; });
})();
