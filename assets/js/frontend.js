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
        ['tax_yearly','Property Taxes (Yearly)','number',tab.data?.tax_yearly ?? 6000],
        ['ins_yearly','Home Insurance (Yearly)','number',tab.data?.ins_yearly ?? 1200],
        ['hoa_month','HOA Fees (Monthly)','number',tab.data?.hoa_month ?? 0],
        ['pmi_yearly','PMI (Yearly)','number',tab.data?.pmi_yearly ?? 0],
        ['annual_costs','Annual Costs %','number',tab.data?.annual_costs ?? 1],
        ['selling_costs','Selling Costs %','number',tab.data?.selling_costs ?? 6],
        ['annual_app','Annual Appreciation %','number',tab.data?.annual_app ?? 3],
        ['renters_ins_pct','Renters Insurance %','number',tab.data?.renters_ins_pct ?? 1.3],
        ['marginal_tax','Marginal Tax Bracket %','number',tab.data?.marginal_tax ?? 25],
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
    const copy = state.tabs[id]?.data || {};
    const rows = {
      r1: pane.querySelector('[data-role="row1"]'),
      r2: pane.querySelector('[data-role="row2"]'),
      r3: pane.querySelector('[data-role="row3"]'),
      r4: pane.querySelector('[data-role="row4"]'),
      r5: pane.querySelector('[data-role="row5"]'),
      r6: pane.querySelector('[data-role="row6"]'),
    };
    const disclaimer = pane.querySelector('.creo-disclaimer');

    Object.values(rows).forEach(row => {
      if (!row) return;
      row.innerHTML = '';
      row.classList.add('is-empty');
    });

    function setRow(key, nodes){
      const row = rows[key];
      if (!row) return;
      row.innerHTML = '';
      if (!nodes || !nodes.length){
        row.classList.add('is-empty');
        return;
      }
      row.classList.remove('is-empty');
      nodes.forEach(node => row.appendChild(node));
    }

    function createCard(title, opts = {}){
      const card = document.createElement('div');
      card.className = `creo-card${opts.cls ? ' '+opts.cls : ''}`;
      if (title || opts.actions){
        const head = document.createElement('div');
        head.className = 'creo-card-h';
        if (title){
          const h = document.createElement('h3');
          h.textContent = title;
          head.appendChild(h);
        }
        if (opts.actions) head.appendChild(opts.actions);
        card.appendChild(head);
      }
      if (opts.info){
        const p = document.createElement('p');
        p.className = 'creo-card-copy';
        p.textContent = opts.info;
        card.appendChild(p);
      }
      if (opts.body){
        if (typeof opts.body === 'string') card.insertAdjacentHTML('beforeend', opts.body);
        else card.appendChild(opts.body);
      }
      return card;
    }

    function buildSlab(items){
      const slab = document.createElement('div');
      slab.className = 'creo-slab';
      slab.innerHTML = (items || []).map(row => {
        const val = row.raw ?? (typeof row.v === 'string' ? row.v : money(row.v));
        return `<div><strong>${row.label}</strong><span>${val}</span></div>`;
      }).join('');
      return slab;
    }

    function buildKpiStack(list){
      const stack = document.createElement('div');
      stack.className = 'kpi-stack';
      (list || []).forEach(k => {
        const el = document.createElement('div');
        const cls = ['kpi'];
        if (k.neg) cls.push('neg');
        if (k.dark) cls.push('dark');
        if (k.cls) cls.push(k.cls);
        el.className = cls.join(' ').trim();
        const val = k.raw ?? (typeof k.value === 'number' ? money(k.value) : (k.value ?? ''));
        el.innerHTML = `<div class="small">${k.label || ''}</div><div class="big">${val}</div>`;
        stack.appendChild(el);
      });
      return stack;
    }

    function buildDonutCard(title, info, src){
      const card = createCard(title, {info, cls:'chart-card'});
      const donut = document.createElement('div');
      donut.className = 'creo-donut';
      const legend = document.createElement('div');
      legend.className = 'creo-legend';
      card.appendChild(donut);
      card.appendChild(legend);
      if (src && Array.isArray(src.monthly) && src.monthly.length){
        const cols = src.colors || ['#f59e0b','#34d399','#10b981','#2563eb','#8b5cf6'];
        const slices = src.monthly.map((s,i)=>({
          v: Number(s.v)||0,
          c: cols[i%cols.length],
          label: s.label
        }));
        window.CreoPie(donut, slices);
        legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span>${s.label} ${money(s.v)}</span></div>`).join('');
      } else {
        donut.innerHTML = '<div class="pie"><div class="center">$0.00<small>per month</small></div></div>';
        legend.innerHTML = '';
      }
      return card;
    }

    function buildListCard(title, items, info, cls){
      return createCard(title, {info, body: buildSlab(items || []), cls});
    }

    function buildSummaryCard(text, title){
      const body = document.createElement('div');
      body.className = 'creo-summary';
      body.innerHTML = text || 'Results received from this calculator are for comparison only. Accuracy is not guaranteed. Confirm numbers with your loan officer.';
      return createCard(title || 'Summary', {body, cls:'summary-card'});
    }

    function buildRangeControls(homeVal, downVal, opts){
      const card = createCard(opts?.title || 'Adjust Your Numbers', {cls:'controls-card'});
      const priceTitle = document.createElement('div');
      priceTitle.className = 'creo-card-h';
      priceTitle.innerHTML = '<h3>Purchase Price</h3>';
      const priceWrap = document.createElement('div');
      priceWrap.className = 'range';
      priceWrap.innerHTML = `<input type="range" min="50000" max="2000000" step="1000" name="_price" value="${homeVal}"><div class="range-meta"><span>${money(50000)}</span><span>${money(homeVal)}</span><span>${money(2000000)}</span></div>`;
      const downTitle = document.createElement('div');
      downTitle.className = 'creo-card-h';
      downTitle.innerHTML = '<h3>Down Payment</h3>';
      const downWrap = document.createElement('div');
      downWrap.className = 'range';
      const downMax = Math.max(0, Math.round((opts?.downMaxFactor ?? 0.5) * homeVal));
      downWrap.innerHTML = `<input type="range" min="0" max="${downMax}" step="500" name="_down" value="${downVal}"><div class="range-meta"><span>${money(0)}</span><span>${money(downVal)}</span><span>${money(downMax)}</span></div>`;
      card.appendChild(priceTitle);
      card.appendChild(priceWrap);
      card.appendChild(downTitle);
      card.appendChild(downWrap);

      const priceEl = card.querySelector('input[name="_price"]');
      const downEl = card.querySelector('input[name="_down"]');

      priceEl.oninput = debounce(e => {
        const v = parseFloat(e.target.value||0);
        if (opts?.homeField) form.querySelector(`[name="${opts.homeField}"]`).value = v;
        if (opts?.baseField){
          const currentDown = parseFloat(form.querySelector(`[name="${opts.downField}"]`)?.value || 0);
          form.querySelector(`[name="${opts.baseField}"]`).value = Math.max(0, v - currentDown);
        }
        const max = Math.max(0, Math.round((opts?.downMaxFactor ?? 0.5) * v));
        downEl.max = max;
        const spans = downEl.nextElementSibling?.querySelectorAll('span');
        if (spans && spans[2]) spans[2].textContent = money(max);
        calculate(form, id);
      }, 80);

      downEl.oninput = debounce(e => {
        const v = parseFloat(e.target.value||0);
        if (opts?.downField) form.querySelector(`[name="${opts.downField}"]`).value = v;
        if (opts?.baseField){
          const homeValCurrent = parseFloat(form.querySelector(`[name="${opts.homeField}"]`)?.value || 0);
          form.querySelector(`[name="${opts.baseField}"]`).value = Math.max(0, homeValCurrent - v);
        }
        const spans = downEl.nextElementSibling?.querySelectorAll('span');
        if (spans && spans[1]) spans[1].textContent = money(v);
        calculate(form, id);
      }, 80);

      return card;
    }

    function pctText(v){
      return `${Number(v || 0).toFixed(2)}%`;
    }

    const loanVal = byLabel(d?.monthlyBreak,'mortgage amount') ?? byLabel(d?.monthlyBreak,'loan amount');

    if (copy.disclaimer && disclaimer){
      disclaimer.textContent = copy.disclaimer;
    }

    // ------- Types -------
    if (type === 'affordability'){
      const totalM = sum(d?.donut?.monthly || []);
      const homeVal = byLabel(d?.monthlyBreak, 'home value') ?? Number(form.querySelector('[name="home_price"]')?.value || 200000);
      const downVal = Number(form.querySelector('[name="down_payment"]')?.value || 0);

      const kpis = buildKpiStack([
        {label:'Monthly Mortgage Payment', value: totalM, cls:'kpi-lg kpi-navy'},
        {label:'Loan Amount', value: loanVal ?? 0, cls:'kpi-lg kpi-navy'},
        {label:'Your Debt to Income Ratio', raw: String(d?.afford?.dti_you || '0.00% / 0.00%')},
        {label:'Allowable Debt to Income Ratio', raw: String(d?.afford?.dti_allowed || '50% / 50%')}
      ]);

      setRow('r1', [
        buildDonutCard(copy.pay_title || 'Payment Breakdown', copy.pay_info || '', d?.donut),
        kpis
      ]);

      setRow('r2', [
        buildListCard('Loan Details', d?.monthlyBreak || []),
        buildRangeControls(homeVal, downVal, {homeField:'home_price', downField:'down_payment'})
      ]);

      const dpPct = homeVal > 0 ? (downVal/homeVal) * 100 : 0;
      const summaryText =
        `Based on what you input today your <strong>Total Payment</strong> would be <strong>${money(totalM)}</strong>`+
        ` on a <strong>Conventional Loan</strong> with a <strong>${dpPct.toFixed(1)}% Down Payment</strong>. `+
        `Your <strong>Debt-to-Income Ratio</strong> is <strong>${d?.afford?.dti_you || '--'}</strong> `+
        `and the maximum allowable on this program type is <strong>${d?.afford?.dti_allowed || '50%/50%'}</strong>. `+
        `Please confirm all numbers for accuracy with your loan officer.`;

      setRow('r3', [buildSummaryCard(summaryText)]);
      return;
    }

    if (type === 'purchase' || type === 'va_purchase'){
      const totalMonthly = sum(d?.donut?.monthly || []);
      const homeVal = byLabel(d?.monthlyBreak, 'home value') ?? Number(form.querySelector('[name="home_value"]')?.value || 200000);
      const downVal = Number(form.querySelector('[name="down_payment"]')?.value || 0);

      const kpis = buildKpiStack([
        {label:'Monthly Mortgage Payment', value: totalMonthly, cls:'kpi-lg kpi-navy'},
        {label:'Total Loan Amount', value: loanVal || d?.kpis?.[1]?.value || 0, cls:'kpi-lg kpi-navy'},
        {label:'Total Interest Paid', value: d?.kpis?.[2]?.value || 0},
        {label:'Down Payment', value: downVal}
      ]);

      const donutCard = buildDonutCard(copy.pay_title || 'Payment Breakdown', copy.pay_info || '', d?.donut);
      setRow('r1', [donutCard, kpis]);

      setRow('r2', [
        buildListCard('Loan Details', d?.monthlyBreak || []),
        buildRangeControls(homeVal, downVal, {homeField:'home_value', downField:'down_payment', baseField:'base_amount'})
      ]);

      const infoCards = [];
      if (copy.early_title || copy.early_info){
        infoCards.push(createCard(copy.early_title || 'Early Payoff Strategy', {info: copy.early_info || '', cls:'info-card'}));
      }
      if (copy.lump_title || copy.lump_info){
        infoCards.push(createCard(copy.lump_title || 'Lump Sum Payment', {info: copy.lump_info || '', cls:'info-card'}));
      }
      if (type === 'va_purchase' && d?.fee){
        infoCards.push(buildListCard('Funding Fee', [
          {label:'Funding Fee Percentage', raw: pctText((d.fee.pct || 0) * 100)},
          {label:'Financed Amount', v: d.fee.amount || 0},
          {label:'First Use', raw: d.fee.first ? 'Yes' : 'No'},
        ]));
      }
      if (infoCards.length) setRow('r3', infoCards);

      const dpPct = homeVal > 0 ? (downVal/homeVal) * 100 : 0;
      const summaryText = `Your estimated total monthly payment is <strong>${money(totalMonthly)}</strong> with a loan amount of <strong>${money(loanVal || 0)}</strong> and a down payment of <strong>${money(downVal)} (${dpPct.toFixed(1)}%)</strong>. Review property taxes, insurance and HOA dues for accuracy with your loan officer.`;
      setRow('r4', [buildSummaryCard(summaryText)]);
      return;
    }

    if (type === 'refinance' || type === 'va_refinance'){
      const compare = d?.compare || {};
      const diff = Number(compare.diff || 0);
      const kpis = buildKpiStack([
        {label: diff>0 ? 'Monthly Payment Increase' : 'Monthly Payment Decrease', value: Math.abs(diff), neg: diff>0, cls:'kpi-lg kpi-navy'},
        {label:'Total Interest Difference', value: Math.abs(Number(compare.interest?.diff || 0)), neg: Number(compare.interest?.diff || 0) > 0, cls:'kpi-lg kpi-navy'},
        {label:'Refinance Costs', value: Number(d?.costs || 0)},
        {label:'Time to Recoup Fees', raw: d?.recoup_time ? `${d.recoup_time} months` : '--'}
      ]);

      const compTitle = type === 'va_refinance' ? (copy.monthly_comp_title || 'Monthly Payment Comparison') : 'Monthly Payment Comparison';
      const compInfo = type === 'va_refinance' ? (copy.monthly_comp_info || '') : '';
      const compCard = createCard(compTitle, {info: compInfo, cls:'comparison-card', body: buildSlab([
        {label:'Current Monthly Payment', v: compare.current || 0},
        {label:'New Monthly Payment', v: compare.new || 0},
        {label:'Monthly Payment Difference', v: diff},
      ])});

      setRow('r1', [compCard, kpis]);

      const interestTitle = type === 'va_refinance' ? (copy.interest_comp_title || 'Total Interest Comparison') : 'Total Interest Comparison';
      const interestInfo = type === 'va_refinance' ? (copy.interest_comp_info || '') : '';
      const interestCard = createCard(interestTitle, {info: interestInfo, body: buildSlab([
        {label:'Current Remaining Interest', v: compare.interest?.current || 0},
        {label:'New Loan Interest', v: compare.interest?.new || 0},
        {label:'Total Interest Difference', v: compare.interest?.diff || 0},
      ])});

      const optionsCard = createCard('Refinance Options', {body: buildSlab([
        {label:'New Rate', raw: pctText(d?.rate || 0)},
        {label:'New Term', raw: `${Number(d?.term || 0)} years`},
        ...(d?.cash_out ? [{label:'Cash Out Amount', v: d.cash_out}] : [])
      ])});

      setRow('r2', [interestCard, optionsCard]);
      setRow('r3', [buildListCard('Loan Details', d?.monthlyBreak || [])]);

      const summaryText = diff < 0
        ? `Refinancing lowers your payment by <strong>${money(Math.abs(diff))}</strong> each month. You will recover your upfront costs in approximately <strong>${d?.recoup_time || 0} months</strong>.`
        : `Refinancing increases your payment by <strong>${money(Math.abs(diff))}</strong> each month. Evaluate whether saving <strong>${money(Math.abs(Number(compare.interest?.diff || 0)))}</strong> in interest makes sense for your goals.`;
      setRow('r4', [buildSummaryCard(summaryText)]);
      return;
    }

    if (type === 'rentbuy'){
      const kpis = buildKpiStack((d?.kpis || []).map((item, idx) => {
        if (idx === 0) return {label:item.label, raw:String(item.value)};
        return {label:item.label, value:item.value, cls: idx === 3 ? 'kpi-lg kpi-navy' : ''};
      }));
      const donutCard = buildDonutCard('Monthly Ownership Breakdown', '', d?.donut);
      setRow('r1', [donutCard, kpis]);

      const comparison = d?.comparison || {};
      const rentTotal = Number(comparison.rent_total || 0);
      const buyTotal = Number(comparison.buy_total || 0);
      const netAdv = Number(comparison.net_advantage || 0);
      const maxVal = Math.max(rentTotal, buyTotal, Math.abs(netAdv), 1);
      const barCard = createCard('Rent vs Buy Comparison', {cls:'bars-card', body: (() => {
        const wrap = document.createElement('div');
        wrap.className = 'creo-bar-chart';
        wrap.innerHTML = `
          <div class="bar-row"><span>Renting Cost</span><div class="bar"><span style="width:${(rentTotal/maxVal)*100}%"></span></div><strong>${money(rentTotal)}</strong></div>
          <div class="bar-row"><span>Buying Cost</span><div class="bar"><span style="width:${(buyTotal/maxVal)*100}%"></span></div><strong>${money(buyTotal)}</strong></div>
          <div class="bar-row highlight"><span>Net Worth Difference</span><div class="bar"><span style="width:${(Math.abs(netAdv)/maxVal)*100}%"></span></div><strong>${money(netAdv)}</strong></div>`;
        return wrap;
      })()});

      setRow('r2', [barCard, buildListCard('Loan Details', d?.monthlyBreak || [])]);

      const years = Number(d?.kpis?.[0]?.value || 0);
      const summaryText = `After ${years} years, owning could build <strong>${money(comparison.net_home || 0)}</strong> in equity compared to renting. The projected net advantage of buying is <strong>${money(netAdv)}</strong>.`;
      setRow('r3', [buildSummaryCard(summaryText)]);
      return;
    }

    if (type === 'dscr'){
      const returns = d?.returns || {};
      const metrics = d?.metrics || {};
      const deal = d?.dealBreak || [];

      const returnCard = createCard(copy.return_title || 'Return Metrics', {
        info: copy.return_info || '',
        body: buildSlab([
          {label:'Cash Flow', v: returns.cash_flow || 0},
          {label:'Cap Rate', raw: pctText(returns.cap_rate || 0)},
          {label:'Cash on Cash Return', raw: pctText(returns.coc || 0)},
          {label:'DSCR', raw: Number(returns.dscr || 0).toFixed(2)},
        ])
      });

      setRow('r1', [
        buildListCard(copy.deal_title || 'Deal Breakdown', deal, copy.deal_info || ''),
        returnCard
      ]);

      const metricsCard = createCard(copy.metrics_title || 'Deal Metrics', {
        info: copy.metrics_info || '',
        body: buildSlab([
          {label:'Cash Needed to Close', v: metrics.cash_needed || 0},
          {label:'Operating Expenses', v: metrics.operating || 0},
          {label:'Loan to Value', raw: pctText(metrics.ltv || 0)},
          {label:'Origination Fee', v: metrics.origination || 0},
        ])
      });

      setRow('r2', [buildDonutCard('Income vs Expenses', '', d?.donut), metricsCard]);

      const bullets = [];
      if (copy.cash_flow_info) bullets.push(`<li><strong>Cash Flow</strong> ${copy.cash_flow_info}</li>`);
      if (copy.cap_rate_info) bullets.push(`<li><strong>Cap Rate</strong> ${copy.cap_rate_info}</li>`);
      if (copy.coc_info) bullets.push(`<li><strong>Cash on Cash</strong> ${copy.coc_info}</li>`);
      if (copy.dscr_info) bullets.push(`<li><strong>DSCR</strong> ${copy.dscr_info}</li>`);
      if (bullets.length){
        const list = document.createElement('ul');
        list.className = 'creo-bullets';
        list.innerHTML = bullets.join('');
        setRow('r3', [createCard('Understanding Your Metrics', {body: list, cls:'info-card'})]);
      }

      return;
    }

    if (type === 'fixflip'){
      const returns = d?.returns || {};
      const metrics = d?.metrics || {};
      const deal = d?.dealBreak || [];

      const returnsCard = createCard(copy.return_title || 'Return Metrics', {
        info: copy.return_info || '',
        body: buildSlab([
          {label:'Borrower Equity Needed', v: returns.borrower_equity || 0},
          {label:'Net Profit', v: returns.net_profit || 0},
          {label:'Return on Investment', raw: pctText(returns.roi || 0)},
          {label:'Loan to After Repaired Value', raw: pctText(returns.ltv_to_arv || 0)},
        ])
      });

      setRow('r1', [buildDonutCard('Project Cost Allocation', '', d?.donut), returnsCard]);

      const metricsCard = createCard(copy.metrics_title || 'Deal Metrics', {
        info: copy.metrics_info || '',
        body: buildSlab([
          {label:'Closing Costs', v: metrics.closing_costs || 0},
          {label:'Carrying Costs', v: metrics.carrying_costs || 0},
          {label:'Total Cash In Deal', v: metrics.total_cash_in_deal || returns.borrower_equity || 0},
          {label:'Selling Costs', v: metrics.selling_costs || 0},
        ])
      });

      setRow('r2', [buildListCard(copy.deal_title || 'Deal Breakdown', deal, copy.deal_info || ''), metricsCard]);

      const summaryText = `Based on your assumptions, this project requires <strong>${money(returns.borrower_equity || 0)}</strong> in cash and produces an estimated profit of <strong>${money(returns.net_profit || 0)}</strong>. That equals a <strong>${pctText(returns.roi || 0)}</strong> return with an LTV to ARV of <strong>${pctText(returns.ltv_to_arv || 0)}</strong>.`;
      const summaryCard = buildSummaryCard(summaryText);
      const extras = [summaryCard];
      if (copy.analysis_title || copy.analysis_info){
        extras.unshift(createCard(copy.analysis_title || 'Analysis Report', {info: copy.analysis_info || '', cls:'info-card'}));
      }
      setRow('r3', extras);
      return;
    }

    // fallback
    setRow('r1', [buildDonutCard('Payment Breakdown', '', d?.donut), buildKpiStack((d?.kpis || []).map(item => ({label:item.label, value:item.value}))) ]);
    setRow('r2', [buildListCard('Details', d?.monthlyBreak || [])]);
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
