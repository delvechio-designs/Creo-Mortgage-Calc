/* global window */
(function(){
  function fmtUSD(v){
    try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(v||0); }
    catch(e){ return '$'+(v||0).toFixed(2); }
  }
  window.CreoDonut = function(container, slices){
    const total = slices.reduce((a,s)=>a + Math.max(0, Number(s.v)||0), 0);
    let acc = 0;
    const stops = slices.map(s=>{
      const pct = total>0 ? (Math.max(0, Number(s.v)||0)/total)*100 : 0;
      const str = `${s.c} ${acc}% ${acc+pct}%`;
      acc += pct;
      return str;
    }).join(', ');
    container.innerHTML = `
      <div class="donut" style="background: conic-gradient(${stops});">
        <div class="donut-center">${fmtUSD(total)}<small>per month</small></div>
      </div>
    `;
  };
})();
