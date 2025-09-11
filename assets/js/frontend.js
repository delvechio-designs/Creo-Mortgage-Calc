/* global CREO_MC, window */
(function(){
  const state = { active:null, tabs: CREO_MC.tabs || {} };

  function money(v){
    try { return (isFinite(v)?v:0).toLocaleString(undefined,{style:'currency',currency:'USD'}); }
    catch(e){ return '$'+Number(v||0).toFixed(2); }
  }
  function sum(arr){ return (arr||[]).reduce((a,s)=>a + (Number(s?.v)||0), 0); }
  function percent(v){ return `${Number(v||0).toFixed(2)} %`; }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

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

  // inputs per type
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

  // VA fee tables passthrough
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

  // REST
  async function calculate(form, id){
    const type = form.dataset.type;
    const body = gather(form);
    try{
      const res = await fetch(`${CREO_MC.restRoot}/calc/${type}`,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-WP-Nonce':CREO_MC.nonce},
        body: JSON.stringify(body)
      }).then(r=>r.json());
      render(document.querySelector(`.creo-calc[data-pane="${id}"]`), type, res||{});
    }catch(e){ console.error(e); }
  }

  // type specific rendering
  function render(pane, type, data){
    const topline = pane.querySelector('.topline');
    const kpis = pane.querySelector('.creo-kpis');
    const donut = pane.querySelector('.creo-donut');
    const legend = pane.querySelector('.creo-legend');
    const m = pane.querySelector('[data-role="monthly"]');
    const t = pane.querySelector('[data-role="total"]');
    const dyn = pane.querySelector('.creo-dynamic');

    // reset shared areas
    topline.innerHTML = '';
    kpis.innerHTML = '';
    donut.innerHTML = '';
    legend.innerHTML = '';
    m.innerHTML = '';
    t.innerHTML = '';
    dyn.innerHTML = '';

    // helpers
    function tiles(list, opts={}){
      list.forEach(item=>{
        const el = document.createElement('div');
        el.className = `kpi${item.neg?' neg':''}${item.dark?' dark':''}`;
        el.innerHTML = `<div class="small">${item.label||''}</div><div class="big">${item.isPct?percent(item.value):money(item.value)}</div>`;
        if (item.raw) el.querySelector('.big').textContent = item.raw;
        kpis.appendChild(el);
      });
      // pad to 4 for grid
      while (kpis.children.length<4){ const pad=document.createElement('div'); pad.className='kpi'; pad.innerHTML='<div class="small">&nbsp;</div><div class="big">&nbsp;</div>'; kpis.appendChild(pad); }
    }
    function donutBlock(d){
      if (!d || !Array.isArray(d.monthly)) return;
      const cols = d.colors || ['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa'];
      const slices = d.monthly.map((s,i)=>({v:Number(s.v)||0,c:cols[i%cols.length],label:s.label}));
      window.CreoDonut(donut, slices);
      legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span>${s.label} ${money(s.v)}</span></div>`).join('');
    }
    function slab(el, rows){ el.innerHTML = rows.map(r=>`<div><strong>${r.label}</strong><span>${typeof r.v==='string'?r.v:money(r.v)}</span></div>`).join(''); }

    // switch per type to match your screenshots
    switch(type){

      case 'affordability': {
        // KPI structure: monthly payment, loan amount, two DTI tiles
        const a = data.afford || {};
        tiles([
          {label:'Monthly Mortgage Payment', value:a.monthly_payment ?? sum(data?.donut?.monthly||[])},
          {label:'Loan Amount', value:a.loan_amount ?? 0},
          {label:'Your Debt to Income Ratio', raw:(a.dti_you ?? '0.00% / 0.00%')},
          {label:'Allowable Debt to Income Ratio', raw:(a.dti_allowed ?? '50% / 50%')}
        ]);

        donutBlock(data.donut);
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);

        // right side cards: purchase price slider, down payment slider, summary text
        dyn.innerHTML = `
          <div class="creo-card"><div class="creo-card-h"><h3>Purchase Price</h3></div>
            <div class="creo-slab"><div><strong>Price</strong><span>${money(a.purchase_price||0)}</span></div></div>
          </div>
          <div class="creo-card"><div class="creo-card-h"><h3>Down Payment</h3></div>
            <div class="creo-slab"><div><strong>Down</strong><span>${money(a.down_payment||0)}</span></div></div>
          </div>`;
        break;
      }

      case 'purchase':
      case 'va_purchase': {
        // top pill row per screenshot
        const pills = `
          <div class="pill-row">
            <div class="pill"><div class="label">Savings</div><div class="value">${money(data.savings ?? 0)}</div></div>
            <div class="pill"><div class="label">Payment Amount</div><div class="value">${money(sum(data?.donut?.monthly||[]))}</div></div>
            <div class="pill"><div class="label">Shorten Loan Term By</div><div class="value">${data.shorten_term_by ?? '0 months'}</div></div>
          </div>`;
        topline.innerHTML = pills;

        // KPI row: three tiles from data.kpis, pad to 4
        const k = Array.isArray(data.kpis)?data.kpis.slice(0,3):[];
        const mapped = k.map(x=>{
          const isPct = typeof x.value==='string' && x.value.trim().endsWith('%');
          return {label:x.label, value:isPct?parseFloat(x.value):Number(x.value||0), isPct:isPct};
        });
        tiles(mapped);

        donutBlock(data.donut);
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);

        // right dynamic cards: early payoff, lump sum
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Early Payoff Strategy</h3></div>
            <div class="creo-slab">
              <div><strong>Additional Monthly</strong><span>${money(data.early_extra||0)}</span></div>
              <div><strong>Increase Frequency</strong><span>${data.early_freq || 'Monthly'}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Lump Sum Payment</h3></div>
            <div class="creo-slab">
              <div><strong>Lump Sum Addition</strong><span>${money(data.lump_sum||0)}</span></div>
              <div><strong>Frequency</strong><span>${data.lump_freq || 'One time'}</span></div>
            </div>
          </div>`;
        break;
      }

      case 'refinance':
      case 'va_refinance': {
        const c = data.compare || {};
        const diff = Number(c.diff||0);
        topline.innerHTML = `<div class="banner${diff>0?' neg':''}">Your monthly payment will ${diff>0?'increase':'decrease'} ${money(Math.abs(diff))} per month.</div>`;

        tiles([
          {label:'Monthly Payment ' + (diff>0?'Increase':'Decrease'), value:Math.abs(diff), neg:diff>0},
          {label:'Total Interest Difference', value:Math.abs(Number(c.interest?.diff||0)), neg:Number(c.interest?.diff||0)>0},
          {label:'Refinance Costs', value:Number(data.costs||0)},
          {label:'Time to Recoup Fees', raw:(data.recoup_time || '--')}
        ]);

        // hide donut and show two comparison cards in dynamic
        donut.innerHTML = ''; legend.innerHTML = '';
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Monthly Payment Comparison</h3></div>
            <div class="creo-slab">
              <div><strong>Current Loan</strong><span>${money(c.current||0)}</span></div>
              <div><strong>New Loan</strong><span>${money(c.new||0)}</span></div>
              <div><strong>Monthly Payment Difference</strong><span>${money(diff)}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Total Interest Comparison</h3></div>
            <div class="creo-slab">
              <div><strong>Current Loan Remaining Interest</strong><span>${money(c.interest?.current||0)}</span></div>
              <div><strong>New Loan Interest</strong><span>${money(c.interest?.new||0)}</span></div>
              <div><strong>Total Interest Difference</strong><span>${money(c.interest?.diff||0)}</span></div>
            </div>
          </div>`;
        // totals slabs still show if provided
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);
        break;
      }

      case 'dscr': {
        tiles([
          {label:'Cash Flow', value:Number(data?.returns?.cash_flow||0), neg:Number(data?.returns?.cash_flow||0)<0},
          {label:'Cap Rate', raw:percent(data?.returns?.cap_rate||0)},
          {label:'Cash on Cash Return', raw:percent(data?.returns?.coc||0)},
          {label:'DSCR', raw:String(Number(data?.returns?.dscr||0).toFixed(2))}
        ]);
        // three cards like screenshot
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Deal Breakdown</h3></div>
            <div class="creo-slab">
              <div><strong>Loan Amount</strong><span>${money(data?.breakdown?.loan_amount||0)}</span></div>
              <div><strong>Down Payment</strong><span>${money(data?.breakdown?.down_payment||0)}</span></div>
              <div><strong>Mortgage Per Year</strong><span>${money(data?.breakdown?.mortgage||0)}</span></div>
              <div><strong>Origination Fee Amount</strong><span>${money(data?.breakdown?.origination||0)}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Deal Metrics</h3></div>
            <div class="creo-slab">
              <div><strong>Total Closing Costs</strong><span>${money(data?.metrics?.closing_costs||0)}</span></div>
              <div><strong>Cash Needed to Close</strong><span>${money(data?.metrics?.cash_needed||0)}</span></div>
              <div><strong>Operating Expenses</strong><span>${money(data?.metrics?.operating||0)}</span></div>
              <div><strong>Net Operating Income</strong><span>${money(data?.metrics?.noi||0)}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Return Metrics</h3></div>
            <div class="creo-slab">
              <div><strong>Cash Flow</strong><span>${money(data?.returns?.cash_flow||0)}</span></div>
              <div><strong>Cap Rate</strong><span>${percent(data?.returns?.cap_rate||0)}</span></div>
              <div><strong>Cash on Cash Return</strong><span>${percent(data?.returns?.coc||0)}</span></div>
              <div><strong>DSCR</strong><span>${Number(data?.returns?.dscr||0).toFixed(2)}</span></div>
            </div>
          </div>`;
        // hide donut row for DSCR
        donut.innerHTML=''; legend.innerHTML='';
        // monthly and totals slabs if provided
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);
        break;
      }

      case 'fixflip': {
        tiles([
          {label:'Borrower Equity Needed', value:Number(data?.metrics?.borrower_equity||0)},
          {label:'Net Profit', value:Number(data?.metrics?.net_profit||0)},
          {label:'Return on Investment', raw:percent(data?.metrics?.roi||0)},
          {label:'Loan to After Repaired Value', raw:percent(data?.metrics?.ltv_to_arv||0)}
        ]);
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Deal Breakdown</h3></div>
            <div class="creo-slab">
              <div><strong>Loan Amount</strong><span>${money(data?.deal?.loan_amount||0)}</span></div>
              <div><strong>Down Payment</strong><span>${money(data?.deal?.down_payment||0)}</span></div>
              <div><strong>Monthly Interest Payment</strong><span>${money(data?.deal?.monthly_interest||0)}</span></div>
              <div><strong>Total Interest Over Term</strong><span>${money(data?.deal?.interest_over_term||0)}</span></div>
              <div><strong>Origination Fee Amount</strong><span>${money(data?.deal?.origination||0)}</span></div>
              <div><strong>Other Closing Costs Amount</strong><span>${money(data?.deal?.other_closing||0)}</span></div>
              <div><strong>Cost To Sell Amount</strong><span>${money(data?.deal?.cost_to_sell||0)}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Deal Metrics</h3></div>
            <div class="creo-slab">
              <div><strong>Closing Costs</strong><span>${money(data?.metrics?.closing_costs||0)}</span></div>
              <div><strong>Carrying Costs</strong><span>${money(data?.metrics?.carrying_costs||0)}</span></div>
              <div><strong>Borrower Equity Needed</strong><span>${money(data?.metrics?.borrower_equity||0)}</span></div>
              <div><strong>Total Cash in Deal</strong><span>${money(data?.metrics?.total_cash_in_deal||0)}</span></div>
            </div>
          </div>
          <div class="creo-card">
            <div class="creo-card-h"><h3>Return Metrics</h3></div>
            <div class="creo-slab">
              <div><strong>Net Profit</strong><span>${money(data?.metrics?.net_profit||0)}</span></div>
              <div><strong>ROI</strong><span>${percent(data?.metrics?.roi||0)}</span></div>
              <div><strong>LTV to ARV</strong><span>${percent(data?.metrics?.ltv_to_arv||0)}</span></div>
            </div>
          </div>`;
        donut.innerHTML=''; legend.innerHTML='';
        break;
      }

      case 'rentbuy': {
        // top slider value tiles like screenshot
        const y = Number(data?.year || 8);
        topline.innerHTML = `
          <div class="big-tiles">
            <div class="kpi"><div class="small">Year</div><div class="big">${y}</div></div>
            <div class="kpi"><div class="small">Buy Gain</div><div class="big">${money(data?.buy_gain||0)}</div></div>
          </div>`;
        tiles([
          {label:'Buy', value:Number(data?.buy_total||0)},
          {label:'Rent', value:Number(data?.rent_total||0)},
        ]);

        // results summary panel on the left and pink cards on the right
        dyn.innerHTML = `
          <div class="creo-card">
            <div class="creo-card-h"><h3>Results Summary</h3></div>
            <div class="creo-slab">
              <div><strong>Buying</strong><span>${money(data?.summary?.buy||0)}</span></div>
              <div><strong>Renting</strong><span>${money(data?.summary?.rent||0)}</span></div>
              <div><strong>Adjusted Net Cash Savings</strong><span>${money(data?.summary?.savings||0)}</span></div>
            </div>
          </div>
          <div class="creo-card"><div class="creo-card-h"><h3>Out of Pocket Cost</h3></div><div class="creo-slab"><div><strong>Cost</strong><span>${money(data?.oop_cost||0)}</span></div></div></div>
          <div class="creo-card"><div class="creo-card-h"><h3>Financial Gain</h3></div><div class="creo-slab"><div><strong>Gain</strong><span>${money(data?.gain||0)}</span></div></div></div>
          <div class="creo-card"><div class="creo-card-h"><h3>Summary</h3></div><div class="creo-slab"><div><strong>Note</strong><span>${data?.note || ''}</span></div></div></div>`;
        donut.innerHTML=''; legend.innerHTML='';
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);
        break;
      }

      default: {
        // generic safe render
        tiles(Array.isArray(data.kpis)?data.kpis.map(x=>({label:x.label,value:Number(x.value||0)})):[]);
        donutBlock(data.donut);
        slab(m, data.monthlyBreak||[]);
        slab(t, data.totalsBreak||[]);
      }
    }
  }

  // donut util
  window.CreoDonut = window.CreoDonut || function(container, slices){
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
        <div class="donut-center">${money(total)}<small>per month</small></div>
      </div>`;
  };
})();
