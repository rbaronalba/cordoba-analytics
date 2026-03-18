/* ══ MAIN - punto de entrada ══ */
(function() {
  var DATA = DATOS_EMBEBIDOS;

  // limpiar xg=0 que no son datos reales
  DATA.PARTIDOS.forEach(function(p) { if (p.xg === 0.0) p.xg = null; });

  var PARTIDOS = DATA.PARTIDOS;
  var LIGA     = DATA.LIGA;
  var MED      = DATA.LIGA_MEDIAS;
  var COR      = DATA.CORDOBA;
  var CORR     = DATA.CORRELACIONES;
  var N_MISSING_XG = PARTIDOS.filter(function(p) { return p.xg === null; }).length;

  // xG medio real (sin nulls) - valor canónico usado en todo el dashboard
  COR.xg_calc = avgValid(PARTIDOS, 'xg');

  // puntos acumulados
  var acum = 0;
  PARTIDOS.forEach(function(p) {
    p.pts = p.res === 'W' ? 3 : p.res === 'D' ? 1 : 0;
    acum += p.pts;
    p.ptAcum = acum;
  });

  // tramos - ppgOf definida UNA sola vez en el scope correcto
  function ppgOf(arr) { return arr.reduce(function(s,p){return s+p.pts;},0)/arr.length; }

  var t1 = PARTIDOS.slice(0, 9), t2 = PARTIDOS.slice(9, 18), t3 = PARTIDOS.slice(18);
  var ppgT1 = ppgOf(t1), ppgT2 = ppgOf(t2), ppgT3 = ppgOf(t3);

  var loc = PARTIDOS.filter(function(p) { return p.local === 'L'; });
  var vis = PARTIDOS.filter(function(p) { return p.local === 'V'; });

  var locPPG  = ppgOf(loc),  visPPG  = ppgOf(vis);
  var locGF   = avg(loc,'gf'),    visGF   = avg(vis,'gf');
  var locGC   = avg(loc,'ga'),    visGC   = avg(vis,'ga');
  var locXG   = avgValid(loc,'xg'),  visXG  = avgValid(vis,'xg');
  var locXGA  = avgValid(loc,'xga'), visXGA = avgValid(vis,'xga');
  var locPoss = avg(loc,'poss'),  visPoss = avg(vis,'poss');
  var locShots= avg(loc,'shots'), visShots= avg(vis,'shots');

  var gcMedia = LIGA.reduce(function(s,t){return s + t.gc/t.pj;},0) / LIGA.length;

  // Monte Carlo
  var MC = runMonteCarlo(COR, LIGA, PARTIDOS, CALENDARIO_EMBEBIDO.partidos, 100000);

  var corEntry = LIGA.find(function(t) { return t.name === 'Córdoba'; });
  var corPos = corEntry ? corEntry.pos : '?';

  // Badge de fecha
  var today = new Date();
  var badgeText = 'J' + COR.partidos + ' - actualizado ' + today.getDate() + ' '
    + today.toLocaleString('es-ES',{month:'short'}) + ' ' + today.getFullYear();
  document.getElementById('dataBadge').textContent = badgeText;

  // big chances stats
  var bigCTotal    = PARTIDOS.reduce(function(s,p){return s+(p.bigC||0);},0);
  var bigCScored   = PARTIDOS.reduce(function(s,p){return s+(p.bigCScored||0);},0);
  var bigCMissed   = PARTIDOS.reduce(function(s,p){return s+(p.bigCMissed||0);},0);
  var bigCConv     = bigCTotal > 0 ? bigCScored / bigCTotal : 0;
  var hitWoodTotal = PARTIDOS.reduce(function(s,p){return s+(p.hitWoodwork||0);},0);
  var errShotTotal = PARTIDOS.filter(function(p){return p.errorsShot!==null;})
                             .reduce(function(s,p){return s+(p.errorsShot||0);},0);

  document.getElementById('app').innerHTML = buildHTML(
    PARTIDOS, LIGA, MED, COR, CORR, MC,
    ppgT1, ppgT2, ppgT3,
    loc, vis, locPPG, visPPG, locGF, visGF, locGC, visGC,
    locXG, visXG, locXGA, visXGA, locPoss, visPoss, locShots, visShots,
    gcMedia, corPos, N_MISSING_XG,
    bigCTotal, bigCScored, bigCMissed, bigCConv, hitWoodTotal, errShotTotal,
    ppgOf
  );

  renderEvChart(PARTIDOS);
  renderRadar(COR, MED);
  renderCompStats(COR, MED);
  renderCorrChart(CORR);
  renderDefRanking(LIGA, COR);
  renderTablaLiga(LIGA);
  renderScatter(LIGA);
  renderRankMetrics(LIGA, COR);
  renderMCDist(MC);
  renderPartidosTable(PARTIDOS);
  renderShotsChart(PARTIDOS);
  renderAdvStats(PARTIDOS, MED, COR);
  renderRivalesTable(PARTIDOS);
  renderShotFunnel(PARTIDOS, MED);
  renderBigChanceTimeline(PARTIDOS);
  renderDefensePanel(PARTIDOS, MED);

  makeSortable('tablaLiga');
  makeSortable('tablaPartidos');
  makeSortable('tablaRivales');
})();
