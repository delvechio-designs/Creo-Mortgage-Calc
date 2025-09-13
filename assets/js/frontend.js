/* global CREO_MC, window */
(function(){
  const state = { active:null, tabs: CREO_MC.tabs || {} };

  // helpers
  function money(v){
    try { return (isFinite(v)?v:0).toLocaleString(undefined,{style:'currency',currency:'USD'}); }
    catch(e){ return '$'+Number(v||0).toFixed(2); }
  }
  function sum(arr){ return (arr||[]).reduce((a,s)=>a + (Number(s?.v)||0), 0); }
  function pct(v){ return `${Number(v||0).toFixed(2)}%`; }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
  function byLabel(list, starts){
    if(!Array.isArray(list)) return null;
    const m=list.find(x=>String(x.label||'').toLowerCase().startsWith(starts.toLowerCase()));
    return m?Number(m.v)||0:null;
  }

  // nav
  const nav = document.querySelector('.creo-calcs-nav');
  const panes = [...document.querySelectorAll('.creo-calc')];
  if (panes.length) showPane(panes[0].dataset.pane);

  nav?.addEventListener('click', e=>{
    const b = e.target.closest('.creo-nav-btn'); if(!b) return;
    document.querySelectorAll('.creo-nav-btn').forEach(x=>x.classList.remove('is-active'));
    b.classList.add('is-active');
    showPane(b.dataset.tab);
  });

  function showPane(id){
    state.active = id;
    panes.forEach(p=>p.hidden = p.dataset.pane!==id);
    const pane = document.querySelector(`.creo-calc[data-pane="${id}"]`);
    const form = pane.querySelector('form');
    buildInputs(form, id);
    calculate(form, id);
  }

  // inputs per calculator type
  function buildInputs(form, id){
    const type = form.dataset.type;
    const tab = state.tabs[id] || {};
    const inputs = form.querySelector('.creo-inputs');
    inputs.innerHTML = '';

    const map = {
      purchase: [
        ['home_value','Home Value','number',tab.data?.home_value ?? 200000],
        ['down_payment','Down Payment','number',tab.data?.down_payment ?? 0],
        ['base_amount','Mortgage Amount','number',tab.data?.base_amount ?? 200000],
        ['loan_terms','Loan Terms','number',tab.data?.loan_terms ?? 30],
        ['interest_rate','Interest Rate','number',tab.data?.interest_rate ?? 5],
        ['pmi_yearly','PM (Yearly)','number',tab.data?.pmi_yearly ?? 0],
        ['tax_yearly','Property Tax (Yearly)','number',tab.data?.tax_yearly ?? 1000],
        ['ins_yearly','Home Insurance (Yearly)','number',tab.data?.ins_yearly ?? 1200],
        ['hoa_month','HOA Dues (Monthly)','number',tab.data?.hoa_month ?? 0],
      ],
      affordability: [
        ['gross_income_monthly','Gross Income (Monthly)','number',tab.data?.gross_income_monthly ?? 5000],
        ['monthly_debts','Monthly Debts','number',tab.data?.monthly_debts ?? 1500],
        ['home_price','Home Price','number',tab.data?.home_price ?? 200000],
        ['down_payment','Down Payment','number',tab.data?.down_payment ?? 0],
        ['loan_terms','Loan Terms','number',tab.data?.loan_terms ?? 30],
        ['interest_rate','Interest Rate','number',tab.data?.interest_rate ?? 6.5],
        ['prop_tax_pct','Property Tax % (Yearly)','number',tab.data?.prop_tax_pct ?? 0.8],
        ['ins_yearly','Homeowners Insurance (Yearly)','number',tab.data?.ins_yearly ?? 1200],
        ['pmi_yearly','PMI (Yearly)','number',tab.data?.pmi_yearly ?? 3000],
        ['hoa_month','HOA Dues (Monthly)','number',tab.data?.hoa_month ?? 0],
      ],
      refinance: [
        ['orig_amount','Original Loan Amount','number',tab.data?.orig_amount ?? 300000],
        ['orig_rate','Original Rate','number',tab.data?.orig_rate ?? 5],
        ['orig_term','Original Loan Term','number',tab.data?.orig_term ?? 30],
        ['balance','Current Loan Balance','number',tab.data?.balance ?? 250000],
        ['cash_out','Cash Out Amount','number',tab.data?.cash_out ?? 0],
        ['costs','Refinance Costs','number',tab.data?.costs ?? 1000],
        ['rate','New Rate','number',tab.data?.rate ?? 3],
        ['term','New Loan Term','number',tab.data?.term ?? 15],
      ],
      rentbuy: [
        ['years','Years','number',tab.data?.years ?? 8],
        ['home_price','Home Price','number',tab.data?.home_price ?? 500000],
        ['down','Down Payment','number',tab.data?.down ?? 50000],
        ['rate','Interest Rate','number',tab.data?.rate ?? 7],
        ['term','Loan Term','number',tab.data?.term ?? 30],
        ['monthly_rent','Monthly Rent','number',tab.data?.monthly_rent ?? 2000],
        ['rent_appreciation','Rent Appreciation %','number',tab.data?.rent_appreciation ?? 2],
      ],
      va_purchase: [
        ['home_value','Home Value','number',tab.data?.home_value ?? 200000],
        ['down_payment','Down Payment','number',tab.data?.down_payment ?? 0],
        ['base_amount','Base Mortgage Amount','number',tab.data?.base_amount ?? 200000],
        ['loan_terms','Loan Terms','number',tab.data?.loan_terms ?? 30],
        ['interest_rate','Interest Rate','number',tab.data?.interest_rate ?? 6.5],
        ['tax_yearly','Property Taxes (Yearly)','number',tab.data?.tax_yearly ?? 6000],
        ['hoa_month','HOA Fees (Monthly)','number',tab.data?.hoa_month ?? 0],
        ['ins_yearly','Home Insurance (Yearly)','number',tab.data?.ins_yearly ?? 1200],
      ],
      va_refinance: [
        ['orig_amount','Original Loan Amount','number',tab.data?.orig_amount ?? 300000],
        ['orig_rate','Original Rate','number',tab.data?.orig_rate ?? 5],
        ['orig_term','Original Loan Term','number',tab.data?.orig_term ?? 30],
        ['balance','Current Loan Balance','number',tab.data?.balance ?? 250000],
        ['cash_out','Cash Out Amount','number',tab.data?.cash_out ?? 0],
        ['costs','Refinance Costs','number',tab.data?.costs ?? 1000],
        ['rate','New Rate','number',tab.data?.rate ?? 3],
        ['term','New Loan Term','number',tab.data?.term ?? 15],
      ],
      dscr: [
        ['num_units','Number of Units','number',tab.data?.num_units ?? 1],
        ['prop_value','Property Value or Purchase Price','number',tab.data?.prop_value ?? 500000],
        ['unit_rent','Unit 1 Monthly Rent','number',tab.data?.unit_rent ?? 2000],
        ['taxes','Annual Property Taxes','number',tab.data?.taxes ?? 6000],
        ['ins','Annual Insurance','number',tab.data?.ins ?? 1200],
        ['vacancy','Vacancy Rate %','number',tab.data?.vacancy ?? 5],
        ['repairs','Annual Repairs & Maintenance','number',tab.data?.repairs ?? 500],
        ['utils','Annual Utilities','number',tab.data?.utils ?? 3000],
        ['hoa','Monthly HOA Fee','number',tab.data?.hoa ?? 0],
        ['ltv','Loan to Value %','number',tab.data?.ltv ?? 80],
        ['rate','Interest Rate','number',tab.data?.rate ?? 10],
        ['orig_fee','Origination Fee %','number',tab.data?.orig_fee ?? 2],
        ['closing','Closing Costs','number',tab.data?.closing ?? 6500],
      ],
      fixflip: [
        ['purchase_price','Purchase Price','number',tab.data?.purchase_price ?? 500000],
        ['reno','Renovation Cost','number',tab.data?.reno ?? 75000],
        ['arv','After Repaired Value','number',tab.data?.arv ?? 750000],
        ['length_month','Length of Loan (Months)','number',tab.data?.length_month ?? 8],
        ['taxes','Annual Property Taxes','number',tab.data?.taxes ?? 4000],
        ['ins','Annual Insurance','number',tab.data?.ins ?? 3000],
        ['ltv','Purchase Price LTV %','number',tab.data?.ltv ?? 80],
        ['rate','Interest Rate','number',tab.data?.rate ?? 10],
        ['orig_fee','Origination Fee %','number',tab.data?.orig_fee ?? 2],
        ['other_closing','Other Closing Costs','number',tab.data?.other_closing ?? 15000],
        ['cost_to_sell','Cost To Sell %','number',tab.data?.cost_to_sell ?? 8],
      ],
    }[type] || [];

    map.forEach(([k,label,t,def])=>{
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${label}</label><input type="${t}" step="0.01" name="${k}" value="${def}">`;
      inputs.appendChild(row);
    });

    inputs.oninput = debounce(()=>calculate(form,id), 250);
    form.querySelector('.creo-cta').onclick = ()=>calculate(form,id);
  }

  // collect body and pass VA tables when available
  function gather(form){
    const o = {};
    form.querySelectorAll('input,select').forEach(el=>{
      o[el.name] = el.type==='number' ? parseFloat(el.value||0) : el.value;
    });
    const type = form.dataset.type;
    const t = state.tabs[state.active]?.data || {};

    if (type==='va_purchase') {
      o.fee = {
        first_less5: t.first_less5 || 2.15,
        first_5plus: t.first_5plus || 1.5,
        first_10plus: t.first_10plus || 1.25,
        after_less5: t.after_less5 || 3.3,
        after_5plus: t.after_5plus || 1.5,
        after_10plus: t.after_10plus || 1.25
      };
      o.first_use = t.first_use_flag === '0' ? false : true;
    }
    if (type==='va_refinance') {
      o.fee = {
        first_use: t.first_use_rate || 2.15,
        after_first: t.after_first_rate || 3.3,
        irrrl: t.irrrl || t.irrrl_redux || 0.5
      };
      o.first_use = t.first_use_flag === '0' ? false : true;
      o.is_irrrl = t.is_irrrl === '1' ? true : false;
    }
    return o;
  }

  // REST call
  async function calculate(form, id){
    const type = form.dataset.type;
    const body = gather(form);
    try{
      const res = await fetch(`${CREO_MC.restRoot}/calc/${type}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-WP-Nonce':CREO_MC.nonce},
        body: JSON.stringify(body)
      }).then(r=>r.json());
      render(document.querySelector(`.creo-calc[data-pane="${id}"]`), type, res||{}, form, id);
    }catch(e){ console.error(e); }
  }

  // render UI
  function render(pane, type, d, form, id){
    const donut = pane.querySelector('.creo-donut');
    const legend = pane.querySelector('.creo-legend');
    const kstack = pane.querySelector('.kpi-stack');
    const monthly = pane.querySelector('[data-role="monthly"]');
    const controls = pane.querySelector('[data-role="controls"]');
    const summary = pane.querySelector('.creo-summary');

    donut.innerHTML = ''; legend.innerHTML = '';
    kstack.innerHTML = ''; monthly.innerHTML = ''; controls.innerHTML = '';
    if (summary) summary.textContent = '';

    function fillKpis(list){
      kstack.innerHTML = '';
      list.forEach(k=>{
        const el = document.createElement('div');
        const cls = `kpi${k.neg?' neg':''}${k.dark?' dark':''}${k.cls?` ${k.cls}`:''}`;
        el.className = cls.trim();
        const val = k.raw ?? (typeof k.value==='number' ? money(k.value) : String(k.value||''));
        el.innerHTML = `<div class="small">${k.label||''}</div><div class="big">${val}</div>`;
        kstack.appendChild(el);
      });
    }
    function pieBlock(src){
      if (!src || !Array.isArray(src.monthly)) {
        donut.innerHTML = '<div class="pie"><div class="center">$0.00<small>per month</small></div></div>';
        return;
      }
      const cols = src.colors || ['#f59e0b','#34d399','#10b981','#2563eb','#8b5cf6'];
      const slices = src.monthly.map((s,i)=>({v:Number(s.v)||0,c:cols[i%cols.length],label:s.label}));
      window.CreoPie(donut, slices);
      legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span>${s.label} ${money(s.v)}</span></div>`).join('');
    }
    function slab(el, rows){ el.innerHTML = (rows||[]).map(r=>`<div><strong>${r.label}</strong><span>${typeof r.v==='string'?r.v:money(r.v)}</span></div>`).join(''); }
    const loanVal = byLabel(d?.monthlyBreak,'mortgage amount') ?? byLabel(d?.monthlyBreak,'loan amount');

    // ------- Types -------
    if (type==='affordability'){
      const totalM = sum(d?.donut?.monthly||[]);
      fillKpis([
        {label:'Monthly Mortgage Payment', value: totalM, cls:'kpi-lg kpi-navy'},
        {label:'Loan Amount', value: loanVal ?? 0, cls:'kpi-lg kpi-navy'},
        {label:'Your Debt to Income Ratio', raw: String(d?.afford?.dti_you || '0.00% / 0.00%')},
        {label:'Allowable Debt to Income Ratio', raw: String(d?.afford?.dti_allowed || '50% / 50%')}
      ]);
      pieBlock(d?.donut);
      slab(monthly, d?.monthlyBreak || []);

      // sliders (Purchase Price & Down Payment)
      const homeVal = byLabel(d?.monthlyBreak, 'home value') ?? Number(form.querySelector('[name="home_price"]')?.value || 200000);
      const downVal = Number(form.querySelector('[name="down_payment"]')?.value || 0);

      controls.innerHTML = `
        <div class="creo-card-h"><h3>Purchase Price</h3></div>
        <div class="range">
          <input type="range" min="50000" max="2000000" step="1000" name="_price" value="${homeVal}">
          <div class="range-meta"><span>${money(50000)}</span><span>${money(homeVal)}</span><span>${money(2000000)}</span></div>
        </div>
        <div class="creo-card-h"><h3>Down Payment</h3></div>
        <div class="range">
          <input type="range" min="0" max="${Math.max(0, Math.round(homeVal*0.5))}" step="500" name="_down" value="${downVal}">
          <div class="range-meta"><span>${money(0)}</span><span>${money(downVal)}</span><span>${money(Math.max(0, Math.round(homeVal*0.5)))}</span></div>
        </div>
      `;

      const priceEl = controls.querySelector('input[name="_price"]');
      const downEl  = controls.querySelector('input[name="_down"]');
      priceEl.oninput = debounce((e)=>{
        const v = parseFloat(e.target.value||0);
        form.querySelector('[name="home_price"]').value = v;
        // adjust down slider ceiling when price moves
        downEl.max = Math.max(0, Math.round(v*0.5));
        calculate(form, id);
      }, 80);
      downEl.oninput = debounce((e)=>{
        form.querySelector('[name="down_payment"]').value = parseFloat(e.target.value||0);
        calculate(form, id);
      }, 80);

      if (summary) {
        const dpPct = homeVal>0 ? (downVal/homeVal)*100 : 0;
        summary.innerHTML =
          `Based on what you input today your <strong>Total Payment</strong> would be <strong>${money(totalM)}</strong>` +
          ` on a <strong>Conventional Loan</strong> with a <strong>${dpPct.toFixed(1)}% Down Payment</strong>. ` +
          `Your <strong>Debt-to-Income Ratio</strong> is <strong>${d?.afford?.dti_you || '--'}</strong> ` +
          `and the maximum allowable on this program type is <strong>${d?.afford?.dti_allowed || '50%/50%'}</strong>. ` +
          `Please confirm all numbers for accuracy with your loan officer.`;
      }
      return;
    }

    if (type==='purchase' || type==='va_purchase'){
      fillKpis([
        {label:'Monthly Mortgage Payment', value: sum(d?.donut?.monthly||[]), cls:'kpi-lg kpi-navy'},
        {label:'Total Loan Amount', value: loanVal || 0, cls:'kpi-lg kpi-navy'},
        {label:'Total Interest Paid', value: Number(d?.kpis?.[2]?.value || 0)},
        {label:'', value: 0}
      ]);
      pieBlock(d?.donut);
      slab(monthly, d?.monthlyBreak || []);

      // sliders to mirror screenshot
      const homeVal = byLabel(d?.monthlyBreak, 'home value') ?? Number(form.querySelector('[name="home_value"]')?.value || 200000);
      const downVal = Number(form.querySelector('[name="down_payment"]')?.value || 0);

      controls.innerHTML = `
        <div class="creo-card-h"><h3>Purchase Price</h3></div>
        <div class="range">
          <input type="range" min="50000" max="2000000" step="1000" name="_price" value="${homeVal}">
          <div class="range-meta"><span>${money(50000)}</span><span>${money(homeVal)}</span><span>${money(2000000)}</span></div>
        </div>
        <div class="creo-card-h"><h3>Down Payment</h3></div>
        <div class="range">
          <input type="range" min="0" max="${Math.max(0, Math.round(homeVal*0.5))}" step="500" name="_down" value="${downVal}">
          <div class="range-meta"><span>${money(0)}</span><span>${money(downVal)}</span><span>${money(Math.max(0, Math.round(homeVal*0.5)))}</span></div>
        </div>
      `;
      const priceEl = controls.querySelector('input[name="_price"]');
      const downEl  = controls.querySelector('input[name="_down"]');
      priceEl.oninput = debounce((e)=>{
        const v = parseFloat(e.target.value||0);
        form.querySelector('[name="home_value"]').value = v;
        form.querySelector('[name="base_amount"]').value = Math.max(0, v - Number(form.querySelector('[name="down_payment"]').value||0));
        downEl.max = Math.max(0, Math.round(v*0.5));
        calculate(form, id);
      }, 80);
      downEl.oninput = debounce((e)=>{
        const v = parseFloat(e.target.value||0);
        form.querySelector('[name="down_payment"]').value = v;
        const hv = Number(form.querySelector('[name="home_value"]').value||0);
        form.querySelector('[name="base_amount"]').value = Math.max(0, hv - v);
        calculate(form, id);
      }, 80);
      return;
    }

    if (type==='refinance' || type==='va_refinance'){
      const c = d?.compare || {};
      const diff = Number(c?.diff || 0);
      fillKpis([
        {label: diff>0 ? 'Monthly Payment Increase' : 'Monthly Payment Decrease', value: Math.abs(diff), neg: diff>0, cls:'kpi-lg kpi-navy'},
        {label:'Total Interest Difference', value: Math.abs(Number(c?.interest?.diff||0)), neg: Number(c?.interest?.diff||0)>0, cls:'kpi-lg kpi-navy'},
        {label:'Refinance Costs', value: Number(d?.costs || 0)},
        {label:'Time to Recoup Fees', raw: String(d?.recoup_time || '--')}
      ]);
      donut.innerHTML = `
        <div class="creo-slab" style="width:100%">
          <div><strong>Current Loan</strong><span>${money(c?.current||0)}</span></div>
          <div><strong>New Loan</strong><span>${money(c?.new||0)}</span></div>
          <div><strong>Monthly Payment Difference</strong><span>${money(diff)}</span></div>
          <div><strong>Current Remaining Interest</strong><span>${money(c?.interest?.current||0)}</span></div>
          <div><strong>New Loan Interest</strong><span>${money(c?.interest?.new||0)}</span></div>
          <div><strong>Total Interest Difference</strong><span>${money(c?.interest?.diff||0)}</span></div>
        </div>`;
      legend.innerHTML = '';
      slab(monthly, d?.monthlyBreak || []);
      controls.innerHTML = `
        <div class="creo-card-h"><h3>Refinance Options</h3></div>
        <div class="creo-slab">
          <div><strong>New Rate</strong><span>${pct(d?.rate || 0)}</span></div>
          <div><strong>New Term</strong><span>${Number(d?.term || 0)} years</span></div>
        </div>`;
      return;
    }

    if (type==='dscr'){
      fillKpis([
        {label:'Cash Flow', value:Number(d?.returns?.cash_flow||0), neg:Number(d?.returns?.cash_flow||0)<0, cls:'kpi-lg kpi-navy'},
        {label:'Cap Rate', raw:pct(d?.returns?.cap_rate||0), cls:'kpi-lg kpi-navy'},
        {label:'Cash on Cash Return', raw:pct(d?.returns?.coc||0)},
        {label:'DSCR', raw:String(Number(d?.returns?.dscr||0).toFixed(2))}
      ]);
      pieBlock(d?.donut);
      slab(monthly, d?.monthlyBreak || []);
      controls.innerHTML = `
        <div class="creo-card-h"><h3>Deal Metrics</h3></div>
        <div class="creo-slab">
          <div><strong>Cash Needed to Close</strong><span>${money(d?.metrics?.cash_needed||0)}</span></div>
          <div><strong>Operating Expenses</strong><span>${money(d?.metrics?.operating||0)}</span></div>
        </div>`;
      return;
    }

    if (type==='fixflip'){
      fillKpis([
        {label:'Borrower Equity Needed', value:Number(d?.metrics?.borrower_equity||0), cls:'kpi-lg kpi-navy'},
        {label:'Net Profit', value:Number(d?.metrics?.net_profit||0), cls:'kpi-lg kpi-navy'},
        {label:'Return on Investment', raw:pct(d?.metrics?.roi||0)},
        {label:'Loan to After Repaired Value', raw:pct(d?.metrics?.ltv_to_arv||0)}
      ]);
      pieBlock(d?.donut);
      slab(monthly, d?.dealBreak || d?.monthlyBreak || []);
      controls.innerHTML = `
        <div class="creo-card-h"><h3>Deal Breakdown</h3></div>
        <div class="creo-slab">
          <div><strong>Closing Costs</strong><span>${money(d?.metrics?.closing_costs||0)}</span></div>
          <div><strong>Carrying Costs</strong><span>${money(d?.metrics?.carrying_costs||0)}</span></div>
        </div>`;
      return;
    }

    // fallback
    fillKpis(Array.isArray(d?.kpis)?d.kpis.map(x=>({label:x.label, value:Number(x.value||0)})) : []);
    pieBlock(d?.donut);
    slab(monthly, d?.monthlyBreak || []);
    controls.innerHTML = '';
  }

  // pie via conic gradient
  window.CreoPie = function(container, slices){
    const total = slices.reduce((a,s)=>a + Math.max(0, Number(s.v)||0), 0);
    let acc = 0;
    const stops = slices.map(s=>{
      const v = Math.max(0, Number(s.v)||0);
      const p = total>0 ? (v/total)*100 : 0;
      const seg = `${s.c} ${acc}% ${acc+p}%`;
      acc += p;
      return seg;
    }).join(', ');
    container.innerHTML = `
      <div class="pie" style="background: conic-gradient(${stops});">
        <div class="center">${money(total)}<small>per month</small></div>
      </div>`;
  };
})();
