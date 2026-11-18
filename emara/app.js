// Emara : petites interactions (panier, favoris, filtres, fiche produit)
(function () {
  const $ = s => document.querySelector(s);
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let panier = store.get('emara-panier', 0);
  const majPanier = () => { const b = $('#cart'); if (b) b.textContent = panier; };
  majPanier();

  function filtrer(cat) {
    let n = 0;
    document.querySelectorAll('.pill').forEach(p => { const on = p.dataset.f === cat; p.classList.toggle('on', on); p.setAttribute('aria-pressed', on); });
    document.querySelectorAll('#grid .card').forEach(c => { const ok = cat === 'Tout' || c.dataset.cat === cat; c.style.display = ok ? '' : 'none'; if (ok) n++; });
    const cnt = $('#count'); if (cnt) cnt.textContent = n + (n > 1 ? ' pièces' : ' pièce');
  }
  if ($('#grid')) {
    const h = decodeURIComponent(location.hash.slice(1));
    filtrer(h && h !== 'Nouveautés' ? h : 'Tout');
    addEventListener('hashchange', () => filtrer(decodeURIComponent(location.hash.slice(1)) || 'Tout'));
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.f) { history.replaceState(null, '', '#' + t.dataset.f); return filtrer(t.dataset.f); }
    if (t.classList.contains('fav') || t.classList.contains('wish')) { t.classList.toggle('liked'); t.style.color = t.classList.contains('liked') ? '#9E1E45' : ''; return; }
    const parent = t.parentElement && t.parentElement.id;
    if (parent === 'thumbs' || parent === 'sw') {
      $('#main').src = t.dataset.img;
      [...t.parentElement.children].forEach(b => b.classList.toggle('on', b === t));
      if (t.dataset.col) $('#p-col').textContent = t.dataset.col;
      return;
    }
    if (parent === 'sizes') { [...t.parentElement.children].forEach(b => b.classList.toggle('on', b === t)); return; }
    if (t.id === 'add') { panier++; store.set('emara-panier', panier); majPanier(); t.querySelector('span').textContent = ' Ajouté au panier ✓'; }
  });

  const nl = $('#nl');
  if (nl) nl.addEventListener('submit', e => { e.preventDefault(); nl.outerHTML = '<p style="margin:0">Merci, tu es bien inscrite ✓</p>'; });
})();
