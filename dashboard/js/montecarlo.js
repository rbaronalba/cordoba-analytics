/*  MONTE CARLO - modelo Poisson por partido (FiveThirtyEight style)  */
function runMonteCarlo(COR, LIGA, PARTIDOS, calendario, nSims) {
  /*
   * Modelo Poisson por partido (estilo FiveThirtyEight / StatsBomb):
   *   1. Fuerza ofensiva: att_i = xG_i / league_avg_xG
   *   2. Fuerza defensiva: def_i = (gc_i/pj_i) / avg_gc_liga
   *   3. λ_córdoba = league_avg_xG × att_cor × def_riv × [HOME_ADV si local]
   *      λ_rival   = league_avg_xG × att_riv × def_cor × [HOME_ADV si rival local]
   *   4. P(W/D/L) vía matriz Poisson hasta 6 goles
   *   5. Blend final: 60% forma reciente (últimos 5 por localía) + 40% Poisson
   */

  var HOME_ADV = 1.08;
  var MAX_GOALS = 6;

  // Poisson PMF
  function pPMF(k, lam) {
    var p = Math.exp(-lam);
    for (var i = 1; i <= k; i++) p *= lam / i;
    return p;
  }

  // P(W/D/L) desde dos lambdas
  function poissonProbs(lam_h, lam_a) {
    var pw = 0, pd = 0, pl = 0;
    for (var i = 0; i <= MAX_GOALS; i++) {
      var pi = pPMF(i, lam_h);
      for (var j = 0; j <= MAX_GOALS; j++) {
        var pij = pi * pPMF(j, lam_a);
        if      (i > j) pw += pij;
        else if (i === j) pd += pij;
        else             pl += pij;
      }
    }
    var tot = pw + pd + pl;
    return { pw: pw/tot, pd: pd/tot, pl: pl/tot };
  }

  // Medias de liga
  var leagueXG = LIGA.reduce(function(s,t){ return s + t.xg; }, 0) / LIGA.length;
  // xGA como medida defensiva (libre de ruido aleatorio de goles)
  var xgaTeams = LIGA.filter(function(t){ return t.xga > 0; });
  var leagueXGA    = xgaTeams.length > 0
    ? xgaTeams.reduce(function(s,t){ return s + t.xga; }, 0) / xgaTeams.length
    : null;
  // fallback por si xGA no está disponible en LIGA
  var avgGcPerGame = LIGA.reduce(function(s,t){ return s + t.gc/t.pj; }, 0) / LIGA.length;

  // Fuerza de cada equipo
  var strength = {};
  LIGA.forEach(function(t) {
    var defVal = (leagueXGA && t.xga > 0)
      ? t.xga / leagueXGA
      : (t.gc / t.pj) / avgGcPerGame;
    strength[t.name] = {
      att: t.xg / leagueXG,
      def: defVal
    };
  });

  // Fuerza del Córdoba (desde LIGA para consistencia)
  var corStr = strength['Córdoba'] || {
    att: COR.xg / leagueXG,
    def: (leagueXGA && COR.xga > 0) ? COR.xga / leagueXGA : 1.0
  };

  // Forma reciente por localía
  var locAll   = PARTIDOS.filter(function(p) { return p.local === 'L'; });
  var visAll   = PARTIDOS.filter(function(p) { return p.local === 'V'; });
  var last5loc = locAll.slice(-5);
  var last5vis = visAll.slice(-5);

  function wdlProbs(matches) {
    var n = matches.length;
    if (n === 0) return { pw: 1/3, pd: 1/3 };
    var w = matches.filter(function(p) { return p.res === 'W'; }).length;
    var d = matches.filter(function(p) { return p.res === 'D'; }).length;
    return { pw: w/n, pd: d/n };
  }
  var recent_loc = wdlProbs(last5loc);
  var recent_vis = wdlProbs(last5vis);

  // Probabilidades por partido
  var matchProbs = calendario.map(function(m) {
    var isHome = m.local === 'L';
    var riv    = strength[m.rival] || { att: 1.0, def: 1.0 };

    var lam_cor = isHome
      ? leagueXG * corStr.att * riv.def * HOME_ADV
      : leagueXG * corStr.att * riv.def;
    var lam_riv = isHome
      ? leagueXG * riv.att * corStr.def
      : leagueXG * riv.att * corStr.def * HOME_ADV;

    var pois = poissonProbs(lam_cor, lam_riv);
    var rec  = isHome ? recent_loc : recent_vis;

    // 60% forma reciente + 40% Poisson
    var pw = 0.60 * rec.pw + 0.40 * pois.pw;
    var pd = 0.60 * rec.pd + 0.40 * pois.pd;
    var pl = Math.max(1 - pw - pd, 0.05);
    var tot = pw + pd + pl; pw /= tot; pd /= tot; pl /= tot;

    return { round: m.round, rival: m.rival, local: m.local,
             lam_cor: lam_cor, lam_riv: lam_riv,
             quality: lam_riv / Math.max(lam_cor, 0.01),
             pw: pw, pd: pd, pl: pl };
  });

  // Simulación
  var results = new Int32Array(nSims);
  for (var i = 0; i < nSims; i++) {
    var pts = COR.pts_total;
    for (var j = 0; j < matchProbs.length; j++) {
      var mp = matchProbs[j];
      var r  = Math.random();
      if      (r < mp.pw)          pts += 3;
      else if (r < mp.pw + mp.pd)  pts += 1;
    }
    results[i] = pts;
  }
  results.sort();

  var THR_DIRECT  = Math.round(HISTORICO_EMBEBIDO.media_pos2_ascenso_directo);
  var THR_PLAYOFF = Math.round(HISTORICO_EMBEBIDO.media_pos6_playoff);
  var THR_DESC    = 42;
  var pDirect = 0, pPlayoff = 0, pMid = 0, pDesc = 0;
  for (var i = 0; i < nSims; i++) {
    var v = results[i];
    if      (v >= THR_DIRECT)   pDirect++;
    else if (v >= THR_PLAYOFF)  pPlayoff++;
    else if (v >= THR_DESC)     pMid++;
    else                        pDesc++;
  }
  var bins = {};
  for (var pt = 40; pt <= 100; pt++) bins[pt] = 0;
  for (var i = 0; i < nSims; i++) {
    var k = results[i];
    if (bins[k] !== undefined) bins[k]++;
  }

  var pw_avg = matchProbs.reduce(function(s,m){return s+m.pw;},0) / matchProbs.length;
  var pd_avg = matchProbs.reduce(function(s,m){return s+m.pd;},0) / matchProbs.length;

  return {
    pDirect:  pDirect  / nSims,
    pPlayoff: pPlayoff / nSims,
    pMid:     pMid     / nSims,
    pDesc:    pDesc    / nSims,
    thr_direct:  THR_DIRECT,
    thr_playoff: THR_PLAYOFF,
    thr_desc:    THR_DESC,
    median: results[Math.floor(nSims / 2)],
    p25:    results[Math.floor(nSims * 0.25)],
    p75:    results[Math.floor(nSims * 0.75)],
    min: results[0],
    max: results[nSims - 1],
    bins: bins,
    pw_used: pw_avg,
    pd_used: pd_avg,
    matchProbs: matchProbs,
    recent_loc: recent_loc,
    recent_vis: recent_vis,
    n_last5loc: last5loc.length,
    n_last5vis: last5vis.length
  };
}
