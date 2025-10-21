(function(){
  const R_EARTH = 6371000; // meters
  const C = 299792458; // m/s

  const els = {
    file: document.getElementById('csvFile'),
    freqGHz: document.getElementById('freqGHz'),
    kFactor: document.getElementById('kFactor'),
    txH: document.getElementById('txH'),
    rxH: document.getElementById('rxH'),
    plotBtn: document.getElementById('plotBtn'),
    resetBtn: document.getElementById('resetBtn'),
    canvas: document.getElementById('plotCanvas'),
    summary: document.getElementById('summary')
  };

  let profile = null; // {x:[], y:[]} with x in meters from start, y elevations in m AMSL

  function parseCSV(text){
    const lines = text.replace(/\r/g,'\n').split(/\n+/).filter(Boolean);
    if(lines.length===0) return null;
    const header = lines[0].split(',').map(s=>s.trim().toLowerCase());
    let di = header.indexOf('distance_m');
    let ei = header.indexOf('elevation_m');
    let startIdx = 1;
    if(di===-1 || ei===-1){
      // try without header: assume first two cols
      di = 0; ei = 1; startIdx = 0;
    }
    const x=[], y=[];
    for(let i=startIdx;i<lines.length;i++){
      const parts = lines[i].split(',');
      if(parts.length<Math.max(di,ei)+1) continue;
      const d = parseFloat(parts[di]);
      const e = parseFloat(parts[ei]);
      if(!isFinite(d) || !isFinite(e)) continue;
      x.push(d);
      y.push(e);
    }
    if(x.length<2) return null;
    // normalize to start at 0 and ensure ascending
    const minX = Math.min(...x);
    for(let i=0;i<x.length;i++) x[i] = x[i] - minX;
    // If not ascending, sort by x
    let sorted = x.map((v,i)=>({x:v, y:y[i]})).sort((a,b)=>a.x-b.x);
    return { x: sorted.map(p=>p.x), y: sorted.map(p=>p.y) };
  }

  function compute(profile, params){
    const { freqGHz, k, txH, rxH } = params;
    const f = freqGHz * 1e9; // Hz
    const lambda = C / f;
    const D = profile.x[profile.x.length-1] - profile.x[0];
    if(!(D>0)) throw new Error('Total path length must be > 0');
    const R = k * R_EARTH;
    const e0 = profile.y[0];
    const e1 = profile.y[profile.y.length-1];
    const hTx = e0 + txH;
    const hRx = e1 + rxH;

    const x = profile.x.slice();
    const N = x.length;
    const groundEff = new Array(N);
    const los = new Array(N);
    const fresnelR = new Array(N);
    const fresLower = new Array(N);
    const fresUpper = new Array(N);
    const clearance = new Array(N);
    const clearanceVs60 = new Array(N);

    let worstIdx = 0;
    let worstVal = Infinity;

    for(let i=0;i<N;i++){
      const xi = x[i];
      const d1 = xi; const d2 = D - xi;
      const bulge = (d1 * d2) / (2 * R); // Earth curvature bulge relative to chord
      groundEff[i] = profile.y[i] + bulge;
      const losi = hTx + (hRx - hTx) * (xi / D);
      los[i] = losi;
      const r1 = Math.sqrt(lambda * d1 * d2 / D);
      fresnelR[i] = r1;
      const env = 0.6 * r1;
      fresLower[i] = losi - env;
      fresUpper[i] = losi + env;
      clearance[i] = losi - groundEff[i];
      const cVs = clearance[i] - env;
      clearanceVs60[i] = cVs;
      if(cVs < worstVal){ worstVal = cVs; worstIdx = i; }
    }

    const pass = worstVal >= 0;
    const xWorst = x[worstIdx];
    const d1w = xWorst; const d2w = D - xWorst;
    const r1w = Math.sqrt(lambda * d1w * d2w / D);
    const envW = 0.6 * r1w;
    const clearanceWorst = los[worstIdx] - groundEff[worstIdx];
    const deficit = Math.max(0, envW - clearanceWorst); // vertical meters needed at worst point

    // Height suggestions
    let txOnly = Infinity, rxOnly = Infinity, both = 0;
    if(deficit > 0){
      const w = xWorst / D; // contribution factor for RX
      const txWeight = 1 - w;
      const rxWeight = w;
      txOnly = txWeight > 0 ? deficit / txWeight : Infinity;
      rxOnly = rxWeight > 0 ? deficit / rxWeight : Infinity;
      both = deficit; // raising both equally by 'deficit' lifts LOS by 'deficit' uniformly
    }

    return {
      x,
      groundEff,
      los,
      fresLower,
      fresUpper,
      fresnelR,
      clearance,
      clearanceVs60,
      summary: {
        D,
        pass,
        worstIdx,
        xWorst,
        clearanceWorst,
        envWorst: envW,
        deficit,
        txOnly, rxOnly, both,
      }
    };
  }

  function renderPlot(calc){
    const x = calc.x;
    const series = [
      { x, y: calc.groundEff, color: '#8b5a2b', width: 2 },
      { x, y: calc.los, color: '#2563eb', width: 2 },
    ];
    const fills = [
      { lower: {x, y: calc.fresLower}, upper: {x, y: calc.fresUpper}, color: 'rgba(99, 102, 241, 0.25)' }
    ];

    // obstruction points
    const obsX = [], obsY = [];
    for(let i=0;i<x.length;i++){
      if(calc.clearanceVs60[i] < 0){ obsX.push(x[i]); obsY.push(calc.groundEff[i]); }
    }
    if(obsX.length>0){
      series.push({ x: obsX, y: obsY, type: 'scatter', color: '#ef4444', r: 2.5 });
    }

    MiniPlot.plot(els.canvas, {
      axes: { xLabel: 'Distance (m)', yLabel: 'Elevation (m AMSL)' },
      series, fills
    });
  }

  function renderSummary(calc, params){
    const s = calc.summary;
    const km = (s.D/1000).toFixed(3);
    const distWorst = s.xWorst.toFixed(1);
    const clr = s.clearanceWorst.toFixed(2);
    const env = s.envWorst.toFixed(2);
    const margin = (s.clearanceWorst - s.envWorst).toFixed(2);
    const status = s.pass ? '<span class="pass">PASS</span>' : '<span class="fail">FAIL</span>';

    let suggest = '';
    if(!s.pass){
      const txOnly = isFinite(s.txOnly) ? s.txOnly.toFixed(2) : 'N/A';
      const rxOnly = isFinite(s.rxOnly) ? s.rxOnly.toFixed(2) : 'N/A';
      const both = (s.both).toFixed(2);
      suggest = `
        <div><span class="key">Suggested antenna height adjustments to meet 60% first Fresnel at worst point:</span></div>
        <ul>
          <li>Raise TX only: <span class="val">+${txOnly} m</span></li>
          <li>Raise RX only: <span class="val">+${rxOnly} m</span></li>
          <li>Raise both equally: <span class="val">+${both} m each</span></li>
        </ul>`;
    }

    els.summary.innerHTML = `
      <div><span class="key">Path length:</span> <span class="val">${km} km</span></div>
      <div><span class="key">k-factor:</span> <span class="val">${params.k.toFixed(3)}</span></div>
      <div><span class="key">Frequency:</span> <span class="val">${params.freqGHz.toFixed(3)} GHz</span></div>
      <div><span class="key">TX height:</span> <span class="val">${params.txH.toFixed(2)} m</span> &nbsp; <span class="key">RX height:</span> <span class="val">${params.rxH.toFixed(2)} m</span></div>
      <div><span class="key">Worst point @</span> <span class="val">${distWorst} m</span> &nbsp; <span class="key">Clearance above ground:</span> <span class="val">${clr} m</span> &nbsp; <span class="key">0.6·F1 radius:</span> <span class="val">${env} m</span> &nbsp; <span class="key">Margin:</span> <span class="val">${margin} m</span></div>
      <div><span class="key">Clearance check (>= 60% first Fresnel):</span> ${status}</div>
      ${suggest}
    `;
  }

  function computeAndRender(){
    if(!profile){
      els.summary.innerHTML = '<span class="fail">Please upload a CSV file first.</span>';
      return;
    }
    const params = {
      freqGHz: clamp(parseFloat(els.freqGHz.value), 0.001, 1000) || 5.8,
      k: clamp(parseFloat(els.kFactor.value), 0.5, 10) || 1.333,
      txH: clamp(parseFloat(els.txH.value), 0, 1e6) || 0,
      rxH: clamp(parseFloat(els.rxH.value), 0, 1e6) || 0,
    };
    try{
      const calc = compute(profile, params);
      renderSummary(calc, params);
      renderPlot(calc);
    }catch(err){
      els.summary.innerHTML = '<span class="fail">'+(err && err.message || 'Error computing path')+'</span>';
    }
  }

  function clamp(n,min,max){ if(!isFinite(n)) return min; return Math.max(min, Math.min(max, n)); }

  function reset(){
    profile = null;
    els.file.value = '';
    els.summary.innerHTML = '';
    const ctx = els.canvas.getContext('2d');
    ctx.clearRect(0,0,els.canvas.width, els.canvas.height);
  }

  function handleFile(file){
    const reader = new FileReader();
    reader.onload = function(e){
      const text = e.target.result;
      const p = parseCSV(text);
      if(!p){
        els.summary.innerHTML = '<span class="fail">Invalid CSV. Expect columns: distance_m,elevation_m</span>';
        return;
      }
      profile = p;
      computeAndRender();
    };
    reader.onerror = function(){
      els.summary.innerHTML = '<span class="fail">Failed to read file.</span>';
    };
    reader.readAsText(file);
  }

  els.file.addEventListener('change', function(){
    if(els.file.files && els.file.files[0]){
      handleFile(els.file.files[0]);
    }
  });
  els.plotBtn.addEventListener('click', function(){ computeAndRender(); });
  els.resetBtn.addEventListener('click', function(){ reset(); });
})();
