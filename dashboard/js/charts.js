//  CHART RENDERERS

function renderEvChart(PARTIDOS) {
  var svg = document.getElementById('evChart');
  if (!svg) return;
  var W=560,H=160,PL=32,PR=12,PT=15,PB=25,n=PARTIDOS.length;
  var maxPts = PARTIDOS[n-1].ptAcum;
  var rolling = PARTIDOS.map(function(p,i){
    var sl = PARTIDOS.slice(Math.max(0,i-4), i+1);
    return sl.reduce(function(s,x){return s+x.pts;},0)/sl.length;
  });
  var xs = function(i){return PL+(i/(n-1))*(W-PL-PR);};
  var ys = function(v){return PT+(1-v/(maxPts*1.1))*(H-PT-PB);};
  var yr = function(v){return PT+(1-v/3)*(H-PT-PB);};
  var h = '';
  [0,20,40,60].forEach(function(v){
    if(v > maxPts*1.15) return;
    h+='<line x1="'+PL+'" y1="'+ys(v).toFixed(1)+'" x2="'+(W-PR)+'" y2="'+ys(v).toFixed(1)+'" stroke="#1C2A1F" stroke-width="1"/>';
    h+='<text x="'+(PL-4)+'" y="'+(ys(v)+3).toFixed(1)+'" text-anchor="end" fill="#3A5A42" font-family="JetBrains Mono" font-size="8">'+v+'</text>';
  });
  var area = 'M '+xs(0).toFixed(1)+' '+ys(PARTIDOS[0].ptAcum).toFixed(1);
  PARTIDOS.forEach(function(p,i){if(i>0) area+=' L '+xs(i).toFixed(1)+' '+ys(p.ptAcum).toFixed(1);});
  area+=' L '+xs(n-1).toFixed(1)+' '+(H-PB)+' L '+xs(0).toFixed(1)+' '+(H-PB)+' Z';
  h+='<path d="'+area+'" fill="#00A651" opacity=".08"/>';
  var lp = 'M '+xs(0).toFixed(1)+' '+ys(PARTIDOS[0].ptAcum).toFixed(1);
  PARTIDOS.forEach(function(p,i){if(i>0) lp+=' L '+xs(i).toFixed(1)+' '+ys(p.ptAcum).toFixed(1);});
  h+='<path d="'+lp+'" stroke="#00A651" stroke-width="2" fill="none"/>';
  var rp = 'M '+xs(0).toFixed(1)+' '+yr(rolling[0]).toFixed(1);
  rolling.forEach(function(v,i){if(i>0) rp+=' L '+xs(i).toFixed(1)+' '+yr(v).toFixed(1);});
  h+='<path d="'+rp+'" stroke="#FFD600" stroke-width="1.5" fill="none" stroke-dasharray="4,2" opacity=".8"/>';
  var cols = {W:'#00E676',D:'#FFFFFF',L:'#FF5252'};
  PARTIDOS.forEach(function(p,i){
    var tip = 'J'+p.j+' | '+p.rival+'<br>'+p.gf+'–'+p.ga+' | '+p.res+' | '+p.ptAcum+' pts acum.';
    h+='<circle cx="'+xs(i).toFixed(1)+'" cy="'+ys(p.ptAcum).toFixed(1)+'" r="4" fill="'+cols[p.res]+'" stroke="#070B08" stroke-width="1.5" data-tip="'+tip.replace(/"/g,'&quot;')+'"/>';
  });
  h+='<text x="'+(W-PR-2)+'" y="'+(PT+8)+'" text-anchor="end" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">- acum.</text>';
  h+='<text x="'+(W-PR-2)+'" y="'+(PT+18)+'" text-anchor="end" fill="#8A7A00" font-family="JetBrains Mono" font-size="7">- - rolling-5</text>';
  svg.innerHTML = h;
  svg.querySelectorAll('circle[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderRadar(COR, MED) {
  var svg = document.getElementById('radarSvg');
  if (!svg) return;
  var labels = ['Posesión','xG/p','Tiros tot.','Tiros puerta','% en área','Grandes oc.','Tackles','Recuperac.','Despejes','Duelos gan.'];
  var shotsInBoxPctCor = COR.shotsInBox / COR.shots * 100;
  var shotsInBoxPctMed = MED.shotsInBox / MED.shots * 100;
  var cordoba = [COR.poss, COR.xg, COR.shots, COR.shotsOT, shotsInBoxPctCor, COR.bigC, COR.tackle, COR.recov, COR.clearance, COR.duels];
  var liga    = [MED.poss, MED.xg, MED.shots, MED.shotsOT, shotsInBoxPctMed, MED.bigC, MED.tackle, MED.recov, MED.clearance, MED.duels];
  var maxV    = [80, 2.8, 22, 10, 100, 5, 35, 70, 50, 65];
  var CX=130,CY=130,R=100,n=labels.length,h='';
  [0.2,0.4,0.6,0.8,1].forEach(function(f){
    var pts = labels.map(function(_,i){var a=i*(2*Math.PI/n)-Math.PI/2;return (CX+R*f*Math.cos(a)).toFixed(1)+','+(CY+R*f*Math.sin(a)).toFixed(1);}).join(' ');
    h+='<polygon points="'+pts+'" fill="none" stroke="#1C2A1F" stroke-width="1"/>';
  });
  labels.forEach(function(_,i){
    var a=i*(2*Math.PI/n)-Math.PI/2;
    h+='<line x1="'+CX+'" y1="'+CY+'" x2="'+(CX+R*Math.cos(a)).toFixed(1)+'" y2="'+(CY+R*Math.sin(a)).toFixed(1)+'" stroke="#1C2A1F" stroke-width="1"/>';
    h+='<text x="'+(CX+(R+18)*Math.cos(a)).toFixed(1)+'" y="'+(CY+(R+18)*Math.sin(a)+3).toFixed(1)+'" text-anchor="middle" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">'+labels[i]+'</text>';
  });
  var ligaPts = liga.map(function(v,i){var f=Math.min(v/maxV[i],1),a=i*(2*Math.PI/n)-Math.PI/2;return (CX+R*f*Math.cos(a)).toFixed(1)+','+(CY+R*f*Math.sin(a)).toFixed(1);}).join(' ');
  h+='<polygon points="'+ligaPts+'" fill="rgba(255,255,255,.04)" stroke="#3A5A42" stroke-width="1.5"/>';
  var corPts = cordoba.map(function(v,i){var f=Math.min(v/maxV[i],1),a=i*(2*Math.PI/n)-Math.PI/2;return (CX+R*f*Math.cos(a)).toFixed(1)+','+(CY+R*f*Math.sin(a)).toFixed(1);}).join(' ');
  h+='<polygon points="'+corPts+'" fill="rgba(0,166,81,.15)" stroke="#00A651" stroke-width="2"/>';
  cordoba.forEach(function(v,i){
    var f=Math.min(v/maxV[i],1),a=i*(2*Math.PI/n)-Math.PI/2;
    h+='<circle cx="'+(CX+R*f*Math.cos(a)).toFixed(1)+'" cy="'+(CY+R*f*Math.sin(a)).toFixed(1)+'" r="3" fill="#00A651"/>';
  });
  svg.innerHTML = h;
}

function renderCompStats(COR, MED) {
  var el = document.getElementById('compStats');
  if (!el) return;
  var shotsInBoxPctCor = COR.shotsInBox / COR.shots * 100;
  var shotsInBoxPctMed = MED.shotsInBox / MED.shots * 100;
  var items = [
    {label:'Posesión',          cor:COR.poss,            lig:MED.poss,            fmt:function(v){return v.toFixed(1)+'%';}},
    {label:'xG/partido',        cor:COR.xg,              lig:MED.xg,              fmt:function(v){return v.toFixed(2);}},
    {label:'Tiros tot./p',      cor:COR.shots,           lig:MED.shots,           fmt:function(v){return v.toFixed(1);}},
    {label:'Tiros puerta/p',    cor:COR.shotsOT,         lig:MED.shotsOT,         fmt:function(v){return v.toFixed(2);}},
    {label:'Tiros en área/p',   cor:COR.shotsInBox,      lig:MED.shotsInBox,      fmt:function(v){return v.toFixed(2);}},
    {label:'% tiros en área',   cor:shotsInBoxPctCor,    lig:shotsInBoxPctMed,    fmt:function(v){return v.toFixed(1)+'%';}},
    {label:'Grandes oc./p',     cor:COR.bigC,            lig:MED.bigC,            fmt:function(v){return v.toFixed(2);}},
    {label:'Conversión xG',     cor:COR.conv_xg,         lig:1.00,                fmt:function(v){return v.toFixed(2);}},
    {label:'Toques área/p',     cor:COR.touches,         lig:MED.touches,         fmt:function(v){return v.toFixed(1);}},
    {label:'Presión idx',       cor:COR.presion_idx,     lig:72.0,                fmt:function(v){return v.toFixed(1);}}
  ];
  var maxVal = items.reduce(function(m,i){return Math.max(m,i.cor,i.lig);},0);
  var h = '';
  items.forEach(function(item){
    var pCor=item.cor/maxVal*100, pLig=item.lig/maxVal*100;
    var col = item.cor >= item.lig ? 'var(--g)' : 'var(--r)';
    var diffNum = item.cor - item.lig;
    var ds = (diffNum>0?'+':'')+diffNum.toFixed(2);
    h+='<div style="margin-bottom:11px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:3px">'
      +'<span style="font-family:var(--fm);font-size:9px;color:var(--t3)">'+item.label+'</span>'
      +'<span style="font-family:var(--fm);font-size:9px;color:'+col+'">'+ds+'</span></div>'
      +'<div style="display:flex;gap:4px;align-items:center">'
      +'<div style="width:38px;text-align:right;font-family:var(--fm);font-size:9px;color:var(--r);flex-shrink:0">'+item.fmt(item.cor)+'</div>'
      +'<div style="flex:1;background:var(--s4);border-radius:2px;overflow:hidden;height:5px;position:relative">'
      +'<div style="position:absolute;height:100%;width:'+pLig.toFixed(1)+'%;background:var(--s5);border-radius:2px"></div>'
      +'<div style="position:absolute;height:100%;width:'+pCor.toFixed(1)+'%;background:var(--r);border-radius:2px;opacity:.8"></div>'
      +'</div>'
      +'<div style="width:34px;font-family:var(--fm);font-size:9px;color:var(--t3);flex-shrink:0">'+item.fmt(item.lig)+'</div>'
      +'</div></div>';
  });
  el.innerHTML = h;
}

function renderShotFunnel(PARTIDOS, MED) {
  var el = document.getElementById('shotFunnel');
  if (!el) return;
  var n = PARTIDOS.length;
  var totalShots      = PARTIDOS.reduce(function(s,p){return s+(p.shots||0);},0);
  var totalInBox      = PARTIDOS.reduce(function(s,p){return s+(p.shotsInBox||0);},0);
  var totalOT         = PARTIDOS.reduce(function(s,p){return s+(p.shotsOT||0);},0);
  var totalBigC       = PARTIDOS.reduce(function(s,p){return s+(p.bigC||0);},0);
  var totalBigCScored = PARTIDOS.reduce(function(s,p){return s+(p.bigCScored||0);},0);
  var totalGF         = PARTIDOS.reduce(function(s,p){return s+p.gf;},0);
  var steps = [
    {label:'Tiros totales',      val:totalShots,       pct:100,                          col:'var(--t1)'},
    {label:'Tiros en área',      val:totalInBox,       pct:totalInBox/totalShots*100,    col:'var(--b)'},
    {label:'Tiros a puerta',     val:totalOT,          pct:totalOT/totalShots*100,       col:'#9AF78A'},
    {label:'Grandes ocasiones',  val:totalBigC,        pct:totalBigC/totalShots*100,     col:'var(--o)'},
    {label:'Grandes oc. conv.',  val:totalBigCScored,  pct:totalBigCScored/totalBigC*100,col:'var(--r)'},
    {label:'Goles totales',      val:totalGF,          pct:totalGF/totalShots*100,       col:'var(--g)'}
  ];
  var h = '';
  steps.forEach(function(s) {
    var w = Math.max(s.pct, 3).toFixed(1);
    h += '<div class="funnel-row">'
      +'<div class="funnel-label">'+s.label+'</div>'
      +'<div style="flex:1;background:var(--s4);border-radius:2px;height:20px;overflow:hidden;position:relative">'
      +'<div style="height:100%;width:'+w+'%;background:'+s.col+';border-radius:2px;display:flex;align-items:center;padding:0 8px;transition:width .4s">'
      +'<span style="font-family:var(--fm);font-size:9px;color:var(--bg);font-weight:700;white-space:nowrap">'+s.val+'</span>'
      +'</div></div>'
      +'<div style="font-family:var(--fm);font-size:9px;color:'+s.col+';width:38px;text-align:right;flex-shrink:0">'+s.pct.toFixed(0)+'%</div>'
      +'</div>';
  });
  h += '<div style="margin-top:12px;font-family:var(--fm);font-size:8px;color:var(--t3);border-top:1px solid var(--s4);padding-top:8px;line-height:2">'
    +'Tiros en área/p: <span style="color:var(--b)">'+(totalInBox/n).toFixed(2)+'</span> (liga: '+MED.shotsInBox.toFixed(2)+')<br>'
    +'Tiros fuera área/p: <span style="color:var(--t2)">'+(( totalShots-totalInBox)/n).toFixed(2)+'</span> (liga: '+MED.shotsOutBox.toFixed(2)+')<br>'
    +'Eficiencia por tiro: <span style="color:var(--g)">'+(totalGF/totalShots*100).toFixed(1)+'%</span>'
    +'</div>';
  el.innerHTML = h;
}

function renderBigChanceTimeline(PARTIDOS) {
  var svg = document.getElementById('bigChanceSvg');
  if (!svg) return;
  var W=560,H=180,PL=30,PR=10,PT=20,PB=30,n=PARTIDOS.length;
  var maxBig = Math.max.apply(null, PARTIDOS.map(function(p){return p.bigC||0;}));
  var xs = function(i){return PL+i/(n-1)*(W-PL-PR);};
  var ys = function(v){return PT+(1-v/(maxBig+0.5))*(H-PT-PB);};
  var h = '';
  for(var gv=0; gv<=maxBig; gv++) {
    h+='<line x1="'+PL+'" y1="'+ys(gv).toFixed(1)+'" x2="'+(W-PR)+'" y2="'+ys(gv).toFixed(1)+'" stroke="#1C2A1F" stroke-width="1"/>';
    h+='<text x="'+(PL-4)+'" y="'+(ys(gv)+3).toFixed(1)+'" text-anchor="end" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">'+gv+'</text>';
  }
  PARTIDOS.forEach(function(p,i){
    var sc = p.bigCScored || 0;
    var ms = p.bigCMissed || 0;
    var bw = Math.max(2, (W-PL-PR)/n - 3);
    var cx = xs(i);
    var tip = 'J'+p.j+' '+p.rival+'<br>Grandes oc: '+(p.bigC||0)+' | Conv: '+sc+' | Fall: '+ms;
    if(ms>0){
      var yFail = ys(ms), hFail = H-PB-yFail;
      h+='<rect x="'+(cx-bw/2).toFixed(1)+'" y="'+yFail.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hFail.toFixed(1)+'" fill="rgba(255,109,0,.5)" rx="1" data-tip="'+tip+'"/>';
    }
    if(sc>0){
      var ySc = ys(sc+ms), hSc = ys(ms) - ys(sc+ms);
      if(ms===0){ ySc = ys(sc); hSc = H-PB-ySc; }
      h+='<rect x="'+(cx-bw/2).toFixed(1)+'" y="'+ySc.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+hSc.toFixed(1)+'" fill="rgba(0,212,106,.7)" rx="1" data-tip="'+tip+'"/>';
    }
    if(p.hitWoodwork && p.hitWoodwork > 0){
      h+='<text x="'+cx.toFixed(1)+'" y="'+(PT-4)+'" text-anchor="middle" fill="#FFD600" font-family="JetBrains Mono" font-size="7" opacity=".8">|</text>';
    }
  });
  h+='<rect x="'+PL+'" y="'+(H-PB+8)+'" width="10" height="6" fill="rgba(0,212,106,.7)" rx="1"/>';
  h+='<text x="'+(PL+14)+'" y="'+(H-PB+14)+'" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">Convertida</text>';
  h+='<rect x="'+(PL+80)+'" y="'+(H-PB+8)+'" width="10" height="6" fill="rgba(255,109,0,.5)" rx="1"/>';
  h+='<text x="'+(PL+94)+'" y="'+(H-PB+14)+'" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">Fallada</text>';
  h+='<text x="'+(PL+155)+'" y="'+(H-PB+14)+'" fill="#7A7A00" font-family="JetBrains Mono" font-size="7">| = poste/larguero</text>';
  svg.innerHTML = h;
  svg.querySelectorAll('[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderDefensePanel(PARTIDOS, MED) {
  var el = document.getElementById('defensePanel');
  if (!el) return;
  function avgV(f){ return avgValid(PARTIDOS,f); }
  var items = [
    {label:'Despejes/p',           cor:avgV('clearance'),    lig:MED.clearance,    inv:false, note:'limpiezas defensivas'},
    {label:'Duelos aéreos/p',      cor:avgV('duels'),        lig:MED.duels,        inv:false, note:'disputas aéreas'},
    {label:'Tackles/p',            cor:avgV('tackle'),       lig:MED.tackle,       inv:false, note:'entradas'},
    {label:'Interceptaciones/p',   cor:avgV('inter'),        lig:MED.inter,        inv:false, note:'intercepciones'},
    {label:'Recuperaciones/p',     cor:avgV('recov'),        lig:MED.recov,        inv:false, note:'balones recuperados'},
    {label:'Salvadas portero/p',   cor:avgV('gkSaves'),      lig:MED.gkSaves,      inv:true,  note:'más = más trabajo'},
    {label:'Pérdidas en duelo/p',  cor:avgV('dispossessed'), lig:MED.dispossessed, inv:true,  note:'posesión perdida'},
    {label:'Faltas concedidas/p',  cor:avgV('fouls'),        lig:MED.fouls,        inv:true,  note:'infracciones'},
    {label:'Fueras de juego/p',    cor:avgV('offsides'),     lig:MED.offsides,     inv:false, note:'trampas'},
    {label:'Córners a favor/p',    cor:avgV('corners'),      lig:MED.corners,      inv:false, note:'saque de esquina'}
  ];
  var maxVal = items.reduce(function(m,it){ return Math.max(m, it.cor||0, it.lig||0); },0);
  var half = Math.ceil(items.length/2);
  var h = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  [items.slice(0,half), items.slice(half)].forEach(function(col){
    h += '<div>';
    col.forEach(function(item){
      if(item.cor === null) return;
      var isBetter = item.inv ? item.cor <= item.lig : item.cor >= item.lig;
      var col_c = isBetter ? 'var(--g)' : 'var(--r)';
      var pCor = item.cor/maxVal*100, pLig = item.lig/maxVal*100;
      h+='<div style="margin-bottom:9px">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
        +'<span style="font-family:var(--fm);font-size:9px;color:var(--t3)">'+item.label+'</span>'
        +'<span style="font-family:var(--fm);font-size:8px;color:var(--t3)">'+item.note+'</span>'
        +'</div>'
        +'<div style="display:flex;gap:4px;align-items:center">'
        +'<div style="width:34px;text-align:right;font-family:var(--fm);font-size:9px;color:'+col_c+';flex-shrink:0">'+item.cor.toFixed(2)+'</div>'
        +'<div style="flex:1;background:var(--s4);border-radius:2px;height:4px;position:relative">'
        +'<div style="position:absolute;height:100%;width:'+pLig.toFixed(1)+'%;background:var(--s5);border-radius:2px"></div>'
        +'<div style="position:absolute;height:100%;width:'+pCor.toFixed(1)+'%;background:'+col_c+';border-radius:2px;opacity:.8"></div>'
        +'</div>'
        +'<div style="width:30px;font-family:var(--fm);font-size:8px;color:var(--t3);flex-shrink:0">'+item.lig.toFixed(1)+'</div>'
        +'</div></div>';
    });
    h += '</div>';
  });
  h += '</div>';
  el.innerHTML = h;
}

function renderCorrChart(CORR) {
  var svg = document.getElementById('corrChart');
  if (!svg) return;
  var cols = ['#00E676','#00E676','#69F0AE','#B9F6CA','#CCFF90','#F4FF81','#FFFF8D','#FFD180','#FF9E80','#FF6659'];
  var W=900,H=220,MIDLINE=70,n=CORR.length,bw=(W-60)/n,maxR=0.35,h='';
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', '0 0 900 '+H);
  h+='<line x1="20" y1="'+MIDLINE+'" x2="'+W+'" y2="'+MIDLINE+'" stroke="#1C2A1F" stroke-width="1"/>';
  CORR.forEach(function(c,i){
    var col = cols[Math.min(i,cols.length-1)];
    var x = 30+i*bw+bw/2;
    var barH = Math.abs(c.r)/maxR*50;
    var y = c.r >= 0 ? MIDLINE-barH : MIDLINE;
    h+='<rect x="'+(x-bw/2+3).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-6).toFixed(1)+'" height="'+barH.toFixed(1)+'" fill="'+col+'" opacity=".85" rx="2" data-tip="'+c.label+' | r = '+c.r+'"/>';
    h+='<text x="'+x.toFixed(1)+'" y="'+(c.r>=0?y-5:y+barH+13).toFixed(1)+'" text-anchor="middle" fill="#8A9A8A" font-family="JetBrains Mono" font-size="9">'+(c.r>=0?'+':'')+c.r+'</text>';
    h+='<text transform="translate('+x.toFixed(1)+',128) rotate(-65)" text-anchor="end" fill="#4A6A4A" font-family="JetBrains Mono" font-size="9">'+c.label+'</text>';
  });
  svg.innerHTML = h;
  svg.querySelectorAll('rect[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderDefRanking(LIGA, COR) {
  var el = document.getElementById('defRanking');
  if (!el) return;
  var sorted = LIGA.slice().sort(function(a,b){ return (a.gc/a.pj)-(b.gc/b.pj); });
  var maxGC = Math.max.apply(null, sorted.map(function(t){return t.gc/t.pj;}));
  var h = '';
  sorted.forEach(function(t,i){
    var isCor = t.name === 'Córdoba';
    var gcpp = (t.gc/t.pj).toFixed(2);
    var pct = (t.gc/t.pj)/maxGC*100;
    var col = isCor ? 'var(--r)' : (i<7 ? 'var(--g)' : i<14 ? 'var(--t1)' : 'var(--r)');
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;padding:2px '+(isCor?'4px 2px 4px':'0')+';">'
      +'<div style="font-family:var(--fm);font-size:8px;color:var(--t3);width:14px;text-align:right;flex-shrink:0">'+(i+1)+'</div>'
      +'<div style="font-size:11px;color:'+(isCor?'var(--r)':'var(--t2)')+';width:130px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:'+(isCor?700:400)+';flex-shrink:0">'+t.name+'</div>'
      +'<div style="flex:1;height:3px;background:var(--s4);border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct.toFixed(1)+'%;background:'+col+';border-radius:2px"></div></div>'
      +'<div style="font-family:var(--fm);font-size:9px;color:'+col+';width:32px;text-align:right;flex-shrink:0">'+gcpp+'</div>'
      +'</div>';
  });
  el.innerHTML = h;
}

function renderTablaLiga(LIGA) {
  var tbl = document.getElementById('tablaLiga');
  if (!tbl) return;
  var h = '<thead><tr>'
    +'<th>#</th><th>Equipo</th><th>PJ</th><th>Pts</th><th>GF</th><th>GC</th><th>GD</th><th>PPG</th><th>xG/p</th><th>Conv.</th><th>Poss%</th><th>Tiros/p</th><th>TirÁrea/p</th><th>GrOc/p</th>'
    +'</tr></thead><tbody>';
  LIGA.forEach(function(eq){
    var isCor = eq.name === 'Córdoba';
    var gd = eq.gf-eq.gc, gdStr = gd>0?'+'+gd:''+gd;
    var zones = eq.pos<=2?'var(--g)':eq.pos<=6?'var(--t1)':eq.pos>=20?'var(--r)':'var(--t3)';
    var convCol = eq.conv>=1.1?'var(--g)':eq.conv>=0.9?'var(--t1)':'var(--r)';
    var gdCol = gd>0?'var(--g)':gd<0?'var(--r)':'var(--t3)';
    h+='<tr class="data-row'+(isCor?' highlight':'')+'"><td data-val="'+eq.pos+'"><span class="zona-bar" style="background:'+zones+'"></span>'+eq.pos+'</td>'
      +'<td data-val="'+eq.name+'">'+eq.name+'</td>'
      +'<td data-val="'+eq.pj+'">'+eq.pj+'</td>'
      +'<td data-val="'+eq.pts+'" style="font-family:var(--fm);font-size:13px;color:'+(isCor?'var(--r)':'var(--t1)')+';font-weight:700">'+eq.pts+'</td>'
      +'<td data-val="'+eq.gf+'">'+eq.gf+'</td>'
      +'<td data-val="'+eq.gc+'">'+eq.gc+'</td>'
      +'<td data-val="'+gd+'" style="color:'+gdCol+'">'+gdStr+'</td>'
      +'<td data-val="'+eq.ppg+'" style="font-family:var(--fm);font-size:10px">'+eq.ppg.toFixed(3)+'</td>'
      +'<td data-val="'+eq.xg+'" style="font-family:var(--fm);font-size:10px">'+eq.xg+'</td>'
      +'<td data-val="'+eq.conv+'" style="font-family:var(--fm);font-size:10px;color:'+convCol+'">'+eq.conv+'</td>'
      +'<td data-val="'+(eq.poss||0)+'" style="font-family:var(--fm);font-size:10px">'+(eq.poss?eq.poss.toFixed(1)+'%':'–')+'</td>'
      +'<td data-val="'+(eq.shots||0)+'" style="font-family:var(--fm);font-size:10px">'+(eq.shots?eq.shots.toFixed(1):'–')+'</td>'
      +'<td data-val="'+(eq.shotsInBox||0)+'" style="font-family:var(--fm);font-size:10px">'+(eq.shotsInBox?eq.shotsInBox.toFixed(1):'–')+'</td>'
      +'<td data-val="'+(eq.bigC||0)+'" style="font-family:var(--fm);font-size:10px">'+(eq.bigC?eq.bigC.toFixed(2):'–')+'</td>'
      +'</tr>';
  });
  h += '</tbody>';
  tbl.innerHTML = h;
}

function renderScatter(LIGA) {
  var svg = document.getElementById('scatterSvg');
  if (!svg) return;
  var W=320,H=320,PAD=36;
  var allXg = LIGA.map(function(t){return t.xg;});
  var allPts = LIGA.map(function(t){return t.pts;});
  var minX=Math.min.apply(null,allXg)-0.15, maxX=Math.max.apply(null,allXg)+0.15;
  var minY=Math.min.apply(null,allPts)-4,   maxY=Math.max.apply(null,allPts)+4;
  var xs=function(v){return (v-minX)/(maxX-minX)*(W-2*PAD)+PAD;};
  var ys=function(v){return H-((v-minY)/(maxY-minY)*(H-2*PAD)+PAD);};
  var n=LIGA.length;
  var sx=allXg.reduce(function(s,v){return s+v;},0)/n;
  var sy=allPts.reduce(function(s,v){return s+v;},0)/n;
  var num=LIGA.reduce(function(s,t){return s+(t.xg-sx)*(t.pts-sy);},0);
  var den=LIGA.reduce(function(s,t){return s+Math.pow(t.xg-sx,2);},0);
  var denY=LIGA.reduce(function(s,t){return s+Math.pow(t.pts-sy,2);},0);
  var m=num/den, b2=sy-m*sx;
  var r2=(num*num)/(den*denY);
  var h='';
  [1.0,1.5,2.0].forEach(function(v){ if(v>=minX&&v<=maxX) h+='<line x1="'+xs(v).toFixed(1)+'" y1="'+PAD+'" x2="'+xs(v).toFixed(1)+'" y2="'+(H-PAD)+'" stroke="#1A2A1A" stroke-width="1"/>'; });
  [30,40,50].forEach(function(v){ if(v>=minY&&v<=maxY) h+='<line x1="'+PAD+'" y1="'+ys(v).toFixed(1)+'" x2="'+(W-PAD)+'" y2="'+ys(v).toFixed(1)+'" stroke="#1A2A1A" stroke-width="1"/>'; });
  h+='<text x="'+(W/2)+'" y="'+(H-4)+'" text-anchor="middle" fill="#3A5A42" font-family="JetBrains Mono" font-size="8">xG/partido</text>';
  h+='<text x="10" y="'+(H/2)+'" text-anchor="middle" fill="#3A5A42" font-family="JetBrains Mono" font-size="8" transform="rotate(-90,10,'+(H/2)+')">Puntos totales</text>';
  h+='<line x1="'+xs(minX).toFixed(1)+'" y1="'+ys(m*minX+b2).toFixed(1)+'" x2="'+xs(maxX).toFixed(1)+'" y2="'+ys(m*maxX+b2).toFixed(1)+'" stroke="#FFD600" stroke-width="1" stroke-dasharray="3,3" opacity=".5"/>';
  h+='<text x="'+(W-PAD-2)+'" y="'+(PAD+12)+'" text-anchor="end" fill="#FFD600" font-family="JetBrains Mono" font-size="8" opacity=".85">R²='+r2.toFixed(2)+'</text>';
  LIGA.forEach(function(t){
    var isCor = t.name === 'Córdoba';
    var cx=xs(t.xg), cy=ys(t.pts);
    h+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+(isCor?7:5)+'" fill="'+(isCor?'#00A651':'#1E3020')+'" stroke="'+(isCor?'#FF5252':'#3A5A42')+'" stroke-width="'+(isCor?2:1)+'" data-tip="'+t.name+'<br>xG/p: '+t.xg+' | Pts: '+t.pts+'"/>';
    if(isCor) h+='<text x="'+(cx+9).toFixed(1)+'" y="'+(cy+3).toFixed(1)+'" fill="#00A651" font-family="JetBrains Mono" font-size="8">COR</text>';
  });
  svg.innerHTML = h;
  svg.querySelectorAll('circle[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderRankMetrics(LIGA, COR) {
  var el = document.getElementById('rankMetrics');
  if (!el) return;
  var gcPerPj  = COR.gc / COR.partidos;
  var gcBetter = LIGA.filter(function(t){ return (t.gc/t.pj) < gcPerPj; }).length;
  var gcRank   = gcBetter + 1;
  var total    = LIGA.length;
  var items = [
    {label:'xG por partido',    val:COR.xg.toFixed(2),         rank:rankDesc(LIGA,'xg',COR.xg),           note:'Generación ofensiva',    hasRank:true},
    {label:'PPG',               val:COR.ppg.toFixed(3),        rank:rankDesc(LIGA,'ppg',COR.ppg),          note:'Rendimiento',            hasRank:true},
    {label:'Conversión xG',     val:COR.conv_xg.toFixed(2),    rank:rankDesc(LIGA,'conv',COR.conv_xg),     note:'Eficiencia finalizadora', hasRank:true},
    {label:'GC/partido',        val:gcPerPj.toFixed(2),        rank:gcRank,                                note:'Solidez defensiva',      hasRank:true},
    {label:'Posesión media',    val:COR.poss+'%',              rank:rankDesc(LIGA,'poss',COR.poss),        note:'vs media liga',          hasRank:true},
    {label:'Tiros totales/p',   val:COR.shots.toFixed(1),      rank:rankDesc(LIGA,'shots',COR.shots),      note:'Volumen ofensivo',        hasRank:true},
    {label:'Tiros en área/p',   val:COR.shotsInBox.toFixed(2), rank:rankDesc(LIGA,'shotsInBox',COR.shotsInBox), note:'Peligro real',      hasRank:true},
    {label:'Grandes oc./p',     val:COR.bigC.toFixed(2),       rank:rankDesc(LIGA,'bigC',COR.bigC),        note:'Creación',               hasRank:true},
  ];
  var h = '';
  items.forEach(function(item){
    var pct = item.hasRank ? 1-((item.rank-1)/(total-1)) : 0;
    var col = item.hasRank
      ? (item.rank<=6?'var(--g)':item.rank<=11?'var(--t1)':item.rank<=16?'var(--o)':'var(--r)')
      : 'var(--t3)';
    var rankLabel = item.hasRank
      ? '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:'+col+';margin:4px 0">'+item.rank+'º/'+total+'</div>'
      : '<div style="font-family:var(--fm);font-size:8px;color:#FF8040;margin:8px 0 6px">N/D vs liga</div>';
    h+='<div style="background:var(--s1);border:1px solid var(--s4);padding:14px;text-align:center">'
      +'<div style="font-family:var(--fm);font-size:8px;color:var(--t3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">'+item.label+'</div>'
      +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:30px;font-weight:700;color:var(--t1);line-height:1">'+item.val+'</div>'
      +rankLabel
      +'<div style="height:3px;background:var(--s4);border-radius:2px;overflow:hidden;margin:6px 0"><div style="height:100%;width:'+(pct*100).toFixed(1)+'%;background:'+col+';border-radius:2px"></div></div>'
      +'<div style="font-family:var(--fm);font-size:8px;color:var(--t3)">'+item.note+'</div>'
      +'</div>';
  });
  el.innerHTML = h;
}

function renderMCDist(MC) {
  var svg = document.getElementById('mcDist');
  if (!svg) return;
  var W=900,H=140,PAD=20;
  var bins = MC.bins;
  var maxCount = 0;
  for (var k in bins) { if(bins[k]>maxCount) maxCount=bins[k]; }
  var xS=function(p){return (p-40)/(95-40)*(W-2*PAD)+PAD;};
  var yS=function(c){return (H-PAD)-(c/maxCount)*(H-2*PAD);};
  var h='';
  [{from:40,to:42,col:'rgba(220,40,40,.25)'},{from:42,to:50,col:'rgba(255,109,0,.12)'},{from:50,to:68,col:'rgba(68,138,255,.10)'},{from:68,to:80,col:'rgba(255,255,255,.08)'},{from:80,to:95,col:'rgba(0,230,118,.15)'}].forEach(function(r){
    h+='<rect x="'+xS(r.from).toFixed(1)+'" y="'+PAD+'" width="'+(xS(r.to)-xS(r.from)).toFixed(1)+'" height="'+(H-2*PAD)+'" fill="'+r.col+'"/>';
  });
  for (var pt=40; pt<=94; pt++) {
    var c = bins[pt] || 0;
    if (c === 0) continue;
    var bw = xS(pt+1)-xS(pt)-0.5;
    var by=yS(c), bh=H-PAD-by;
    h+='<rect x="'+xS(pt).toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+Math.max(bw,1).toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="rgba(0,166,81,.55)" stroke="#00A651" stroke-width=".3" data-tip="'+pt+' pts: '+c+' sims ('+((c/100000)*100).toFixed(1)+'%)"/>';
  }
  h+='<line x1="'+xS(MC.median).toFixed(1)+'" y1="'+(PAD-5)+'" x2="'+xS(MC.median).toFixed(1)+'" y2="'+(H-PAD)+'" stroke="white" stroke-width="2" stroke-dasharray="4,2"/>';
  h+='<text x="'+xS(MC.median).toFixed(1)+'" y="'+(PAD-8)+'" text-anchor="middle" fill="white" font-family="JetBrains Mono" font-size="9">Mediana '+MC.median+'pts</text>';
  h+='<line x1="'+xS(MC.thr_playoff).toFixed(1)+'" y1="'+PAD+'" x2="'+xS(MC.thr_playoff).toFixed(1)+'" y2="'+(H-PAD)+'" stroke="#FFD600" stroke-width="1.5" stroke-dasharray="3,3"/>';
  h+='<text x="'+(xS(MC.thr_playoff)+2).toFixed(1)+'" y="'+(PAD+12)+'" fill="#FFD600" font-family="JetBrains Mono" font-size="8">Playoff</text>';
  h+='<line x1="'+xS(MC.thr_desc).toFixed(1)+'" y1="'+PAD+'" x2="'+xS(MC.thr_desc).toFixed(1)+'" y2="'+(H-PAD)+'" stroke="#FF5252" stroke-width="1" stroke-dasharray="3,3" opacity=".6"/>';
  h+='<text x="'+(xS(MC.thr_desc)+2).toFixed(1)+'" y="'+(PAD+12)+'" fill="#FF5252" font-family="JetBrains Mono" font-size="8" opacity=".8">Salvación</text>';
  svg.innerHTML = h;
  svg.querySelectorAll('rect[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderPartidosTable(PARTIDOS) {
  var tbl = document.getElementById('tablaPartidos');
  if (!tbl) return;
  var resCol = {W:'var(--g)',D:'var(--t1)',L:'#FF5252'};
  var h = '<thead><tr>'
    +'<th>J</th><th>Rival</th><th>Loc.</th><th>Res.</th>'
    +'<th>GF</th><th>GA</th><th>Pts</th><th>Acum.</th>'
    +'<th>xG</th><th>Tiros</th><th>Prt.</th><th>BigC</th><th>Pos.%</th><th>Pases</th>'
    +'</tr></thead><tbody>';
  PARTIDOS.forEach(function(p){
    var xgStr = p.xg !== null ? p.xg.toFixed(2) : 'N/D';
    var xgDval = p.xg !== null ? p.xg : '';
    var bigCStr = (p.bigC !== null && p.bigC !== undefined) ? p.bigC : '-';
    h+='<tr class="data-row">'
      +'<td data-val="'+p.j+'" style="font-family:var(--fm);font-size:10px;color:var(--t3)">'+p.j+'</td>'
      +'<td data-val="'+p.rival+'" style="text-align:left;color:var(--t1)">'+p.rival+'</td>'
      +'<td data-val="'+p.local+'"><span class="lv-tag lv-'+p.local+'">'+(p.local==='L'?'LOC':'VIS')+'</span></td>'
      +'<td data-val="'+p.res+'"><span class="rb rb-'+p.res+'">'+p.res+'</span></td>'
      +'<td data-val="'+p.gf+'" style="color:var(--g);font-weight:700">'+p.gf+'</td>'
      +'<td data-val="'+p.ga+'" style="color:var(--r)">'+p.ga+'</td>'
      +'<td data-val="'+p.pts+'" style="color:'+resCol[p.res]+';font-family:var(--fm);font-size:12px;font-weight:700">'+p.pts+'</td>'
      +'<td data-val="'+p.ptAcum+'" style="font-family:var(--fm);font-size:10px;color:var(--t3)">'+p.ptAcum+'</td>'
      +'<td data-val="'+xgDval+'" style="font-family:var(--fm);font-size:10px">'+(p.xg!==null?xgStr:'<span class="nd-tag">N/D</span>')+'</td>'
      +'<td data-val="'+p.shots+'">'+p.shots+'</td>'
      +'<td data-val="'+p.shotsOT+'">'+p.shotsOT+'</td>'
      +'<td data-val="'+(p.bigC||0)+'" style="font-family:var(--fm);font-size:10px;color:var(--o)">'+bigCStr+'</td>'
      +'<td data-val="'+p.poss+'">'+p.poss+'%</td>'
      +'<td data-val="'+p.passes+'">'+p.passes+'</td>'
      +'</tr>';
  });
  h += '</tbody>';
  tbl.innerHTML = h;
}

function renderShotsChart(PARTIDOS) {
  var svg = document.getElementById('shotsChart');
  if (!svg) return;
  var W=560,H=140,PL=25,PR=10,PT=15,PB=25,n=PARTIDOS.length;
  var xs=function(i){return PL+i/(n-1)*(W-PL-PR);};
  var maxS=Math.max.apply(null, PARTIDOS.map(function(p){return p.shots;}));
  var ys=function(v){return PT+(1-v/(maxS*1.1))*(H-PT-PB);};
  var yxg=function(v){return PT+(1-v/3)*(H-PT-PB);};
  var cols={W:'rgba(0,230,118,.6)',D:'rgba(255,255,255,.4)',L:'rgba(220,40,40,.55)'};
  var h='';
  PARTIDOS.forEach(function(p,i){
    var bw=Math.max(2,(W-PL-PR)/n-2);
    var bh=H-PB-ys(p.shots);
    var xgLabel = p.xg!==null ? 'xG: '+p.xg.toFixed(2) : 'xG: N/D';
    h+='<rect x="'+(xs(i)-bw/2).toFixed(1)+'" y="'+ys(p.shots).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+cols[p.res]+'" rx="1" data-tip="J'+p.j+' '+p.rival+'<br>'+p.shots+' tiros | '+xgLabel+'<br>BigC: '+(p.bigC||0)+'"/>';
  });
  var validXg = PARTIDOS.filter(function(p){return p.xg!==null;});
  if (validXg.length > 1) {
    var fi = PARTIDOS.indexOf(validXg[0]);
    var lp = 'M '+xs(fi).toFixed(1)+' '+yxg(validXg[0].xg).toFixed(1);
    for (var i=1; i<validXg.length; i++) {
      var ci = PARTIDOS.indexOf(validXg[i]);
      lp += ' L '+xs(ci).toFixed(1)+' '+yxg(validXg[i].xg).toFixed(1);
    }
    h+='<path d="'+lp+'" stroke="#FFD600" stroke-width="1.5" fill="none" stroke-dasharray="4,2"/>';
  }
  h+='<line x1="'+PL+'" y1="'+ys(12.47).toFixed(1)+'" x2="'+(W-PR)+'" y2="'+ys(12.47).toFixed(1)+'" stroke="#3A5A42" stroke-width="1" stroke-dasharray="2,2"/>';
  h+='<text x="'+(W-PR-2)+'" y="'+(ys(12.47)-3).toFixed(1)+'" text-anchor="end" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">media liga 12.47</text>';
  h+='<rect x="'+PL+'" y="4" width="14" height="4" fill="rgba(0,230,118,.6)"/><text x="'+(PL+18)+'" y="9" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">Tiros (W/D/L)</text>';
  h+='<line x1="'+(PL+90)+'" y1="6" x2="'+(PL+110)+'" y2="6" stroke="#FFD600" stroke-width="1.5" stroke-dasharray="3,2"/><text x="'+(PL+114)+'" y="9" fill="#3A5A42" font-family="JetBrains Mono" font-size="7">xG/p</text>';
  svg.innerHTML = h;
  svg.querySelectorAll('rect[data-tip]').forEach(function(el){
    el.addEventListener('mouseover', function(e){ showTT(e, el.getAttribute('data-tip')); });
    el.addEventListener('mouseout', hideTT);
  });
}

function renderRivalesTable(PARTIDOS) {
  var tbl = document.getElementById('tablaRivales');
  if (!tbl) return;
  var map = {};
  PARTIDOS.forEach(function(p) {
    if (!map[p.rival]) map[p.rival] = {rival:p.rival, pj:0, w:0, d:0, l:0, gf:0, ga:0, pts:0, xgSum:0, xgN:0, bigCSum:0};
    var r = map[p.rival];
    r.pj++;
    if (p.res === 'W') { r.w++; r.pts += 3; }
    else if (p.res === 'D') { r.d++; r.pts += 1; }
    else r.l++;
    r.gf += p.gf;
    r.ga += p.ga;
    if (p.xg !== null) { r.xgSum += p.xg; r.xgN++; }
    r.bigCSum += (p.bigC || 0);
  });
  var rivales = Object.values(map).sort(function(a,b) { return b.pts - a.pts || (b.gf-b.ga) - (a.gf-a.ga); });
  var h = '<thead><tr>'
    +'<th style="text-align:left">Rival</th>'
    +'<th>PJ</th><th>V</th><th>E</th><th>D</th>'
    +'<th>GF</th><th>GC</th><th>GD</th><th>Pts</th><th>xG</th><th>BigC</th>'
    +'</tr></thead><tbody>';
  rivales.forEach(function(r) {
    var gd = r.gf - r.ga;
    var gdStr = gd > 0 ? '+'+gd : ''+gd;
    var gdCol = gd > 0 ? 'var(--g)' : gd < 0 ? 'var(--r)' : 'var(--t3)';
    var xgStr = r.xgN > 0 ? (r.xgSum / r.xgN).toFixed(2) : 'N/D';
    var ptsCol = r.pts >= 4 ? 'var(--g)' : r.pts >= 2 ? 'var(--t1)' : '#FF5252';
    h += '<tr class="data-row">'
      +'<td data-val="'+r.rival+'" style="text-align:left;color:var(--t1);font-weight:500">'+r.rival+'</td>'
      +'<td data-val="'+r.pj+'">'+r.pj+'</td>'
      +'<td data-val="'+r.w+'" style="color:var(--g)">'+r.w+'</td>'
      +'<td data-val="'+r.d+'" style="color:var(--t3)">'+r.d+'</td>'
      +'<td data-val="'+r.l+'" style="color:#FF5252">'+r.l+'</td>'
      +'<td data-val="'+r.gf+'" style="color:var(--g);font-weight:700">'+r.gf+'</td>'
      +'<td data-val="'+r.ga+'" style="color:var(--r)">'+r.ga+'</td>'
      +'<td data-val="'+gd+'" style="color:'+gdCol+'">'+gdStr+'</td>'
      +'<td data-val="'+r.pts+'" style="font-family:var(--fm);font-size:13px;color:'+ptsCol+';font-weight:700">'+r.pts+'</td>'
      +'<td data-val="'+(r.xgN>0?r.xgSum/r.xgN:'')+'" style="font-family:var(--fm);font-size:10px">'+xgStr+'</td>'
      +'<td data-val="'+r.bigCSum+'" style="font-family:var(--fm);font-size:10px;color:var(--o)">'+r.bigCSum+'</td>'
      +'</tr>';
  });
  h += '</tbody>';
  tbl.innerHTML = h;
}

function renderAdvStats(PARTIDOS, MED, COR) {
  var el = document.getElementById('advStats');
  if (!el) return;
  var xgMed = avgValid(PARTIDOS, 'xg');
  var validXgCount = PARTIDOS.filter(function(p){return p.xg!==null;}).length;
  var items = [
    {label:'xG medio/p',         val:xgMed !== null ? xgMed.toFixed(2) : 'N/D', lig:MED.xg.toFixed(2),           numVal:xgMed,                          numLig:MED.xg},
    {label:'Tiros tot. /p',      val:avgValid(PARTIDOS,'shots').toFixed(1),      lig:MED.shots.toFixed(1),         numVal:avgValid(PARTIDOS,'shots'),      numLig:MED.shots},
    {label:'Tiros puerta/p',     val:avgValid(PARTIDOS,'shotsOT').toFixed(2),    lig:MED.shotsOT.toFixed(2),       numVal:avgValid(PARTIDOS,'shotsOT'),    numLig:MED.shotsOT},
    {label:'Tiros en área/p',    val:avgValid(PARTIDOS,'shotsInBox').toFixed(2), lig:MED.shotsInBox.toFixed(2),    numVal:avgValid(PARTIDOS,'shotsInBox'), numLig:MED.shotsInBox},
    {label:'Grandes oc./p',      val:avgValid(PARTIDOS,'bigC').toFixed(2),       lig:MED.bigC.toFixed(2),          numVal:avgValid(PARTIDOS,'bigC'),       numLig:MED.bigC},
    {label:'Posesión media',     val:avgValid(PARTIDOS,'poss').toFixed(0)+'%',   lig:MED.poss.toFixed(0)+'%',     numVal:avgValid(PARTIDOS,'poss'),       numLig:MED.poss},
    {label:'Toques área/p',      val:avgValid(PARTIDOS,'touches').toFixed(1),    lig:MED.touches.toFixed(1),       numVal:avgValid(PARTIDOS,'touches'),    numLig:MED.touches},
    {label:'Entradas último 3º', val:avgValid(PARTIDOS,'finalThirdEnt').toFixed(1),lig:MED.finalThirdEnt.toFixed(1),numVal:avgValid(PARTIDOS,'finalThirdEnt'),numLig:MED.finalThirdEnt},
    {label:'Tackles /p',         val:avgValid(PARTIDOS,'tackle').toFixed(1),     lig:MED.tackle.toFixed(1),        numVal:avgValid(PARTIDOS,'tackle'),     numLig:MED.tackle},
    {label:'Recuperaciones/p',   val:avgValid(PARTIDOS,'recov').toFixed(1),      lig:MED.recov.toFixed(1),         numVal:avgValid(PARTIDOS,'recov'),      numLig:MED.recov},
    {label:'Despejes/p',         val:avgValid(PARTIDOS,'clearance').toFixed(1),  lig:MED.clearance.toFixed(1),     numVal:avgValid(PARTIDOS,'clearance'),  numLig:MED.clearance},
    {label:'Duelos gan.',        val:avgValid(PARTIDOS,'duels').toFixed(0)+'%',  lig:MED.duels.toFixed(0)+'%',    numVal:avgValid(PARTIDOS,'duels'),      numLig:MED.duels}
  ];
  var h='';
  items.forEach(function(item){
    var nv = item.numVal, nl = item.numLig;
    var col = (nv !== null && nv >= nl) ? 'var(--g)' : 'var(--r)';
    h+='<div class="hbar-row">'
      +'<div class="hbar-label">'+item.label+'</div>'
      +'<div style="flex:1;display:flex;gap:8px;align-items:center">'
      +'<span style="font-family:var(--fm);font-size:10px;color:'+col+';min-width:42px">'+item.val+'</span>'
      +'<span style="font-family:var(--fm);font-size:8px;color:var(--t3)">vs '+item.lig+' liga</span>'
      +'</div></div>';
  });
  if (validXgCount < PARTIDOS.length) {
    h+='<div style="margin-top:12px;font-family:var(--fm);font-size:8px;color:var(--t3)">* xG calculado sobre '+validXgCount+'/'+PARTIDOS.length+' partidos con datos disponibles</div>';
  }
  el.innerHTML = h;
}

function renderTablaProyecciones(mcAll) {
  var tbl = document.getElementById('tablaProyecciones');
  if (!tbl) return;

  var h = '<thead><tr>'
    +'<th>#</th><th>Equipo</th><th>Pts</th>'
    +'<th>Ascenso dir.</th><th>Playoff</th><th>Salvación</th><th>Descenso</th>'
    +'</tr></thead><tbody>';

  mcAll.forEach(function(t) {
    var isCor = t.name === 'Córdoba';
    var zones = t.pos<=2?'var(--g)':t.pos<=6?'var(--t1)':t.pos>=20?'var(--r)':'var(--t3)';
    var d  = (t.pDirect*100).toFixed(1);
    var po = (t.pPlayoff*100).toFixed(1);
    var sa = (t.pMid*100).toFixed(1);
    var de = (t.pDesc*100).toFixed(1);
    var noData = t.pending === 0;

    h += '<tr class="data-row'+(isCor?' highlight':'')+'"">'
      +'<td data-val="'+t.pos+'"><span class="zona-bar" style="background:'+zones+'"></span>'+t.pos+'</td>'
      +'<td data-val="'+t.name+'">'+t.name+'</td>'
      +'<td data-val="'+t.pts+'" style="font-family:var(--fm);font-size:13px;font-weight:700">'+t.pts+'</td>';

    if (noData) {
      h += '<td colspan="4" style="font-family:var(--fm);font-size:9px;color:var(--t3);text-align:center">sin calendario</td>';
    } else {
      h += '<td data-val="'+t.pDirect+'" style="font-family:var(--fm);font-size:11px">'+d+'%</td>'
        +'<td data-val="'+t.pPlayoff+'" style="font-family:var(--fm);font-size:11px">'+po+'%</td>'
        +'<td data-val="'+t.pMid+'" style="font-family:var(--fm);font-size:11px">'+sa+'%</td>'
        +'<td data-val="'+t.pDesc+'" style="font-family:var(--fm);font-size:11px">'+de+'%</td>';
    }
    h += '</tr>';
  });

  h += '</tbody>';
  tbl.innerHTML = h;
}
