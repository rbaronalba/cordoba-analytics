/* ══ TOOLTIP ══ */
var tt = document.getElementById('tt');
function showTT(e, html) { tt.innerHTML = html; tt.style.display = 'block'; }
function hideTT() { tt.style.display = 'none'; }
document.addEventListener('mousemove', function(e) {
  tt.style.left = (e.clientX + 14) + 'px';
  tt.style.top  = (e.clientY - 30) + 'px';
});

/* ══ TABS ══ */
function showTab(id, btn) {
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ══ HELPERS ══ */
function avg(arr, f) {
  var vals = arr.map(function(p) { return (p[f] !== null && p[f] !== undefined) ? p[f] : 0; });
  return vals.reduce(function(s, v) { return s + v; }, 0) / arr.length;
}
function avgValid(arr, f) {
  /* media ignorando null/undefined - usar siempre para xG y métricas con huecos */
  var valid = arr.filter(function(p) { return p[f] !== null && p[f] !== undefined; });
  if (!valid.length) return null;
  return valid.reduce(function(s, p) { return s + p[f]; }, 0) / valid.length;
}

/* rankDesc/rankAsc con empates correctos
 * Cuenta cuántos equipos tienen un valor ESTRICTAMENTE MAYOR (mejor).
 * Posición = ese conteo + 1. Empates dan la misma posición.
 */
function rankDesc(liga, field, corVal) {
  var better = liga.filter(function(t) { return t[field] > corVal; }).length;
  return better + 1;
}
function rankAsc(liga, field, corVal) {
  var better = liga.filter(function(t) { return t[field] < corVal; }).length;
  return better + 1;
}

/* ══ SORT TABLE ══ */
function makeSortable(tableId) {
  var tbl = document.getElementById(tableId);
  if (!tbl) return;
  var headers = tbl.querySelectorAll('th');
  var sortCol = -1, sortAsc = false;
  headers.forEach(function(th, ci) {
    th.addEventListener('click', function() {
      var tbody = tbl.querySelector('tbody') || tbl;
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr.data-row'));
      if (sortCol === ci) sortAsc = !sortAsc; else { sortCol = ci; sortAsc = false; }
      headers.forEach(function(h) { h.classList.remove('sort-asc','sort-desc'); });
      th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
      rows.sort(function(a, b) {
        var av = a.cells[ci] ? a.cells[ci].getAttribute('data-val') || a.cells[ci].textContent.trim() : '';
        var bv = b.cells[ci] ? b.cells[ci].getAttribute('data-val') || b.cells[ci].textContent.trim() : '';
        var an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return sortAsc ? an - bn : bn - an;
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      rows.forEach(function(r) { tbody.appendChild(r); });
    });
  });
}
