// MONTE CARLO - modelo Poisson por partido

function runMonteCarlo(COR, LIGA, PARTIDOS, calendario, nSims) {

  var HOME_ADV = HISTORICO_EMBEBIDO.home_adv || 1.08;
  var MAX_GOALS = 8;

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

  // xGA como medida defensiva
  var xgaTeams = LIGA.filter(function(t){ return t.xga > 0; });
  var leagueXGA    = xgaTeams.length > 0
    ? xgaTeams.reduce(function(s,t){ return s + t.xga; }, 0) / xgaTeams.length
    : null;
    
  var avgGcPerGame = LIGA.reduce(function(s,t){ return s + t.gc/t.pj; }, 0) / LIGA.length;

  // Fuerza de cada equipo
  var strength = {};
  LIGA.forEach(function(t) {
    var defVal = (leagueXGA && t.xga > 0)
      ? t.xga / leagueXGA
      : (t.gc / t.pj) / avgGcPerGame;
    var alpha = t.pj / (t.pj + 10);
    strength[t.name] = {
      att: 1 + (t.xg / leagueXG - 1) * alpha,
      def: 1 + (defVal - 1) * alpha
    };
  });

  // Fuerza del Córdoba
  var corStr = strength['Córdoba'] || (function() {
    var att_raw = COR.xg / leagueXG;
    var def_raw = (leagueXGA && COR.xga > 0) ? COR.xga / leagueXGA : 1.0;
    var alpha = COR.pj / (COR.pj + 10);
    return { att: 1 + (att_raw - 1) * alpha, def: 1 + (def_raw - 1) * alpha };
  }());

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

    return { round: m.round, rival: m.rival, local: m.local,
             lam_cor: lam_cor, lam_riv: lam_riv,
             quality: lam_riv / Math.max(lam_cor, 0.01),
             pw: pois.pw, pd: pois.pd, pl: pois.pl };
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
  var THR_DESC    = Math.round(HISTORICO_EMBEBIDO.media_pos18_salvacion);
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

// Simulación Monte Carlo conjunta para todos los equipos de la liga.
// En cada iteración se simulan TODOS los partidos restantes a la vez,
// se calcula la clasificación final real y se cuentan las posiciones.
// Así los porcentajes son coherentes entre equipos:
//   sum(pDirect) = 200%, sum(pPlayoff) = 400%, sum(pDesc) = 400%
//
// calLiga: {team_name: [{round, rival, local}, ...]}
// Devuelve array ordenado por posición actual con campos:
//   name, pos, pts, pDirect, pPlayoff, pMid, pDesc, median, p25, p75
function runMonteCarloAll(LIGA, calLiga, nSims) {
  var HOME_ADV = HISTORICO_EMBEBIDO.home_adv || 1.08;
  var MAX_GOALS = 8;

  function pPMF(k, lam) {
    var p = Math.exp(-lam);
    for (var i = 1; i <= k; i++) p *= lam / i;
    return p;
  }

  function poissonProbs(lam_h, lam_a) {
    var pw = 0, pd = 0;
    for (var i = 0; i <= MAX_GOALS; i++) {
      var pi = pPMF(i, lam_h);
      for (var j = 0; j <= MAX_GOALS; j++) {
        var pij = pi * pPMF(j, lam_a);
        if      (i > j) pw += pij;
        else if (i === j) pd += pij;
      }
    }
    return { pw: pw, pd: pd };
  }

  // Medias de liga y fuerza de cada equipo
  var leagueXG = LIGA.reduce(function(s,t){ return s + t.xg; }, 0) / LIGA.length;
  var xgaTeams = LIGA.filter(function(t){ return t.xga > 0; });
  var leagueXGA = xgaTeams.length > 0
    ? xgaTeams.reduce(function(s,t){ return s + t.xga; }, 0) / xgaTeams.length
    : null;
  var avgGcPerGame = LIGA.reduce(function(s,t){ return s + t.gc/t.pj; }, 0) / LIGA.length;

  var strength = {};
  LIGA.forEach(function(t) {
    var defVal = (leagueXGA && t.xga > 0)
      ? t.xga / leagueXGA
      : (t.gc / t.pj) / avgGcPerGame;
    var alpha = t.pj / (t.pj + 10);
    strength[t.name] = {
      att: 1 + (t.xg / leagueXG - 1) * alpha,
      def: 1 + (defVal - 1) * alpha
    };
  });

  // Índice equipo -> posición en LIGA
  var teamIndex = {};
  LIGA.forEach(function(t, i) { teamIndex[t.name] = i; });
  var n = LIGA.length;

  // Mapa H2H: clave "homeTeam|awayTeam" -> {gh, ga} con totales de goles
  // Usado como primer desempate entre equipos empatados a puntos
  var h2hMap = {};
  (PARTIDOS_LIGA_EMBEBIDO || []).forEach(function(m) {
    var key = m.h + '|' + m.a;
    if (!h2hMap[key]) h2hMap[key] = { gh: 0, ga: 0 };
    h2hMap[key].gh += m.gh;
    h2hMap[key].ga += m.ga;
  });

  // Devuelve los goles que nameA ha marcado a nameB en sus enfrentamientos directos
  // (sumando tanto cuando A es local como cuando es visitante)
  function h2hGoalsFor(nameA, nameB) {
    var gf = 0;
    var asHome = h2hMap[nameA + '|' + nameB];
    if (asHome) gf += asHome.gh;
    var asAway = h2hMap[nameB + '|' + nameA];
    if (asAway) gf += asAway.ga;
    return gf;
  }

  // Lista de partidos únicos: tomamos solo los del equipo local (local==='L')
  // para no duplicar (cada partido aparece dos veces en calLiga)
  var uniqueMatches = [];
  if (calLiga) {
    Object.keys(calLiga).forEach(function(homeName) {
      var hi = teamIndex[homeName];
      if (hi === undefined) return;
      calLiga[homeName].forEach(function(m) {
        if (m.local !== 'L') return;
        var ai = teamIndex[m.rival];
        if (ai === undefined) return;
        var hStr = strength[homeName] || { att: 1.0, def: 1.0 };
        var aStr = strength[m.rival]  || { att: 1.0, def: 1.0 };
        var lam_h = leagueXG * hStr.att * aStr.def * HOME_ADV;
        var lam_a = leagueXG * aStr.att * hStr.def;
        var p = poissonProbs(lam_h, lam_a);
        uniqueMatches.push({ hi: hi, ai: ai, pw: p.pw, pd: p.pd });
      });
    });
  }

  // Contadores por equipo
  var pDirectCount  = new Int32Array(n);
  var pPlayoffCount = new Int32Array(n);
  var pMidCount     = new Int32Array(n);
  var pDescCount    = new Int32Array(n);

  // Almacenamos todos los puntos finales para percentiles
  // 22 equipos × 20.000 sims = 440.000 valores — manejable
  var allPts = [];
  for (var i = 0; i < n; i++) allPts.push(new Int32Array(nSims));

  var basePts = new Int32Array(n);
  LIGA.forEach(function(t, i) { basePts[i] = t.pts; });

  // Array de pts de la simulación actual (reutilizado)
  var simPts = new Int32Array(n);
  // Array de índices para ordenar la clasificación final (reutilizado)
  var order = new Int32Array(n);
  for (var i = 0; i < n; i++) order[i] = i;

  for (var s = 0; s < nSims; s++) {
    // Reiniciar puntos
    for (var i = 0; i < n; i++) simPts[i] = basePts[i];

    // Simular todos los partidos restantes
    for (var m = 0; m < uniqueMatches.length; m++) {
      var match = uniqueMatches[m];
      var r = Math.random();
      if      (r < match.pw)            simPts[match.hi] += 3;
      else if (r < match.pw + match.pd) { simPts[match.hi] += 1; simPts[match.ai] += 1; }
      else                               simPts[match.ai] += 3;
    }

    // Guardar puntos finales
    for (var i = 0; i < n; i++) allPts[i][s] = simPts[i];

    // Clasificación final: ordenar por pts desc, desempate por posición actual asc
    for (var i = 0; i < n; i++) order[i] = i;
    // Usar sort estable con comparador
    var simPtsSnap = simPts; // referencia en closure del sort
    Array.prototype.sort.call(order, function(a, b) {
      if (simPtsSnap[b] !== simPtsSnap[a]) return simPtsSnap[b] - simPtsSnap[a];
      // Desempate 1: enfrentamientos directos (goles a favor en H2H)
      var h2h = h2hGoalsFor(LIGA[b].name, LIGA[a].name) - h2hGoalsFor(LIGA[a].name, LIGA[b].name);
      if (h2h !== 0) return h2h;
      // Desempate 2: gol average global
      return (LIGA[b].gf - LIGA[b].gc) - (LIGA[a].gf - LIGA[a].gc);
    });

    // Asignar escenario según posición final (Segunda: 22 equipos)
    // Pos 1-2 → ascenso directo | 3-6 → playoff | 7-18 → salvación | 19-22 → descenso
    for (var rank = 0; rank < n; rank++) {
      var ti = order[rank];
      var finalPos = rank + 1;
      if      (finalPos <= 2)  pDirectCount[ti]++;
      else if (finalPos <= 6)  pPlayoffCount[ti]++;
      else if (finalPos <= 18) pMidCount[ti]++;
      else                     pDescCount[ti]++;
    }
  }

  // Construir resultados con percentiles
  var results = LIGA.map(function(t, i) {
    allPts[i].sort();
    return {
      name:     t.name,
      pos:      t.pos,
      pts:      t.pts,
      pending:  calLiga && calLiga[t.name] ? calLiga[t.name].length : 0,
      pDirect:  pDirectCount[i]  / nSims,
      pPlayoff: pPlayoffCount[i] / nSims,
      pMid:     pMidCount[i]     / nSims,
      pDesc:    pDescCount[i]    / nSims,
      median:   allPts[i][Math.floor(nSims / 2)],
      p25:      allPts[i][Math.floor(nSims * 0.25)],
      p75:      allPts[i][Math.floor(nSims * 0.75)],
    };
  });

  results.sort(function(a, b) { return a.pos - b.pos; });
  return results;
}
