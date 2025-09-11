/* global CREO_MC, window */
(function(){
  const state = { active:null, tabs: CREO_MC.tabs };

  function money(v){ 
    try { return (isFinite(v)?v:0).toLocaleString(undefined,{style:'currency',currency:'USD'}); }
    catch(e){ return '$'+Number(v||0).toFixed(2); }
  }

  // nav and panes
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

  // build inputs based on tab schema snapshot we localized
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
        ['loan_amount','Loan Amount','number',tab.data?.loan_amount ?? 200000],
        ['loan_terms','Loan Terms','number',tab.data?.loan_terms ?? 30],
        ['interest_rate','Interest Rate','number',tab.data?.interest_rate ?? 5],
        ['credit_score','Credit Score','number',tab.data?.credit_score ?? 720],
        ['prop_tax_pct','Prop Tax (Yearly)','number',tab.data?.prop_tax_pct ?? 0.8],
        ['ins_yearly','Homeowners Insurance (Yearly)','number',tab.data?.ins_yearly ?? 1200],
        ['pmi_yearly','PM (Yearly)','number',tab.data?.pmi_yearly ?? 3000],
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

  async function calculate(form, id){
    const type = form.dataset.type;
    const body = gather(form);
    try{
      const res = await fetch(`${CREO_MC.restRoot}/calc/${type}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-WP-Nonce':CREO_MC.nonce},
        body: JSON.stringify(body)
      }).then(r=>r.json());
      renderResults(document.querySelector(`.creo-calc[data-pane="${id}"]`), type, res||{});
    }catch(e){
      console.error(e);
    }
  }

  function renderResults(pane, type, data){
    // KPIs
    const kpis = pane.querySelector('.creo-kpis');
    kpis.innerHTML = '';
    (data.kpis||[]).forEach(k=>{
      const el = document.createElement('div'); el.className='kpi';
      const val = typeof k.value === 'number' ? money(k.value) : k.value;
      el.innerHTML = `<div class="small">${k.label}</div><div class="big">${val}</div>`;
      kpis.appendChild(el);
    });

    // Donut and legend
    const donut = pane.querySelector('.creo-donut');
    const legend = pane.querySelector('.creo-legend');
    if (donut && data.donut && Array.isArray(data.donut.monthly)) {
      const cols = data.donut.colors || ['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa'];
      const slices = data.donut.monthly.map((s,i)=>({v:Number(s.v)||0,c:cols[i%cols.length],label:s.label}));
      window.CreoDonut(donut, slices);
      legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span>${s.label} ${money(s.v)}</span></div>`).join('');
    } else {
      donut.innerHTML = ''; legend.innerHTML = '';
    }

    // Detail blocks
    const m = pane.querySelector('[data-role="monthly"]');
    const t = pane.querySelector('[data-role="total"]');
    m.innerHTML = (data.monthlyBreak||[]).map(r=>`<div><strong>${r.label}</strong><span>${money(r.v)}</span></div>`).join('');
    t.innerHTML = (data.totalsBreak||[]).map(r=>`<div><strong>${r.label}</strong><span>${money(r.v)}</span></div>`).join('');

    // Type specific cards
    const dyn = pane.querySelector('.creo-dynamic');
    dyn.innerHTML = '';

    if (type==='refinance' || type==='va_refinance'){
      const c = data.compare || {};
      dyn.innerHTML = `
        <div class="creo-card">
          <div class="creo-card-h"><h3>Monthly Payment Comparison</h3></div>
          <div class="creo-slab">
            <div><strong>Current Loan</strong><span>${money(c.current||0)}</span></div>
            <div><strong>New Loan</strong><span>${money(c.new||0)}</span></div>
            <div><strong>Monthly Payment Difference</strong><span>${money(c.diff||0)}</span></div>
          </div>
        </div>
        <div class="creo-card">
          <div class="creo-card-h"><h3>Total Interest Comparison</h3></div>
          <div class="creo-slab">
            <div><strong>Current Loan Remaining Interest</strong><span>${money(c.interest?.current||0)}</span></div>
            <div><strong>New Loan Interest</strong><span>${money(c.interest?.new||0)}</span></div>
            <div><strong>Total Interest Difference</strong><span>${money(c.interest?.diff||0)}</span></div>
          </div>
        </div>
      `;
    }

    if (type==='dscr'){
      const b = data.breakdown || {};
      const r = data.returns || {};
      dyn.innerHTML = `
        <div class="creo-card">
          <div class="creo-card-h"><h3>Deal Breakdown</h3></div>
          <div class="creo-slab">
            <div><strong>Loan Amount</strong><span>${money(b.loan_amount||0)}</span></div>
            <div><strong>Down Payment</strong><span>${money(b.down_payment||0)}</span></div>
            <div><strong>Mortgage Per Year</strong><span>${money(b.mortgage||0)}</span></div>
            <div><strong>Origination Fee</strong><span>${money(b.origination||0)}</span></div>
          </div>
        </div>
        <div class="creo-card">
          <div class="creo-card-h"><h3>Return Metrics</h3></div>
          <div class="creo-slab">
            <div><strong>Cash Flow</strong><span>${money(r.cash_flow||0)}</span></div>
            <div><strong>Cap Rate</strong><span>${Number(r.cap_rate||0).toFixed(2)}%</span></div>
            <div><strong>Cash on Cash Return</strong><span>${Number(r.coc||0).toFixed(2)}%</span></div>
            <div><strong>DSCR</strong><span>${Number(r.dscr||0).toFixed(2)}</span></div>
          </div>
        </div>
      `;
    }

    if (type==='fixflip'){
      const dd = data.deal || {};
      const met = data.metrics || {};
      dyn.innerHTML = `
        <div class="creo-card"><div class="creo-card-h"><h3>Deal Breakdown</h3></div>
          <div class="creo-slab">
            <div><strong>Loan Amount</strong><span>${money(dd.loan_amount||0)}</span></div>
            <div><strong>Down Payment</strong><span>${money(dd.down_payment||0)}</span></div>
            <div><strong>Monthly Interest Payment</strong><span>${money(dd.monthly_interest||0)}</span></div>
            <div><strong>Total Interest Over Term</strong><span>${money(dd.interest_over_term||0)}</span></div>
            <div><strong>Origination Fee Amount</strong><span>${money(dd.origination||0)}</span></div>
            <div><strong>Other Closing Costs Amount</strong><span>${money(dd.other_closing||0)}</span></div>
            <div><strong>Cost To Sell Amount</strong><span>${money(dd.cost_to_sell||0)}</span></div>
          </div>
        </div>
        <div class="creo-card"><div class="creo-card-h"><h3>Deal Metrics</h3></div>
          <div class="creo-slab">
            <div><strong>Closing Costs</strong><span>${money(met.closing_costs||0)}</span></div>
            <div><strong>Carrying Costs</strong><span>${money(met.carrying_costs||0)}</span></div>
            <div><strong>Borrower Equity Needed</strong><span>${money(met.borrower_equity||0)}</span></div>
            <div><strong>Total Cash in Deal</strong><span>${money(met.total_cash_in_deal||0)}</span></div>
          </div>
        </div>
      `;
    }
  }

  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
})();
