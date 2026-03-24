//HTML BUILDER

function buildHTML(PARTIDOS, LIGA, MED, COR, CORR, MC,
    ppgT1, ppgT2, ppgT3,
    loc, vis, locPPG, visPPG, locGF, visGF, locGC, visGC,
    locXG, visXG, locXGA, visXGA, locPoss, visPoss, locShots, visShots,
    gcMedia, corPos, N_MISSING_XG,
    bigCTotal, bigCScored, bigCMissed, bigCConv, hitWoodTotal, errShotTotal,
    ppgOf) {

  // usar xg_calc (calculado sobre partidos sin null) en todos los insights
  var xgShow = COR.xg_calc !== null ? COR.xg_calc.toFixed(2) : COR.xg.toFixed(2);

  // tramos temporales
  var t1 = PARTIDOS.slice(0, 9), t2 = PARTIDOS.slice(9, 18), t3 = PARTIDOS.slice(18);

  function bar(val, max, color) {
    var w = Math.min(val/max*100, 100).toFixed(1);
    return '<div class="hbar-track"><div class="hbar-fill" style="width:'+w+'%;background:'+color+'"></div></div>';
  }

  return `
<!--  OVERVIEW  -->
<div id="overview" class="section active">
<div class="hero">
  <div class="hero-grid">
    <div>
      <div class="hero-title">CÓR<span class="red">DOBA</span><br><span class="dim">CF</span></div>
      <div class="hero-sub">LaLiga 2 | Temporada 25/26 | J${COR.partidos}</div>
    </div>
    <div class="position-badge">
      <div class="pos-label">POSICIÓN</div>
      <div class="pos-num">${corPos}º</div>
      <div class="pos-pts">${COR.pts_total} pts</div>
      <div class="pos-label" style="margin-top:6px">de ${LIGA.length} equipos</div>
    </div>
  </div>
</div>
<div class="wrap">
  <div class="kpi-strip">
    <div class="kpi"><div class="kv r">${COR.pts_total}</div><div class="kl">Puntos</div><div class="ks">J${COR.partidos}</div></div>
    <div class="kpi"><div class="kv">${COR.ppg.toFixed(2)}</div><div class="kl">PPG</div><div class="ks">pts/partido</div></div>
    <div class="kpi"><div class="kv">${COR.victorias}</div><div class="kl">Victorias</div><div class="ks">${COR.empates}E | ${COR.derrotas}D</div></div>
    <div class="kpi"><div class="kv g">${COR.gf}</div><div class="kl">Goles favor</div><div class="ks">${(COR.gf/COR.partidos).toFixed(2)}/p</div></div>
    <div class="kpi"><div class="kv r">${COR.gc}</div><div class="kl">Goles contra</div><div class="ks">${(COR.gc/COR.partidos).toFixed(2)}/p</div></div>
    <div class="kpi"><div class="kv b">${COR.poss}%</div><div class="kl">Posesión</div><div class="ks">+${(COR.poss-MED.poss).toFixed(1)}% vs liga</div></div>
    <div class="kpi"><div class="kv">${xgShow}</div><div class="kl">xG/partido</div><div class="ks">+${(COR.xg_calc-MED.xg).toFixed(2)} vs liga</div></div>
    <div class="kpi"><div class="kv r">${COR.xga ? COR.xga.toFixed(2) : 'N/D'}</div><div class="kl">xGA/partido</div><div class="ks">${COR.xga && MED.xga ? (COR.xga > MED.xga ? '+' : '') + (COR.xga - MED.xga).toFixed(2) + ' vs liga' : ''}</div></div>
    <div class="kpi"><div class="kv">${COR.conv_xg.toFixed(2)}</div><div class="kl">Conv. xG</div><div class="ks">media liga: 1.00</div></div>
  </div>

  <div class="sec-title">Conclusiones del análisis</div>
  <div class="g2">
    <div>
      <div class="insight">
        <div class="insight-title">Dominio sin recompensa suficiente</div>
        <div class="insight-text">El Córdoba genera <strong style="color:var(--t1)">${xgShow} xG/p</strong> (media liga: ${MED.xg.toFixed(2)}) y lidera en tiros totales con <strong style="color:var(--t1)">${COR.shots}/p</strong> vs ${MED.shots.toFixed(1)} de media. Con <strong style="color:var(--r)">${bigCTotal} grandes ocasiones</strong> en ${COR.partidos}J, solo convierte el <strong style="color:var(--r)">${(bigCConv*100).toFixed(0)}%</strong> (${bigCScored} goles). El portero rival ha detenido ${bigCMissed} ocasiones claras - ahí está la brecha.</div>
      </div>
      <div class="insight">
        <div class="insight-title">Progresión temporal clara</div>
        <div class="insight-text">PPG J1–J${t1[t1.length-1].j}: <strong style="color:var(--r)">${ppgT1.toFixed(2)}</strong> -> J${t2[0].j}–J${t2[t2.length-1].j}: <strong style="color:var(--t1)">${ppgT2.toFixed(2)}</strong> -> J${t3[0].j}–J${COR.partidos}: <strong style="color:var(--g)">${ppgT3.toFixed(2)}</strong>. Tendencia positiva y consistente. Manteniendo el último ritmo en ${CALENDARIO_EMBEBIDO.total_pending} partidos restantes: <strong style="color:var(--g)">~${Math.round(COR.pts_total + ppgT3*CALENDARIO_EMBEBIDO.total_pending)} pts totales</strong>.</div>
      </div>
    </div>
    <div>
      <div class="insight">
        <div class="insight-title">Lo que gana partidos en Segunda</div>
        <div class="insight-text">Correlación sobre 616 registros reales: <strong style="color:var(--t1)">la posesión correlaciona negativamente</strong> (r=−0.17). Los mejores predictores son <strong style="color:var(--g)">conversión de grandes ocasiones</strong> (r=0.426) y <strong style="color:var(--g)">tiros a puerta</strong> (r=0.294). El Córdoba tiene las ocasiones - el problema es materializarlas.</div>
      </div>
      <div class="insight">
        <div class="insight-title">Madera y errores: el detalle que duele</div>
        <div class="insight-text"><strong style="color:var(--t1)">${hitWoodTotal} golpes al poste/larguero</strong> en ${COR.partidos} jornadas - el Córdoba golpea el marco con más frecuencia que cualquier rival. Sumado a la baja conversión de grandes ocasiones (${(bigCConv*100).toFixed(0)}%), esto cuantifica exactamente los puntos perdidos por ineficiencia finalizadora.</div>
      </div>
    </div>
  </div>

  <div class="g2">
    <div class="panel">
      <div class="pt">Rendimiento por tramos y localía</div>
      <div style="margin-bottom:20px">
        <div class="hbar-row"><div class="hbar-label">J1–J${t1[t1.length-1].j}</div>${bar(ppgT1,3,'var(--r)')}<div class="hbar-val" style="color:var(--r)">${ppgT1.toFixed(2)}</div></div>
        <div class="hbar-row"><div class="hbar-label">J${t2[0].j}–J${t2[t2.length-1].j}</div>${bar(ppgT2,3,'var(--t1)')}<div class="hbar-val">${ppgT2.toFixed(2)}</div></div>
        <div class="hbar-row"><div class="hbar-label">J${t3[0].j}–J${COR.partidos}</div>${bar(ppgT3,3,'var(--g)')}<div class="hbar-val" style="color:var(--g)">${ppgT3.toFixed(2)}</div></div>
      </div>
      <div style="border-top:1px solid var(--s4);padding-top:12px">
        <div class="hbar-row"><div class="hbar-label">Local PPG</div>${bar(locPPG,3,'var(--b)')}<div class="hbar-val" style="color:var(--b)">${locPPG.toFixed(2)}</div></div>
        <div class="hbar-row"><div class="hbar-label">Visitante PPG</div>${bar(visPPG,3,'var(--t3)')}<div class="hbar-val">${visPPG.toFixed(2)}</div></div>
        <div class="hbar-row" style="margin-top:8px"><div class="hbar-label">GF local/p</div>${bar(locGF,3,'var(--g)')}<div class="hbar-val" style="color:var(--g)">${locGF.toFixed(2)}</div></div>
        <div class="hbar-row"><div class="hbar-label">GF visit./p</div>${bar(visGF,3,'var(--g)')}<div class="hbar-val" style="color:var(--g)">${visGF.toFixed(2)}</div></div>
        <div class="hbar-row" style="margin-top:8px"><div class="hbar-label">GC local/p</div>${bar(locGC,3,locGC<=gcMedia?'var(--g)':'var(--r)')}<div class="hbar-val" style="color:${locGC<=gcMedia?'var(--g)':'var(--r)'}">${locGC.toFixed(2)}</div></div>
        <div class="hbar-row"><div class="hbar-label">GC visit./p</div>${bar(visGC,3,visGC<=gcMedia?'var(--g)':'var(--r)')}<div class="hbar-val" style="color:${visGC<=gcMedia?'var(--g)':'var(--r)'}">${visGC.toFixed(2)}</div></div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">Puntos acumulados | PPG rolling-5</div>
      <svg id="evChart" width="100%" height="160" viewBox="0 0 560 160" style="overflow:visible"></svg>
    </div>
  </div>
</div>
</div>

<!--  TACTICAL  -->
<div id="tactical" class="section">
<div class="hero" style="padding-bottom:20px">
  <div style="max-width:1280px;margin:0 auto">
    <div class="hero-title" style="font-size:clamp(36px,5vw,48px)">IDENTIDAD<br><span class="red">TÁCTICA</span></div>
    <div class="hero-sub">Perfil de juego | Córdoba vs media Segunda División</div>
  </div>
</div>
<div class="wrap">
  <div class="g13">
    <div class="panel">
      <div class="pt">Radar de perfil táctico</div>
      <svg id="radarSvg" width="260" height="260" viewBox="0 0 260 260" style="margin:0 auto;display:block"></svg>
      <div style="display:flex;gap:20px;justify-content:center;margin-top:12px">
        <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:3px;background:var(--r);border-radius:2px"></div><span style="font-family:var(--fm);font-size:9px;color:var(--t2)">Córdoba</span></div>
        <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:3px;background:var(--t3);border-radius:2px"></div><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">Media liga</span></div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">Córdoba vs media Segunda División</div>
      <div id="compStats"></div>
    </div>
  </div>

  <div class="g2">
    <div class="panel">
      <div class="pt">Embudo ofensivo | de tiros a goles</div>
      <div id="shotFunnel"></div>
    </div>
    <div class="panel">
      <div class="pt">Grandes ocasiones | creación vs conversión por partido</div>
      <svg id="bigChanceSvg" width="100%" height="180" viewBox="0 0 560 180" style="overflow:visible"></svg>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px">
        <div style="text-align:center;background:var(--s2);padding:10px;border:1px solid var(--s4)">
          <div style="font-family:var(--fd);font-size:28px;font-weight:700;color:var(--t1)">${(COR.bigC).toFixed(2)}</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-top:2px">GRANDES OC./P</div>
          <div style="font-family:var(--fm);font-size:8px;color:${COR.bigC>MED.bigC?'var(--g)':'var(--r)'}">vs ${MED.bigC.toFixed(2)} liga</div>
        </div>
        <div style="text-align:center;background:var(--s2);padding:10px;border:1px solid var(--s4)">
          <div style="font-family:var(--fd);font-size:28px;font-weight:700;color:var(--g)">${(bigCConv*100).toFixed(0)}%</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-top:2px">CONVERSIÓN GR.OC.</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3)">${bigCScored}G / ${bigCTotal} OC.</div>
        </div>
        <div style="text-align:center;background:var(--s2);padding:10px;border:1px solid var(--s4)">
          <div style="font-family:var(--fd);font-size:28px;font-weight:700;color:var(--r)">${hitWoodTotal}</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-top:2px">POSTES/LARGUEROS</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3)">${COR.partidos} jornadas</div>
        </div>
      </div>
    </div>
  </div>

  <div class="g2">
    <div class="panel">
      <div class="pt">Análisis ofensivo/defensivo | Local vs Visitante</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:var(--s2);padding:14px;border:1px solid var(--s4);text-align:center">
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-bottom:6px">LOCAL | xG/PARTIDO</div>
          <div style="font-family:var(--fd);font-size:36px;font-weight:700;color:var(--g)">${locXG !== null ? locXG.toFixed(2) : 'N/D'}</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3)">visit.: ${visXG !== null ? visXG.toFixed(2) : 'N/D'}</div>
        </div>
        <div style="background:var(--s2);padding:14px;border:1px solid var(--s4);text-align:center">
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-bottom:6px">LOCAL | xGA/PARTIDO</div>
          <div style="font-family:var(--fd);font-size:36px;font-weight:700;color:${locXGA !== null && MED.xga && locXGA <= MED.xga ? 'var(--g)' : 'var(--r)'}">${locXGA !== null ? locXGA.toFixed(2) : 'N/D'}</div>
          <div style="font-family:var(--fm);font-size:8px;color:var(--t3)">visit.: ${visXGA !== null ? visXGA.toFixed(2) : 'N/D'} | GC local: ${locGC.toFixed(2)}</div>
        </div>
      </div>
      <div style="border-top:1px solid var(--s4);padding-top:14px">
        <div class="hbar-row"><div class="hbar-label">xG local/p</div>${bar(locXG||0,3,'var(--g)')}<div class="hbar-val" style="color:var(--g)">${locXG !== null ? locXG.toFixed(2) : 'N/D'}</div></div>
        <div class="hbar-row"><div class="hbar-label">xG visit./p</div>${bar(visXG||0,3,'var(--b)')}<div class="hbar-val" style="color:var(--b)">${visXG !== null ? visXG.toFixed(2) : 'N/D'}</div></div>
        <div class="hbar-row" style="margin-top:8px"><div class="hbar-label">xGA local/p</div>${bar(locXGA||0,3,'var(--r)')}<div class="hbar-val" style="color:var(--r)">${locXGA !== null ? locXGA.toFixed(2) : 'N/D'}</div></div>
        <div class="hbar-row"><div class="hbar-label">xGA visit./p</div>${bar(visXGA||0,3,'var(--r)')}<div class="hbar-val" style="color:var(--r)">${visXGA !== null ? visXGA.toFixed(2) : 'N/D'}</div></div>
        <div class="hbar-row" style="margin-top:8px"><div class="hbar-label">Poss. local</div>${bar(locPoss,100,'var(--r)')}<div class="hbar-val">${locPoss.toFixed(0)}%</div></div>
        <div class="hbar-row"><div class="hbar-label">Poss. visit.</div>${bar(visPoss,100,'var(--r)')}<div class="hbar-val">${visPoss.toFixed(0)}%</div></div>
        <div class="hbar-row" style="margin-top:8px"><div class="hbar-label">Tiros local/p</div>${bar(locShots,25,'var(--t1)')}<div class="hbar-val">${locShots.toFixed(1)}</div></div>
        <div class="hbar-row"><div class="hbar-label">Tiros visit./p</div>${bar(visShots,25,'var(--t1)')}<div class="hbar-val">${visShots.toFixed(1)}</div></div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">Ranking defensivo en la liga | GC/partido</div>
      <div id="defRanking"></div>
    </div>
  </div>

  <div class="panel" style="margin-bottom:24px">
    <div class="pt">Perfil defensivo ampliado | Córdoba vs liga</div>
    <div id="defensePanel"></div>
  </div>

  <div class="panel" style="margin-bottom:24px">
    <div class="pt">¿Qué gana partidos en Segunda División? | Correlación de Pearson con puntos (n=616 partidos reales)</div>
    <svg id="corrChart" width="100%" height="220" viewBox="0 0 900 220"></svg>
    <div style="margin-top:8px;font-family:var(--fm);font-size:9px;color:var(--t3)">
      Correlación positiva = más de esa métrica -> más puntos. Con n=616, |r| > 0.08 es significativo al 95%. La posesión correlaciona negativamente - poseer más no garantiza ganar en Segunda.
    </div>
  </div>

  <div class="g3">
    <div class="panel">
      <div class="pt">Conversión xG -> Goles</div>
      <div style="text-align:center;padding:16px 0">
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-bottom:8px">CÓRDOBA</div>
        <div style="font-family:var(--fd);font-size:56px;font-weight:800;color:var(--t1);line-height:1">${COR.conv_xg.toFixed(2)}</div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-top:4px">goles / xG generado</div>
        <div style="margin:14px 0;height:1px;background:var(--s4)"></div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3)">Media liga: <span style="color:var(--t1)">1.00</span></div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-top:4px">Conv. a media: <span style="color:var(--t1)">~${Math.round(COR.pts_total + 3)} pts</span></div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-top:4px">Mejor liga: <span style="color:var(--g)">${Math.max.apply(null, LIGA.map(function(t){return t.conv;})).toFixed(2)}</span></div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">Índice de presión defensiva</div>
      <div style="text-align:center;padding:16px 0">
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-bottom:8px">CÓRDOBA</div>
        <div style="font-family:var(--fd);font-size:56px;font-weight:800;color:var(--g);line-height:1">${COR.presion_idx.toFixed(1)}</div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-top:4px">tackles + interceptaciones + recuperaciones</div>
        <div style="margin:14px 0;height:1px;background:var(--s4)"></div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3)">Media liga: <span style="color:var(--t1)">~72.0</span></div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">Estilo identificado</div>
      <div style="padding:10px 0">
        <div style="font-family:var(--fd);font-size:20px;font-weight:700;color:var(--b);margin-bottom:12px">DOMINANTE DE POSESIÓN</div>
        <div style="font-family:var(--fm);font-size:9px;color:var(--t3);line-height:2.2">
          ${COR.poss}% posesión media -> +${(COR.poss-MED.poss).toFixed(1)}% vs liga<br>
          Top en tiros totales (${COR.shots}/p vs ${MED.shots.toFixed(1)} media)<br>
          ${COR.shotsInBox.toFixed(1)}/p tiros dentro del área (liga: ${MED.shotsInBox.toFixed(1)})<br>
          ${COR.bigC.toFixed(2)} grandes oc./p | conv. ${(bigCConv*100).toFixed(0)}%<br>
          <span style="color:var(--r)">La posesión no correlaciona con pts (r=−0.17)</span><br>
          <span style="color:var(--t3)">Datos reales de ${COR.partidos} jornadas</span>
        </div>
      </div>
    </div>
  </div>
</div>
</div>

<!--  LIGA  -->
<div id="liga" class="section">
<div class="hero" style="padding-bottom:20px">
  <div style="max-width:1280px;margin:0 auto">
    <div class="hero-title" style="font-size:clamp(36px,5vw,48px)">CÓRDOBA<br><span class="red">vs LIGA</span></div>
    <div class="hero-sub">Clasificación real | J${COR.partidos}</div>
  </div>
</div>
<div class="wrap">
  <div class="g31">
    <div class="panel">
      <div class="pt">Clasificación LaLiga 2 | J${COR.partidos} | click en columna para ordenar</div>
      <table class="tabla" id="tablaLiga"></table>
    </div>
    <div class="panel">
      <div class="pt">xG generado vs Puntos | toda la liga</div>
      <svg id="scatterSvg" width="100%" height="320" viewBox="0 0 320 320" style="overflow:visible"></svg>
    </div>
  </div>
  <div class="panel" style="margin-bottom:24px">
    <div class="pt">Ranking de métricas avanzadas | posición del Córdoba en la liga</div>
    <div id="rankMetrics" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding-top:8px;row-gap:16px"></div>
  </div>
</div>
</div>

<!--  MONTE CARLO  -->
<div id="montecarlo" class="section">
<div class="hero" style="padding-bottom:20px">
  <div style="max-width:1280px;margin:0 auto">
    <div class="hero-title" style="font-size:clamp(36px,5vw,48px)">SIMULACIÓN<br><span class="red">MONTE CARLO</span></div>
    <div class="hero-sub">100.000 simulaciones | ${CALENDARIO_EMBEBIDO.total_pending} partidos restantes | modelo Poisson por partido | fuerzas regularizadas | localía real | calidad del rival</div>
  </div>
</div>
<div class="wrap">
  <div class="g2" style="margin-bottom:24px">
    <div class="panel">
      <div class="pt">Probabilidades de escenario final</div>
      ${(function(){
        var d  = parseFloat((MC.pDirect*100).toFixed(1));
        var po = parseFloat((MC.pPlayoff*100).toFixed(1));
        var mi = parseFloat((MC.pMid*100).toFixed(1));
        var de = parseFloat((100 - d - po - mi).toFixed(1));
        return '<div class="mc-row">'
          +'<div class="mc-label">ASCENSO DIRECTO<br><span style="color:var(--t3);font-size:8px">\u2265'+MC.thr_direct+' pts | media hist\u00f3rica</span></div>'
          +'<div class="mc-track"><div class="mc-fill" style="width:'+d+'%;background:var(--g)"></div></div>'
          +'<div class="mc-pct" style="color:var(--g)">'+d.toFixed(1)+'%</div>'
          +'</div>'
          +'<div class="mc-row">'
          +'<div class="mc-label">PLAYOFF TOP 6<br><span style="color:var(--t3);font-size:8px">\u2265'+MC.thr_playoff+' pts | media hist\u00f3rica</span></div>'
          +'<div class="mc-track"><div class="mc-fill" style="width:'+po+'%;background:var(--t1)"></div></div>'
          +'<div class="mc-pct" style="color:var(--t1)">'+po.toFixed(1)+'%</div>'
          +'</div>'
          +'<div class="mc-row">'
          +'<div class="mc-label">MITAD TABLA<br><span style="color:var(--t3);font-size:8px">'+MC.thr_desc+'\u2013'+(MC.thr_playoff-1)+' pts</span></div>'
          +'<div class="mc-track"><div class="mc-fill" style="width:'+mi+'%;background:var(--b)"></div></div>'
          +'<div class="mc-pct" style="color:var(--b)">'+mi.toFixed(1)+'%</div>'
          +'</div>'
          +'<div class="mc-row">'
          +'<div class="mc-label">DESCENSO<br><span style="color:var(--t3);font-size:8px">&lt;'+MC.thr_desc+' pts</span></div>'
          +'<div class="mc-track"><div class="mc-fill" style="width:'+de+'%;background:var(--r)"></div></div>'
          +'<div class="mc-pct" style="color:'+(de<1?'var(--g)':'var(--r)')+'">'+de.toFixed(1)+'%</div>'
          +'</div>';
      })()}
      <div style="margin-top:10px;font-family:var(--fm);font-size:8px;color:var(--t3);border-top:1px solid var(--s4);padding-top:10px;line-height:2.0">
        P(V) media: ${(MC.pw_used*100).toFixed(1)}% | P(E): ${(MC.pd_used*100).toFixed(1)}% | P(D): ${((1-MC.pw_used-MC.pd_used)*100).toFixed(1)}%<br>
        Racha ult.${MC.n_last5loc} casa: ${(MC.recent_loc.pw*100).toFixed(0)}%V/${(MC.recent_loc.pd*100).toFixed(0)}%E | ult.${MC.n_last5vis} fuera: ${(MC.recent_vis.pw*100).toFixed(0)}%V/${(MC.recent_vis.pd*100).toFixed(0)}%E
      </div>
      <div style="margin-top:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
          <div><div style="font-family:var(--fd);font-size:32px;font-weight:700;color:var(--t2)">${MC.p25}</div><div style="font-family:var(--fm);font-size:8px;color:var(--t3)">P25 pts</div></div>
          <div><div style="font-family:var(--fd);font-size:32px;font-weight:700;color:var(--t1)">${MC.median}</div><div style="font-family:var(--fm);font-size:8px;color:var(--t3)">MEDIANA pts</div></div>
          <div><div style="font-family:var(--fd);font-size:32px;font-weight:700;color:var(--t2)">${MC.p75}</div><div style="font-family:var(--fm);font-size:8px;color:var(--t3)">P75 pts</div></div>
        </div>
        <div style="margin-top:12px;font-family:var(--fm);font-size:8px;color:var(--t3);text-align:center;line-height:1.8">
          Distribución empírica | n=100.000 simulaciones | rango real [${MC.min}, ${MC.max}]
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="pt">¿Qué necesita para el playoff?</div>
      <div style="padding:8px 0">
        <div style="font-family:var(--fm);font-size:10px;color:var(--t3);line-height:2.5;margin-bottom:16px">
          Pts actuales: <span style="color:var(--t1)">${COR.pts_total}</span><br>
          Partidos restantes: <span style="color:var(--t1)">${CALENDARIO_EMBEBIDO.total_pending}</span><br>
          PPG global: <span style="color:var(--t1)">${COR.ppg.toFixed(3)}</span><br>
          PPG último tramo: <span style="color:var(--g)">${ppgT3.toFixed(2)}</span><br>
          PPG últimos 10J: <span style="color:var(--g)">${COR.ppg_last10.toFixed(2)}</span>
        </div>
        <div style="font-family:var(--fd);font-size:14px;font-weight:700;color:var(--t3);margin-bottom:10px;letter-spacing:1px">PROYECCIONES</div>
        <div style="margin-bottom:10px;padding:10px;background:var(--s2);border-left:3px solid var(--r)">
          <div style="font-family:var(--fm);font-size:9px;color:var(--r)">PPG ACTUAL (${COR.ppg.toFixed(2)})</div>
          <div style="font-family:var(--fd);font-size:28px;font-weight:700">~${Math.round(COR.pts_total + COR.ppg*CALENDARIO_EMBEBIDO.total_pending)} pts</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--t3)">Mitad tabla | Fuera de playoff</div>
        </div>
        <div style="margin-bottom:10px;padding:10px;background:var(--s2);border-left:3px solid var(--t1)">
          <div style="font-family:var(--fm);font-size:9px;color:var(--t1)">PPG ${ppgT3.toFixed(2)} (ritmo último tramo)</div>
          <div style="font-family:var(--fd);font-size:28px;font-weight:700">~${Math.round(COR.pts_total + ppgT3*CALENDARIO_EMBEBIDO.total_pending)} pts</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--t3)">Borde del playoff | Posible 6º</div>
        </div>
        <div style="padding:10px;background:var(--s2);border-left:3px solid var(--g)">
          <div style="font-family:var(--fm);font-size:9px;color:var(--g)">PPG 2.14 (mejor tramo posible)</div>
          <div style="font-family:var(--fd);font-size:28px;font-weight:700">~${Math.round(COR.pts_total + 2.14*CALENDARIO_EMBEBIDO.total_pending)} pts</div>
          <div style="font-family:var(--fm);font-size:9px;color:var(--t3)">Playoff asegurado | Top 4</div>
        </div>
      </div>
    </div>
  </div>
  <div class="panel">
    <div class="pt">Distribución de simulaciones | puntos finales (histograma real de 100.000 sims)</div>
    <svg id="mcDist" width="100%" height="140" viewBox="0 0 900 140"></svg>
    <div style="display:flex;justify-content:space-between;font-family:var(--fm);font-size:9px;color:var(--t3);margin-top:6px;padding:0 20px">
      <span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90+</span>
    </div>
  </div>
  <div class="panel">
    <div class="pt">Calendario restante | dificultad por rival (${MC.matchProbs.length} partidos)</div>
    <div style="overflow-x:auto">
      <table class="tabla" style="width:100%">
        <thead><tr>
          <th>J</th><th>Rival</th><th>Loc</th><th>λ rival</th><th>P(V)</th><th>P(E)</th><th>P(D)</th><th>Dificultad</th>
        </tr></thead>
        <tbody>
        ${MC.matchProbs.map(function(m) {
          var diffColor = m.quality > 1.25 ? 'var(--r)' : m.quality > 0.95 ? 'var(--t1)' : 'var(--g)';
          var diffLabel = m.quality > 1.25 ? 'DURO' : m.quality > 0.95 ? 'MEDIO' : 'ASEQUIBLE';
          var pwColor   = m.pw > 0.42 ? 'var(--g)' : m.pw > 0.30 ? 'var(--t1)' : 'var(--r)';
          var locIcon   = m.local === 'L' ? '🏠' : '✈';
          return '<tr class="data-row">'
            + '<td style="font-family:var(--fd);color:var(--t3)">J' + m.round + '</td>'
            + '<td style="font-weight:700">' + m.rival + '</td>'
            + '<td style="text-align:center">' + locIcon + '</td>'
            + '<td style="text-align:center;font-family:var(--fd)">' + m.lam_riv.toFixed(2) + '</td>'
            + '<td style="text-align:center;font-family:var(--fd);color:' + pwColor + ';font-weight:700">' + (m.pw*100).toFixed(1) + '%</td>'
            + '<td style="text-align:center;font-family:var(--fd)">' + (m.pd*100).toFixed(1) + '%</td>'
            + '<td style="text-align:center;font-family:var(--fd)">' + (m.pl*100).toFixed(1) + '%</td>'
            + '<td style="text-align:center;font-family:var(--fm);font-size:9px;color:' + diffColor + ';font-weight:700">' + diffLabel + '</td>'
            + '</tr>';
        }).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:8px;font-family:var(--fm);font-size:8px;color:var(--t3);line-height:1.8">
      P(V/E/D) = probabilidad de cada resultado vía modelo Poisson | λ rival = goles esperados por el rival (att_riv x def_cor x league_xG) | dificultad = λ rival / λ Córdoba (ratio medio ${(MC.matchProbs.reduce(function(s,m){return s+m.quality;},0)/MC.matchProbs.length).toFixed(2)}; DURO &gt;1.25, MEDIO &gt;0.95, ASEQUIBLE ≤0.95) | fuerzas regularizadas con shrinkage bayesiano (factor pj/(pj+10))
    </div>
  </div>

  <div class="panel" style="margin-top:4px">
    <div class="pt">Proyección final de liga</div>
    <div style="overflow-x:auto">
      <table class="tabla" id="tablaProyecciones"></table>
    </div>
  </div>
</div>
</div>

<!--  PARTIDOS  -->
<div id="partidos" class="section">
<div class="hero" style="padding-bottom:20px">
  <div style="max-width:1280px;margin:0 auto">
    <div class="hero-title" style="font-size:clamp(36px,5vw,48px)">TODOS LOS<br><span class="red">PARTIDOS</span></div>
    <div class="hero-sub">${COR.partidos} partidos | Temporada 25/26 | click en columna para ordenar</div>
  </div>
</div>
<div class="wrap">
  ${N_MISSING_XG > 0 ? '<div class="warn-box">' + N_MISSING_XG + ' partido(s) con xG marcado como N/D: el dato no estaba disponible en Sofascore en el momento del scraping. No se usan en cálculos de xG medio.</div>' : ''}
  <div class="g2">
    <div class="panel">
      <div class="pt">Registro completo | click en columna para ordenar</div>
      <div style="overflow-x:auto">
        <table class="tabla" id="tablaPartidos"></table>
      </div>
    </div>
    <div>
      <div class="panel" style="margin-bottom:20px">
        <div class="pt">Tiros por partido | línea de xG</div>
        <svg id="shotsChart" width="100%" height="140" viewBox="0 0 560 140" style="overflow:visible"></svg>
      </div>
      <div class="panel">
        <div class="pt">Stats avanzadas | media real vs media liga</div>
        <div id="advStats"></div>
      </div>
    </div>
  </div>
  <div class="panel" style="margin-top:4px">
    <div class="pt">Por rival | click en columna para ordenar</div>
    <div style="overflow-x:auto">
      <table class="tabla" id="tablaRivales"></table>
    </div>
  </div>
</div>
</div>

<!--  METODOLOGÍA  -->
<div id="metodologia" class="section">
<div class="hero" style="padding-bottom:20px">
  <div style="max-width:1280px;margin:0 auto">
    <div class="hero-title" style="font-size:clamp(36px,5vw,48px)">DATA<br><span class="red">PIPELINE</span></div>
    <div class="hero-sub">Fuentes | Pipeline | Limitaciones | Decisiones técnicas</div>
  </div>
</div>
<div class="wrap">
  <div class="meto-block">
    <h3>Pipeline de datos</h3>
    <p style="margin-top:14px">El scraping se realiza jornada a jornada. Para cada partido de los 22 equipos de la categoría se obtienen estadísticas avanzadas por período (ALL, 1ST, 2ND), lo que permite calcular medias de liga, rankings y correlaciones sobre toda la competición.</p>
  </div>

  <div class="meto-block">
    <h3>Fuentes de datos</h3>
    <ul>
      <li>Resultados y estadísticas: endpoint público de SofaScore</li>
      <li>xG calculado por SofaScore con su modelo propio (posición de remate + tipo + situación de juego)</li>
      <li>Clasificación: construida a partir de todos los partidos de la temporada, ordenada por pts -> DG -> GF</li>
      <li>Correlaciones: calculadas sobre ${LIGA.length * COR.partidos} registros (${LIGA.length} equipos x ${COR.partidos} jornadas) con correlación de Pearson</li>
      <li>Medias de liga: calculadas directamente desde los datos de cada partido para los ${LIGA.length} equipos, no estimadas</li>
    </ul>
  </div>

  <div class="meto-block">
    <h3>Simulación Monte Carlo - modelo Poisson por partido</h3>
    <p>Se ejecutan <strong style="color:var(--t1)">100.000 simulaciones</strong> de los ${CALENDARIO_EMBEBIDO.total_pending} partidos restantes. Cada partido se modela con distribución de Poisson a partir de las fuerzas ofensivas y defensivas de cada equipo (basadas en xG y xGA de temporada), con ajuste por localía y regularización bayesiana. Los umbrales de ascenso, playoff y salvación se derivan de las medias históricas de Segunda División (últimas 17 temporadas).</p>
  </div>

  <div class="meto-block">
    <h3>Limitaciones conocidas</h3>
    <ul>
      <li>xG no disponible en ${N_MISSING_XG} partido(s): excluido de medias, nunca sustituido por 0.</li>
<li>errorsLeadToShot solo disponible al 54.5% de los partidos — Sofascore no publica el dato cuando el valor es 0 (ausencia = 0, no = dato faltante).</li>
      <li>accurateThroughBall disponible al 58.3% de los registros por el mismo motivo.</li>
      <li>Correlaciones de Pearson asumen linealidad. Correlaciones no implican causalidad.</li>
    </ul>
  </div>

  <div class="meto-block">
    <h3>Stack técnico</h3>
    <ul>
      <li>Scraping: <span class="code">Python 3</span> + <span class="code">playwright.async_api</span></li>
      <li>Procesado: <span class="code">pandas</span> + <span class="code">pyarrow</span></li>
      <li>Visualización: HTML/CSS/JS</li>
      <li>Monte Carlo: implementación nativa JS</li>
    </ul>
  </div>
</div>
</div>
`;
}
