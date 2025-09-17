/* global window */
(function(){
  const config = (typeof window !== 'undefined' && window.CREO_MC) ? window.CREO_MC : {};
  const state = { active:null, tabs: config.tabs || {} };
  const ICONS = {
    plus: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    minus: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

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

  function setAffordProgramBadge(form, label){
    if (!form) return;
    const pill = form.querySelector('[data-program-label]');
    if (!pill) return;
    if (label){
      pill.textContent = `${label} Program`;
      pill.classList.add('is-visible');
      pill.hidden = false;
    } else {
      pill.textContent = '';
      pill.classList.remove('is-visible');
      pill.hidden = true;
    }
  }

  function parseAffordPrograms(data){
    const cfg = data || {};
    const enabled = (flag, fallback='1') => {
      const value = flag ?? fallback;
      return !(String(value) === '0');
    };
    const list = [
      {key:'conv', label:'Conventional', enabled: enabled(cfg.enable_conv), front:Number(cfg.dti_allow ?? 50), back:Number(cfg.inc_allow ?? 50), cta:cfg.btn_text, link:cfg.btn_link},
      {key:'fha', label:'FHA', enabled: enabled(cfg.enable_fha), front:Number(cfg.dti_allow_fha ?? 43), back:Number(cfg.inc_allow_fha ?? 56.9), cta:cfg.btn_text_fha, link:cfg.btn_link_fha},
      {key:'va', label:'VA', enabled: enabled(cfg.enable_va), front:Number(cfg.dti_allow_va ?? 65), back:Number(cfg.inc_allow_va ?? 65), cta:cfg.btn_text_va, link:cfg.btn_link_va},
      {key:'usda', label:'USDA', enabled: enabled(cfg.enable_usda), front:Number(cfg.dti_allow_usda ?? 29), back:Number(cfg.inc_allow_usda ?? 41), cta:cfg.btn_text_usda, link:cfg.btn_link_usda},
      {key:'jumbo', label:'Jumbo', enabled: enabled(cfg.enable_jumbo), front:Number(cfg.dti_allow_jumbo ?? 50), back:Number(cfg.inc_allow_jumbo ?? 50), cta:cfg.btn_text_jumbo, link:cfg.btn_link_jumbo},
    ];
    const available = list.filter(item => item.enabled);
    return available.length ? available : list.slice(0,1);
  }

  function inferDecimals(step){
    if (step === undefined || step === null) return 0;
    const str = String(step);
    if (!str.includes('.')) return 0;
    return str.split('.')[1].length;
  }

  function formatValue(value, decimals){
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    if (!Number.isFinite(decimals) || decimals <= 0) return num.toFixed(0);
    return num.toFixed(decimals).replace(/\.0+$/,'').replace(/\.(\d*?)0+$/,'.$1');
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
    if (!inputs) return;
    inputs.className = 'creo-inputs';
    inputs.innerHTML = '';

    if (type === 'affordability'){
      buildAffordabilityInputs(form, id, tab, inputs);
    } else {
      buildStandardInputs(form, tab, inputs, type);
      const hiddenProgram = form.querySelector('input[name="program"]');
      if (hiddenProgram) hiddenProgram.remove();
      delete form.dataset.program;
      delete form.dataset.programLabel;
      setAffordProgramBadge(form, null);
    }

    inputs.oninput = debounce(()=>calculate(form,id), 250);
    const cta = form.querySelector('.creo-cta');
    if (cta){
      cta.onclick = ()=>{
        const link = cta.dataset.link;
        calculate(form,id);
        if (link){
          window.open(link, '_blank');
        }
      };
    }
  }

  function buildStandardInputs(form, tab, inputs, type){
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
  }

  function buildAffordabilityInputs(form, id, tab, container){
    container.classList.add('afford-mode');
    const data = tab.data || {};
    const programs = parseAffordPrograms(data);
    let hidden = form.querySelector('input[name="program"]');
    if (!hidden){
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'program';
      form.appendChild(hidden);
    }

    let currentKey = hidden.value || (programs[0]?.key ?? 'conv');
    if (!programs.some(p => p.key === currentKey)){
      currentKey = programs[0]?.key || currentKey;
    }
    hidden.value = currentKey;
    form.dataset.program = currentKey;
    const currentProgram = programs.find(p => p.key === currentKey) || programs[0] || null;
    if (currentProgram){
      form.dataset.programLabel = currentProgram.label;
    } else {
      delete form.dataset.programLabel;
    }
    setAffordProgramBadge(form, currentProgram?.label);

    const cta = form.querySelector('.creo-cta');
    if (cta && !cta.dataset.defaultText){
      cta.dataset.defaultText = cta.textContent || 'GET A QUOTE';
    }

    function updateCta(program){
      if (!cta) return;
      const defaultText = cta.dataset.defaultText || 'GET A QUOTE';
      const text = program?.cta || defaultText;
      cta.textContent = text;
      if (program?.link){
        cta.dataset.link = program.link;
      } else if (cta.dataset.link){
        delete cta.dataset.link;
      }
    }

    updateCta(currentProgram);

    if (programs.length){
      const nav = document.createElement('div');
      nav.className = 'creo-subnav';
      programs.forEach(prog => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `creo-subbtn${prog.key === currentKey ? ' is-active' : ''}`;
        btn.textContent = prog.label;
        btn.addEventListener('click', () => {
          hidden.value = prog.key;
          form.dataset.program = prog.key;
          form.dataset.programLabel = prog.label;
          nav.querySelectorAll('.creo-subbtn').forEach(x => x.classList.remove('is-active'));
          btn.classList.add('is-active');
          updateCta(prog);
          setAffordProgramBadge(form, prog.label);
          calculate(form, id);
        });
        nav.appendChild(btn);
      });
      container.appendChild(nav);
    }

    const grid = document.createElement('div');
    grid.className = 'afford-grid';
    container.appendChild(grid);

    function getValue(name, fallback){
      const val = data[name];
      if (val === undefined || val === null || val === '') return fallback;
      return val;
    }

    const initialHome = Number(getValue('home_price', 200000));
    const initialDown = Number(getValue('down_payment', 0));
    const initialLoan = Number(getValue('loan_amount', Math.max(0, initialHome - initialDown)));
    const creditChoices = Array.isArray(data.credit_score_options) && data.credit_score_options.length
      ? data.credit_score_options
      : ['580-619','620-639','640-659','660-679','680-699','700-719','720-739','740-759','760-779','780+'];
    const creditDefault = getValue('credit_score', creditChoices[0]);

    let syncDerived = () => {};

    function createField(def){
      const wrap = document.createElement('div');
      wrap.className = 'creo-field';
      wrap.dataset.field = def.name;
      if (def.span === 2) wrap.classList.add('span-2');
      if (def.readonly) wrap.classList.add('is-readonly');

      const label = document.createElement('div');
      label.className = 'field-label';
      const title = document.createElement('span');
      title.textContent = def.label;
      label.appendChild(title);
      if (def.note){
        const note = document.createElement('span');
        note.textContent = def.note;
        label.appendChild(note);
      }
      wrap.appendChild(label);

      const control = document.createElement('div');
      control.className = 'field-control';
      wrap.appendChild(control);

      const shell = document.createElement('div');
      shell.className = 'field-shell';
      control.appendChild(shell);

      const isSelect = def.type === 'select';
      let input = null;
      let prefix = null;
      let suffix = null;
      let stepValue = Number(def.step ?? 1);
      let decimalsUsed = Number.isFinite(def.decimals) ? def.decimals : inferDecimals(def.step || 0);

      if (isSelect){
        shell.classList.add('has-select');
        input = document.createElement('select');
        input.name = def.name;
        (def.options || []).forEach(opt => {
          const option = document.createElement('option');
          if (typeof opt === 'string'){
            option.value = opt;
            option.textContent = opt;
          } else {
            const value = opt.value ?? opt.label ?? '';
            option.value = value;
            option.textContent = opt.label ?? value;
          }
          input.appendChild(option);
        });
        const value = getValue(def.name, def.default);
        if (value !== undefined && value !== null && value !== '') input.value = String(value);
        shell.appendChild(input);
      } else {
        prefix = document.createElement('span');
        prefix.className = 'field-prefix';
        shell.appendChild(prefix);

        input = document.createElement('input');
        input.type = 'number';
        input.name = def.name;
        input.step = def.step !== undefined ? String(def.step) : '1';
        if (def.min !== undefined) input.min = def.min;
        if (def.max !== undefined) input.max = def.max;
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        const baseValue = getValue(def.name, def.default);
        input.value = formatValue(baseValue, decimalsUsed);
        input.dataset.decimals = decimalsUsed;
        if (def.readonly) input.readOnly = true;
        shell.appendChild(input);

        suffix = document.createElement('span');
        suffix.className = 'field-suffix';
        shell.appendChild(suffix);

        const modes = def.modes && typeof def.modes === 'object' ? def.modes : null;
        const toggleButtons = [];
        let currentMode = '';

        function applyDecor(cfg = {}){
          if (!prefix || !suffix) return;
          const pref = cfg.prefix !== undefined ? cfg.prefix : (def.prefix || '');
          const suff = cfg.suffix !== undefined ? cfg.suffix : (def.suffix || '');
          prefix.textContent = pref;
          suffix.textContent = suff;
          prefix.classList.toggle('empty', !pref);
          suffix.classList.toggle('empty', !suff);
        }

        function convertValue(field, value, fromMode, toMode){
          if (!fromMode || !toMode || fromMode === toMode) return value;
          const home = parseFloat(form.querySelector('[name="home_price"]')?.value || 0) || 0;
          switch(field){
            case 'down_payment':
              if (toMode === 'percent'){ return home > 0 ? (value/home) * 100 : 0; }
              if (toMode === 'amount'){ return (value/100) * home; }
              break;
            case 'prop_tax_pct':
              if (toMode === 'percent'){ return home > 0 ? (value/home) * 100 : 0; }
              if (toMode === 'amount'){ return (value/100) * home; }
              break;
            case 'homeowners_ins':
              if (toMode === 'percent'){ return home > 0 ? (value/home) * 100 : 0; }
              if (toMode === 'amount'){ return (value/100) * home; }
              break;
            case 'loan_terms':
              if (toMode === 'months'){ return value * 12; }
              if (toMode === 'years'){ return value / 12; }
              break;
          }
          return value;
        }

        function setMode(modeKey, opts = {}){
          if (!modes) return;
          const cfg = modes[modeKey] || {};
          const prevMode = currentMode;
          currentMode = modeKey;
          stepValue = Number(cfg.step ?? def.step ?? 1);
          input.step = String(stepValue);
          const dec = cfg.decimals;
          const fallbackDec = Number.isFinite(def.decimals) ? def.decimals : inferDecimals(cfg.step ?? def.step ?? 0);
          decimalsUsed = Number.isFinite(dec) ? dec : fallbackDec;
          input.dataset.decimals = decimalsUsed;
          applyDecor(cfg);
          let current = parseFloat(input.value || 0);
          if (!Number.isFinite(current)) current = 0;
          if (opts.convert && prevMode){
            current = convertValue(def.name, current, prevMode, modeKey);
          }
          input.value = formatValue(current, decimalsUsed);
          input.dataset.mode = modeKey;
          wrap.dataset.mode = modeKey;
          toggleButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.mode === modeKey));
          if (opts.trigger){
            input.dispatchEvent(new Event('input',{bubbles:true}));
          }
          syncDerived();
        }

        applyDecor({});

        if (modes){
          shell.classList.add('has-toggle');
          const toggle = document.createElement('div');
          toggle.className = 'field-toggle';
          Object.entries(modes).forEach(([key, cfg]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.mode = key;
            btn.textContent = cfg.label || key;
            btn.addEventListener('click', () => {
              if (currentMode === key) return;
              setMode(key, {convert:true, trigger:true});
            });
            toggle.appendChild(btn);
            toggleButtons.push(btn);
          });
          shell.appendChild(toggle);
          const initialMode = def.defaultMode || Object.keys(modes)[0];
          setMode(initialMode, {convert:false});
        } else {
          applyDecor({});
          input.dataset.mode = '';
        }

        let plusBtn = null;
        let minusBtn = null;
        if (def.stepper !== false && !def.readonly){
          const stepper = document.createElement('div');
          stepper.className = 'field-stepper';
          plusBtn = document.createElement('button');
          plusBtn.type = 'button';
          plusBtn.className = 'field-btn plus';
          plusBtn.innerHTML = ICONS.plus;
          plusBtn.setAttribute('aria-label', `Increase ${def.label}`);
          stepper.appendChild(plusBtn);

          minusBtn = document.createElement('button');
          minusBtn.type = 'button';
          minusBtn.className = 'field-btn minus';
          minusBtn.innerHTML = ICONS.minus;
          minusBtn.setAttribute('aria-label', `Decrease ${def.label}`);
          stepper.appendChild(minusBtn);

          control.appendChild(stepper);
        }

        function adjust(delta){
          const current = parseFloat(input.value || 0);
          const safe = Number.isFinite(current) ? current : 0;
          let next = safe + (stepValue * delta);
          if (def.min !== undefined) next = Math.max(def.min, next);
          if (def.max !== undefined) next = Math.min(def.max, next);
          input.value = formatValue(next, decimalsUsed);
          input.dispatchEvent(new Event('input',{bubbles:true}));
        }

        if (plusBtn) plusBtn.addEventListener('click', () => adjust(1));
        if (minusBtn) minusBtn.addEventListener('click', () => adjust(-1));

        input.addEventListener('focus', () => wrap.classList.add('is-focused'));
        input.addEventListener('blur', () => wrap.classList.remove('is-focused'));
      }

      if (isSelect){
        input.addEventListener('focus', () => wrap.classList.add('is-focused'));
        input.addEventListener('blur', () => wrap.classList.remove('is-focused'));
      }

      return wrap;
    }

    const fields = [
      {name:'gross_income_monthly', label:'Gross Income (Monthly)', prefix:'$', note:'Per Month', step:100, min:0, decimals:0, default:getValue('gross_income_monthly', 7500)},
      {name:'monthly_debts', label:'Monthly Debts', prefix:'$', note:'Per Month', step:50, min:0, decimals:0, default:getValue('monthly_debts', 1500)},
      {name:'home_price', label:'Home Price', prefix:'$', note:'Purchase Price', step:1000, min:0, decimals:0, default:getValue('home_price', 200000)},
      {name:'down_payment', label:'Down Payment', prefix:'$', step:1000, min:0, decimals:0, default:getValue('down_payment', 0), modes:{amount:{label:'$', prefix:'$'}, percent:{label:'%', suffix:'%', decimals:2, step:0.25}}, defaultMode:'amount'},
      {name:'loan_amount', label:'Loan Amount', note:'Calculated', prefix:'$', step:1000, min:0, decimals:0, default:initialLoan, stepper:false, readonly:true},
      {name:'loan_terms', label:'Loan Term', step:1, min:1, decimals:0, default:getValue('loan_terms', 30), modes:{years:{label:'Year', suffix:'Years', decimals:0, step:1}, months:{label:'Month', suffix:'Months', decimals:0, step:1}}, defaultMode:'years'},
      {name:'interest_rate', label:'Interest Rate', suffix:'%', step:0.125, min:0, decimals:3, default:getValue('interest_rate', 6.5)},
      {name:'credit_score', label:'Credit Score', type:'select', options:creditChoices.map(value => ({value, label:value})), default:creditDefault},
      {name:'prop_tax_pct', label:'Property Tax (Yearly)', suffix:'%', step:0.1, min:0, decimals:2, default:getValue('prop_tax_pct', 0.8), modes:{percent:{label:'%', suffix:'%', decimals:2, step:0.1}, amount:{label:'$', prefix:'$', decimals:0, step:100}}, defaultMode:'percent'},
      {name:'homeowners_ins', label:'Homeowners Insurance (Yearly)', prefix:'$', step:100, min:0, decimals:0, default:getValue('homeowners_ins', 1200), modes:{amount:{label:'$', prefix:'$', decimals:0, step:100}, percent:{label:'%', suffix:'%', decimals:2, step:0.1}}, defaultMode:'amount'},
      {name:'pmi_yearly', label:'PMI (Yearly)', prefix:'$', step:100, min:0, decimals:0, default:getValue('pmi_yearly', 3000)},
      {name:'hoa_month', label:'HOA Dues (Monthly)', prefix:'$', step:50, min:0, decimals:0, default:getValue('hoa_month', 0)},
    ];

    fields.forEach(def => {
      grid.appendChild(createField(def));
    });

    const homeInput = form.querySelector('[name="home_price"]');
    const downInput = form.querySelector('[name="down_payment"]');
    const loanInput = form.querySelector('[name="loan_amount"]');

    function parseNumber(el){
      if (!el) return 0;
      const num = parseFloat(el.value || 0);
      return Number.isFinite(num) ? num : 0;
    }

    function currentMode(el){
      if (!el) return '';
      return el.dataset.mode || el.closest('.creo-field')?.dataset.mode || '';
    }

    function downAmount(){
      if (!downInput) return 0;
      const mode = currentMode(downInput);
      const val = parseNumber(downInput);
      const home = parseNumber(homeInput);
      return mode === 'percent' ? home * (val / 100) : val;
    }

    syncDerived = () => {
      if (!loanInput) return;
      const loan = Math.max(0, parseNumber(homeInput) - downAmount());
      const decimals = Number(loanInput.dataset.decimals || 0);
      loanInput.value = formatValue(loan, decimals);
    };

    syncDerived();

    homeInput?.addEventListener('input', () => syncDerived());
    downInput?.addEventListener('input', () => syncDerived());
  }

  // collect body and pass VA tables when available
  function gather(form){
    const o = {};
    form.querySelectorAll('input,select').forEach(el=>{
      o[el.name] = el.type==='number' ? parseFloat(el.value||0) : el.value;
    });
    const type = form.dataset.type;
    const t = state.tabs[state.active]?.data || {};

    if (type === 'affordability') {
      const homeField = form.querySelector('[name="home_price"]');
      const downField = form.querySelector('[name="down_payment"]');
      const loanField = form.querySelector('[name="loan_amount"]');
      const taxField = form.querySelector('[name="prop_tax_pct"]');
      const insField = form.querySelector('[name="homeowners_ins"]');
      const termField = form.querySelector('[name="loan_terms"]');

      const homeVal = parseFloat(homeField?.value || 0) || 0;

      const downMode = downField?.dataset.mode || downField?.closest('.creo-field')?.dataset.mode || 'amount';
      const downRaw = parseFloat(downField?.value || 0) || 0;
      const downAmount = downMode === 'percent' ? homeVal * (downRaw / 100) : downRaw;
      o.down_payment = downAmount;

      const loanVal = parseFloat(loanField?.value || 0);
      o.loan_amount = Number.isFinite(loanVal) ? loanVal : Math.max(0, homeVal - downAmount);

      const taxMode = taxField?.dataset.mode || taxField?.closest('.creo-field')?.dataset.mode || 'percent';
      const taxRaw = parseFloat(taxField?.value || 0) || 0;
      o.prop_tax_pct = taxMode === 'amount' ? (homeVal > 0 ? (taxRaw / homeVal) * 100 : 0) : taxRaw;

      const insMode = insField?.dataset.mode || insField?.closest('.creo-field')?.dataset.mode || 'amount';
      const insRaw = parseFloat(insField?.value || 0) || 0;
      o.homeowners_ins = insMode === 'percent' ? (homeVal * (insRaw / 100)) : insRaw;

      const termMode = termField?.dataset.mode || termField?.closest('.creo-field')?.dataset.mode || 'years';
      const termRaw = parseFloat(termField?.value || 0) || 0;
      o.loan_terms = termMode === 'months' ? (termRaw / 12) : termRaw;
    }

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
    const pane = document.querySelector(`.creo-calc[data-pane="${id}"]`);
    const root = typeof config.restRoot === 'string' ? config.restRoot.replace(/\/$/, '') : '';
    if (!root){
      console.warn('[Creo MC] REST endpoint missing; unable to calculate.');
      if (pane) render(pane, type, {}, form, id);
      return;
    }
    const headers = {'Content-Type':'application/json'};
    if (config.nonce) headers['X-WP-Nonce'] = config.nonce;
    try{
      const response = await fetch(`${root}/calc/${type}`,{ method:'POST', headers, body: JSON.stringify(body) });
      if (!response.ok){
        throw new Error(`Request failed: ${response.status}`);
      }
      const res = await response.json();
      if (pane) render(pane, type, res||{}, form, id);
    }catch(e){
      console.error(e);
      if (pane) render(pane, type, {}, form, id);
    }
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
      const layout = document.createElement('div');
      layout.className = 'chart-layout';
      const donut = document.createElement('div');
      donut.className = 'creo-donut';
      const legend = document.createElement('div');
      legend.className = 'creo-legend';
      layout.appendChild(donut);
      layout.appendChild(legend);
      card.appendChild(layout);
      if (src && Array.isArray(src.monthly) && src.monthly.length){
        const cols = src.colors || ['#f59e0b','#34d399','#10b981','#2563eb','#8b5cf6'];
        const slices = src.monthly.map((s,i)=>({
          v: Number(s.v)||0,
          c: cols[i%cols.length],
          label: s.label
        }));
        window.CreoPie(donut, slices);
        legend.innerHTML = slices.map(s=>`<div class="item"><span class="swatch" style="background:${s.c}"></span><span class="label">${s.label}</span><span class="value">${money(s.v)}</span></div>`).join('');
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
      body.innerHTML = text || '';
      const cardTitle = title === undefined ? 'Summary' : title;
      return createCard(cardTitle, {body, cls:'summary-card'});
    }

    function buildRangeControls(homeVal, downVal, opts){
      const card = createCard(opts?.title || 'Adjust Your Numbers', {cls:'controls-card'});
      const homeMin = 50000;
      const homeMax = 2000000;
      const downFactor = opts?.downMaxFactor ?? 0.5;
      let currentHome = Math.min(Math.max(homeVal || homeMin, homeMin), homeMax);
      const downLimit = value => Math.max(0, Math.round(downFactor * value));
      let currentDown = Math.min(Math.max(downVal || 0, 0), downLimit(currentHome));

      const priceField = document.createElement('div');
      priceField.className = 'range-field';
      const priceHead = document.createElement('div');
      priceHead.className = 'range-h';
      priceHead.innerHTML = '<span>Purchase Price</span>';
      const priceValue = document.createElement('span');
      priceValue.className = 'range-value';
      priceValue.textContent = money(currentHome);
      priceHead.appendChild(priceValue);
      const priceWrap = document.createElement('div');
      priceWrap.className = 'range';
      const priceInput = document.createElement('input');
      priceInput.type = 'range';
      priceInput.min = String(homeMin);
      priceInput.max = String(homeMax);
      priceInput.step = '1000';
      priceInput.name = '_price';
      priceInput.value = currentHome;
      priceWrap.appendChild(priceInput);
      const priceMeta = document.createElement('div');
      priceMeta.className = 'range-meta';
      priceMeta.innerHTML = `<span>${money(homeMin)}</span><span>${money(homeMax)}</span>`;
      priceField.append(priceHead, priceWrap, priceMeta);

      const downField = document.createElement('div');
      downField.className = 'range-field';
      const downHead = document.createElement('div');
      downHead.className = 'range-h';
      downHead.innerHTML = '<span>Down Payment</span>';
      const downValueEl = document.createElement('span');
      downValueEl.className = 'range-value';
      downValueEl.textContent = money(currentDown);
      downHead.appendChild(downValueEl);
      const downWrap = document.createElement('div');
      downWrap.className = 'range';
      const downInput = document.createElement('input');
      downInput.type = 'range';
      downInput.min = '0';
      downInput.step = '500';
      downInput.name = '_down';
      downInput.max = String(downLimit(currentHome));
      downInput.value = currentDown;
      downWrap.appendChild(downInput);
      const downMeta = document.createElement('div');
      downMeta.className = 'range-meta';
      downMeta.innerHTML = `<span>${money(0)}</span><span>${money(Number(downInput.max))}</span>`;
      const downMetaSpans = downMeta.querySelectorAll('span');
      downField.append(downHead, downWrap, downMeta);

      card.appendChild(priceField);
      card.appendChild(downField);

      const homeFieldEl = opts?.homeField ? form.querySelector(`[name="${opts.homeField}"]`) : null;
      const downFieldEl = opts?.downField ? form.querySelector(`[name="${opts.downField}"]`) : null;
      const loanFieldEl = form.querySelector('[name="loan_amount"]');

      function updateHomeField(value){
        if (!homeFieldEl) return;
        const decimals = Number(homeFieldEl.dataset.decimals || 0);
        homeFieldEl.value = formatValue(value, decimals);
      }

      function updateDownField(amount, homeValue){
        if (!downFieldEl) return;
        const mode = downFieldEl.dataset.mode || downFieldEl.closest('.creo-field')?.dataset.mode || 'amount';
        if (mode === 'percent'){
          const decimals = Number(downFieldEl.dataset.decimals || 2);
          const pct = homeValue > 0 ? (amount / homeValue) * 100 : 0;
          downFieldEl.value = formatValue(pct, decimals);
        } else {
          const decimals = Number(downFieldEl.dataset.decimals || 0);
          downFieldEl.value = formatValue(amount, decimals);
        }
      }

      function updateLoanField(homeValue, downAmount){
        if (!loanFieldEl) return;
        const decimals = Number(loanFieldEl.dataset.decimals || 0);
        loanFieldEl.value = formatValue(Math.max(0, homeValue - downAmount), decimals);
      }

      function readDownAmount(homeValue){
        if (!downFieldEl) return currentDown;
        const mode = downFieldEl.dataset.mode || downFieldEl.closest('.creo-field')?.dataset.mode || 'amount';
        const raw = parseFloat(downFieldEl.value || 0) || 0;
        return mode === 'percent' ? homeValue * (raw / 100) : raw;
      }

      updateHomeField(currentHome);
      updateDownField(currentDown, currentHome);
      updateLoanField(currentHome, currentDown);

      priceInput.oninput = debounce(e => {
        const value = Math.min(Math.max(parseFloat(e.target.value || 0) || homeMin, homeMin), homeMax);
        currentHome = value;
        priceValue.textContent = money(value);
        updateHomeField(value);
        const newMax = downLimit(value);
        downInput.max = String(newMax);
        if (downMetaSpans && downMetaSpans[1]) downMetaSpans[1].textContent = money(newMax);
        let amount = readDownAmount(value);
        if (amount > newMax){
          amount = newMax;
          updateDownField(amount, value);
        }
        currentDown = amount;
        downInput.value = amount;
        downValueEl.textContent = money(amount);
        updateLoanField(value, amount);
        calculate(form, id);
      }, 80);

      downInput.oninput = debounce(e => {
        const max = Number(downInput.max || 0);
        const value = Math.min(Math.max(parseFloat(e.target.value || 0) || 0, 0), max);
        currentDown = value;
        const homeValue = currentHome;
        downValueEl.textContent = money(value);
        updateDownField(value, homeValue);
        updateLoanField(homeValue, value);
        calculate(form, id);
      }, 80);

      return card;
    }

    function pctText(v){
      return `${Number(v || 0).toFixed(2)}%`;
    }

    const toNumberOrNull = (val) => {
      if (val === undefined || val === null || val === '') return null;
      const parsed = typeof val === 'string' ? parseFloat(String(val).replace(/,/g,'')) : Number(val);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const toNumber = (val, fallback = 0) => {
      const parsed = toNumberOrNull(val);
      return parsed === null ? fallback : parsed;
    };

    const loanVal = toNumber(byLabel(d?.monthlyBreak,'mortgage amount') ?? byLabel(d?.monthlyBreak,'loan amount'), 0);

    if (copy.disclaimer && disclaimer){
      disclaimer.textContent = copy.disclaimer;
    }

    // ------- Types -------
    if (type === 'affordability'){
      const totalM = sum(d?.donut?.monthly || []);
      const formHomeValue = toNumber(form.querySelector('[name="home_price"]')?.value, 200000);
      const homeVal = toNumber(d?.afford?.purchase_price ?? byLabel(d?.monthlyBreak, 'home value'), formHomeValue);
      const downFieldEl = form.querySelector('[name="down_payment"]');
      const downMode = downFieldEl?.dataset.mode || downFieldEl?.closest('.creo-field')?.dataset.mode || 'amount';
      const downInputVal = toNumber(downFieldEl?.value, 0);
      let downAmount = toNumberOrNull(d?.afford?.down_payment);
      if (downAmount === null){
        downAmount = downMode === 'percent' ? homeVal * (downInputVal / 100) : downInputVal;
      }
      const programKey = d?.afford?.program || form.querySelector('input[name="program"]')?.value || 'conv';
      const programList = parseAffordPrograms(copy);
      const activeProgram = programList.find(p => p.key === programKey) || programList[0] || null;
      const programLabel = activeProgram?.label || 'Conventional';
      if (activeProgram){
        form.dataset.programLabel = activeProgram.label;
      }
      setAffordProgramBadge(form, programLabel);

      const resultsCard = createCard('', {cls:'afford-results-card'});
      resultsCard.innerHTML = '';
      if (programLabel){
        const pill = document.createElement('div');
        pill.className = 'afford-pill';
        pill.textContent = `${programLabel} Program`;
        resultsCard.appendChild(pill);
      }

      const kpiWrap = document.createElement('div');
      kpiWrap.className = 'afford-kpi-wrap';

      const kpiMain = document.createElement('div');
      kpiMain.className = 'afford-kpi-main';
      kpiMain.innerHTML = `
        <div class="afford-kpi">
          <span class="label">Monthly Mortgage Payment</span>
          <span class="value">${money(totalM)}</span>
          <span class="sub">Per Month</span>
        </div>
        <div class="afford-kpi">
          <span class="label">Loan Amount</span>
          <span class="value">${money(loanVal)}</span>
          <span class="sub">At Closing</span>
        </div>`;
      kpiWrap.appendChild(kpiMain);

      const kpiSupp = document.createElement('div');
      kpiSupp.className = 'afford-kpi-supp';
      kpiSupp.innerHTML = `
        <div class="afford-tile">
          <span class="small">Your Debt to Income Ratio</span>
          <strong>${d?.afford?.dti_you || '--'}</strong>
        </div>
        <div class="afford-tile">
          <span class="small">Allowable Debt to Income Ratio</span>
          <strong>${d?.afford?.dti_allowed || '--'}</strong>
        </div>`;
      kpiWrap.appendChild(kpiSupp);
      resultsCard.appendChild(kpiWrap);

      setRow('r1', [
        buildDonutCard(copy.pay_title || 'Payment Breakdown', copy.pay_info || '', d?.donut),
        resultsCard
      ]);

      setRow('r2', [
        buildListCard('Loan Details', d?.monthlyBreak || []),
        buildRangeControls(homeVal, downAmount, {homeField:'home_price', downField:'down_payment'})
      ]);

      const dpPct = homeVal > 0 ? (downAmount/homeVal) * 100 : 0;
      const summaryText = `Summary: Based on what you input into today your Total Payment would be <strong>${money(totalM)}</strong> on a <strong>${programLabel} Loan</strong> with a <strong>${dpPct.toFixed(2)}% Down Payment</strong>. Your Debt-to-Income Ratio is <strong>${d?.afford?.dti_you || '--'}</strong> and the maximum allowable on this program type is <strong>${d?.afford?.dti_allowed || '50%/50%'}</strong>. Please confirm all these numbers for accuracy with your loan officer. The Monthly Debts Calculation is often where we see errors.`;

      setRow('r3', [buildSummaryCard(summaryText, '')]);
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
