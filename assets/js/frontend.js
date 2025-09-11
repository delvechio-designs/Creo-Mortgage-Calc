(function(){
    const state = {
      active: null,
      tabs: CREO_MC.tabs,
      schemas: CREO_MC.tabs ? null : {}, // not needed here, we render generic inputs
    };
  
    function money(v){ return isFinite(v) ? v.toLocaleString(undefined,{style:'currency',currency:'USD'}) : '$0'; }
    function pct(v){ return `${(v*100).toFixed(2)} %`; }
  
    // mount tabs
    const nav = document.querySelector('.creo-calcs-nav');
    const panes = [...document.querySelectorAll('.creo-calc')];
    const first = panes[0];
    if (first) showPane(first.dataset.pane);
  
    nav.addEventListener('click', e=>{
      const b = e.target.closest('.creo-nav-btn');
      if(!b) return;
      showPane(b.dataset.tab);
    });
  
    function showPane(id){
      state.active = id;
      panes.forEach(p=>p.hidden = p.dataset.pane!==id);
      // build inputs for this pane
      const pane = document.querySelector(`.creo-calc[data-pane="${id}"]`);
      const form = pane.querySelector('form');
      buildInputs(form, id);
      calculate(form, id);
    }
  
    function buildInputs(form, id){
      const type = form.dataset.type;
      const tab = state.tabs[id];
      const inputs = form.querySelector('.creo-inputs');
      inputs.innerHTML = '';
  
      // Simple field set mapping by type for the left panel
      const map = {
        purchase: [
          ['home_value','Home Value','number',tab.data.home_value ?? 200000],
          ['down_payment','Down Payment','number',tab.data.down_payment ?? 0],
          ['base_amount','Mortgage Amount','number',tab.data.base_amount ?? 200000],
          ['loan_terms','Loan Terms','number',tab.data.loan_terms ?? 30],
          ['interest_rate','Interest Rate','number',tab.data.interest_rate ?? 5],
          ['pmi_yearly','PM (Yearly)','number',tab.data.pmi_yearly ?? 0],
          ['tax_yearly','Property Tax (Yearly)','number',tab.data.tax_yearly ?? 1000],
          ['ins_yearly','Home Insurance (Yearly)','number',tab.data.ins_yearly ?? 1200],
          ['hoa_month','HOA Dues (Monthly)','number',tab.data.hoa_month ?? 0],
        ],
        affordability: [
          ['gross_income_monthly','Gross Income (Monthly)','number',tab.data.gross_income_monthly ?? 5500],
          ['monthly_debts','Monthly Debts','number',tab.data.monthly_debts ?? 1500],
          ['interest_rate','Interest Rate','number',tab.data.interest_rate ?? 6.5],
          ['loan_terms','Loan Terms','number',tab.data.loan_terms ?? 30],
          ['front_dti','Front DTI','number',tab.data.front_dti ?? 0.31],
          ['back_dti','Back DTI','number',tab.data.back_dti ?? 0.43],
        ],
        refinance: [
          ['orig_amount','Original Loan Amount','number',tab.data.orig_amount ?? 300000],
          ['orig_rate','Original Rate','number',tab.data.orig_rate ?? 5],
          ['orig_term','Original Loan Term','number',tab.data.orig_term ?? 30],
          ['balance','Current Loan Balance','number',tab.data.balance ?? 250000],
          ['cash_out','Cash Out Amount','number',tab.data.cash_out ?? 0],
          ['costs','Refinance Costs','number',tab.data.costs ?? 1000],
          ['rate','New Rate','number',tab.data.rate ?? 3],
          ['term','New Loan Term','number',tab.data.term ?? 15],
        ],
        rentbuy: [
          ['years','Years','number',8],
          ['home_price','Home Price','number',500000],
          ['down','Down Payment','number',50000],
          ['rate','Interest Rate','number',7],
          ['term','Loan Term','number',30],
          ['monthly_rent','Monthly Rent','number',2000],
          ['rent_appreciation','Rent Appreciation %','number',2],
        ],
        va_purchase: [
          ['home_value','Home Value','number',200000],
          ['down_payment','Down Payment','number',0],
          ['base_amount','Base Mortgage Amount','number',200000],
          ['loan_terms','Loan Terms','number',30],
          ['interest_rate','Interest Rate','number',6.5],
          ['tax_yearly','Property Taxes (Yearly)','number',6000],
          ['hoa_month','HOA Fees (Monthly)','number',0],
          ['ins_yearly','Home Insurance (Yearly)','number',1200],
          // Funding fee fields come from admin and are sent through REST inside "fee"
        ],
        va_refinance: [
          ['orig_amount','Original Loan Amount','number',300000],
          ['orig_rate','Original Rate','number',5],
          ['orig_term','Original Loan Term','number',30],
          ['balance','Current Loan Balance','number',250000],
          ['cash_out','Cash Out Amount','number',0],
          ['costs','Refinance Costs','number',1000],
          ['rate','New Rate','number',3],
          ['term','New Loan Term','number',15],
        ],
        dscr: [
          ['num_units','Number of Units','number',1],
          ['prop_value','Property Value or Purchase Price','number',500000],
          ['unit_rent','Unit 1 Monthly Rent','number',2000],
          ['taxes','Annual Property Taxes','number',6000],
          ['ins','Annual Insurance','number',1200],
          ['vacancy','Vacancy Rate %','number',5],
          ['repairs','Annual Repairs & Maintenance','number',500],
          ['utils','Annual Utilities','number',3000],
          ['hoa','Monthly HOA Fee','number',0],
          ['ltv','Loan to Value %','number',80],
          ['rate','Interest Rate','number',10],
          ['orig_fee','Origination Fee %','number',2],
        ],
        fixflip: [
          ['purchase_price','Purchase Price','number',500000],
          ['reno','Renovation Cost','number',75000],
          ['arv','After Repaired Value','number',750000],
          ['taxes','Annual Property Taxes','number',4000],
          ['ins','Annual Insurance','number',3000],
          ['ltv','Purchase Price LTV %','number',80],
          ['rate','Interest Rate','number',10],
          ['closing','Other Closing Costs','number',15000],
          ['cost_to_sell','Cost to Sell %','number',8],
        ],
      }[type] || [];
  
      map.forEach(([k,label,t,def])=>{
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<label>${label}</label><input type="${t}" step="0.01" name="${k}" value="${def}">`;
        inputs.appendChild(row);
      });
  
      inputs.addEventListener('input', debounce(()=>calculate(form,id), 300));
      form.querySelector('.creo-cta').addEventListener('click', ()=>calculate(form,id));
    }
  
    function gather(form){
      const o = {};
      form.querySelectorAll('input,select').forEach(el=>{
        o[el.name] = el.type==='number' ? parseFloat(el.value||0) : el.value;
      });
      const type = form.dataset.type;
      // inject VA funding fee from stored tab data if present
      if (type==='va_purchase') {
        const t = state.tabs[state.active].data || {};
        o.fee = {
          first_less5: t.first_less5 || 2.15,
          first_5plus: t.first_5plus || 1.5,
          first_10plus: t.first_10plus || 1.25,
          after_less5: t.after_less5 || 3.3,
          after_5plus: t.after_5plus || 1.5,
          after_10plus: t.after_10plus || 1.25,
        };
      }
      return o;
    }
  
    async function calculate(form, id){
      const type = form.dataset.type;
      const body = gather(form);
      const res = await fetch(`${CREO_MC.restRoot}/calc/${type}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-WP-Nonce':CREO_MC.nonce},
        body: JSON.stringify(body)
      }).then(r=>r.json());
  
      renderResults(document.querySelector(`.creo-calc[data-pane="${id}"]`), type, res);
    }
  
    function renderResults(pane, type, data){
      const kpis = pane.querySelector('.creo-kpis');
      kpis.innerHTML = '';
      (data.kpis||[]).forEach(k=>{
        const el = document.createElement('div'); el.className='kpi';
        el.innerHTML = `<div class="small">${k.label}</div><div class="big">${Array.isArray(k.value)?k.value.join(' / '):money(k.value)}</div>`;
        kpis.appendChild(el);
      });
  
      // donut
      const donut = pane.querySelector('.creo-donut');
      const legend = pane.querySelector('.creo-legend');
      if (donut && data.donut){
        const cols = data.donut.colors || ['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa'];
        const slices = (data.donut.monthly||[]).map((s,i)=>({v:s.v,c:cols[i%cols.length],label:s.label}));
        window.CreoDonut(donut, slices);
        legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span>${s.label} ${money(s.v)}</span></div>`).join('');
      }
  
      // monthly and total breakdown
      const m = pane.querySelector('[data-role="monthly"]');
      const t = pane.querySelector('[data-role="total"]');
      if (m && data.monthlyBreak){
        m.innerHTML = data.monthlyBreak.map(r=>`<div><strong>${r.label}:</strong> ${money(r.v)}</div>`).join('');
      }
      if (t && data.totalsBreak){
        t.innerHTML = data.totalsBreak.map(r=>`<div><strong>${r.label}:</strong> ${money(r.v)}</div>`).join('');
      }
  
      // dynamic blocks by type
      const dyn = pane.querySelector('.creo-dynamic');
      dyn.innerHTML = '';
      if (type==='refinance' || type==='va_refinance'){
        const c = data.compare || {};
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Monthly Payment Comparison</h3></div>
            <div>Current Loan: ${money(c.current||0)}</div>
            <div>New Loan: ${money(c.new||0)}</div>
            <div>Monthly Payment Difference: ${money(c.diff||0)}</div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Total Interest Comparison</h3></div>
            <div>Current Loan Remaining Interest: ${money(c.interest?.current||0)}</div>
            <div>New Loan Interest: ${money(c.interest?.new||0)}</div>
            <div>Total Interest Difference: ${money(c.interest?.diff||0)}</div>
          </div>
        `;
      }
      if (type==='dscr'){
        const k = data.kpis || [];
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Deal Breakdown</h3></div>
            <div>Loan Amount: ${money(data.breakdown?.loan_amount||0)}</div>
            <div>Down Payment: ${money(data.breakdown?.down_payment||0)}</div>
            <div>Mortgage Per Year: ${money(data.breakdown?.mortgage||0)}</div>
            <div>Origination Fee Amount: ${money(data.breakdown?.origination||0)}</div>
          </div>
        `;
      }
      if (type==='fixflip'){
        const d = data.deal || {};
        const met = data.metrics || {};
        dyn.innerHTML = `
          <div class="creo-card"><div class="creo-card-h"><h3>Deal Breakdown</h3></div>
            <div>Loan Amount: ${money(d.loan_amount||0)}</div>
            <div>Down Payment: ${money(d.down_payment||0)}</div>
            <div>Monthly Interest Payment: ${money(d.monthly_interest||0)}</div>
            <div>Total Interest Over Term: ${money(d.interest_over_term||0)}</div>
            <div>Origination Fee Amount: ${money(d.origination||0)}</div>
            <div>Other Closing Costs Amount: ${money(d.other_closing||0)}</div>
            <div>Cost To Sell Amount: ${money(d.cost_to_sell||0)}</div>
          </div>
          <div class="creo-card"><div class="creo-card-h"><h3>Deal Metrics</h3></div>
            <div>Closing Costs: ${money(met.closing_costs||0)}</div>
            <div>Carrying Costs: ${money(met.carrying_costs||0)}</div>
            <div>Borrower Equity Needed: ${money(met.borrower_equity||0)}</div>
            <div>Total Cash in Deal: ${money(met.total_cash_in_deal||0)}</div>
          </div>
        `;
      }
    }
  
    function debounce(fn, ms){
      let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); };
    }
  })();
  