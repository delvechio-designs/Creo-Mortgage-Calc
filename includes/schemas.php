<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Returns the full schema registry for all calculator types.
 * Each schema has:
 * - title
 * - groups: array of field groups
 *   - title
 *   - fields: associative array of field defs
 * Field defs:
 * - type: number | text | toggle | color
 * - label: string
 * - default: mixed
 * - step: for number inputs
 * - help: optional helper text
 */
function creo_mc_schema_registry() {
  // helpers
  $toggle = fn($label,$def='1') => ['type'=>'toggle','label'=>$label,'default'=>$def];
  $num    = fn($label,$def='',$step='0.01',$help='') => ['type'=>'number','label'=>$label,'default'=>$def,'step'=>$step,'help'=>$help];
  $text   = fn($label,$def='') => ['type'=>'text','label'=>$label,'default'=>$def];
  $color  = fn($label,$def='#000000') => ['type'=>'color','label'=>$label,'default'=>$def];

  /** -----------------------------------------------------------
   *  AFFORDABILITY
   *  --------------------------------------------------------- */
  $affordability = [
    'title'  => 'Affordability Calculator',
    'groups' => [
      'general' => [
        'title'  => 'General Setting',
        'fields' => [
          'enable'             => $toggle('Enable Affordability Calculator','1'),
          'intro_video'        => $text('Intro Video','Enter Intro Video'),
          'gross_income_monthly'=> $num('Gross Income (Monthly)',5500,'1'),
          'monthly_debts'      => $num('Monthly Debts',1500,'1'),
          'home_price'         => $num('Home Price',200000,'1'),
          'down_payment'       => $num('Down Payment',0,'1'),
          'loan_terms'         => $num('Loan Terms',30,'1'),
          'credit_score'       => $num('Credit Score',720,'1'),
          'prop_tax_pct'       => $num('Property Tax Percentage (Yearly)',0.8,'0.01'),
          'homeowners_ins'     => $num('Homeowners Insurance (Yearly)',1200,'1'),
          'pmi_yearly'         => $num('PMI (Yearly)',3000,'1'),
          'hoa_month'          => $num('HOA Dues (Monthly)',0,'1'),
        ],
      ],
      'style' => [
        'title'  => 'Style Setting',
        'fields' => [
          'c_pni'  => $color('Principle & Interest Color','#f59e0b'),
          'c_tax'  => $color('Taxes Color','#22c55e'),
          'c_ins'  => $color('Insurance Color','#fbbf24'),
          'c_hoa'  => $color('HOA Dues Color','#60a5fa'),
          'c_pmi'  => $color('PMI Color','#a78bfa'),
        ],
      ],
      'conv' => [
        'title'  => 'Conventional Calculator Setting',
        'fields' => [
          'enable_conv'  => $toggle('Enable Conventional Calculator','1'),
          'dti_allow'    => $num('Allowable DTI (%)',50,'0.01'),
          'inc_allow'    => $num('Allowable Income (%)',50,'0.01'),
          'btn_text'     => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'     => $text('Quote Button Link','/quote/'),
        ],
      ],
      'fha' => [
        'title'  => 'FHA Calculator Setting',
        'fields' => [
          'enable_fha'  => $toggle('Enable FHA Calculator','1'),
          'dti_allow_fha'  => $num('Allowable DTI (%)',43,'0.01'),
          'inc_allow_fha'  => $num('Allowable Income (%)',56.9,'0.01'),
          'btn_text_fha'   => $text('Quote Button Text','GET A QUOTE'),
          'btn_link_fha'   => $text('Quote Button Link','/quote/'),
        ],
      ],
      'va' => [
        'title'  => 'VA Calculator Setting',
        'fields' => [
          'enable_va'     => $toggle('Enable VA Calculator','1'),
          'first_less5'   => $num('VA Funding Fee First Use less than 5%',2.15,'0.01'),
          'first_5plus'   => $num('VA Funding Fee First Use 5% or more',1.5,'0.01'),
          'first_10plus'  => $num('VA Funding Fee First Use 10% or more',1.25,'0.01'),
          'after_less5'   => $num('VA Funding Fee After Use less than 5%',3.3,'0.01'),
          'after_5plus'   => $num('VA Funding Fee After Use 5% or more',1.5,'0.01'),
          'after_10plus'  => $num('VA Funding Fee After Use 10% or more',1.25,'0.01'),
          'dti_allow_va'  => $num('Allowable DTI (%)',65,'0.01'),
          'inc_allow_va'  => $num('Allowable Income (%)',65,'0.01'),
          'btn_text_va'   => $text('Quote Button Text','GET A QUOTE'),
          'btn_link_va'   => $text('Quote Button Link','/quote/'),
        ],
      ],
      'usda' => [
        'title'  => 'USDA Calculator Setting',
        'fields' => [
          'enable_usda'  => $toggle('Enable USDA Calculator','1'),
          'dti_allow_usda' => $num('Allowable DTI (%)',29,'0.01'),
          'inc_allow_usda' => $num('Allowable Income (%)',41,'0.01'),
          'btn_text_usda'  => $text('Quote Button Text','GET A QUOTE'),
          'btn_link_usda'  => $text('Quote Button Link','/quote/'),
        ],
      ],
      'jumbo' => [
        'title'  => 'Jumbo Calculator Setting',
        'fields' => [
          'enable_jumbo'  => $toggle('Enable Jumbo Calculator','1'),
          'dti_allow_jumbo'=> $num('Allowable DTI (%)',50,'0.01'),
          'inc_allow_jumbo'=> $num('Allowable Income (%)',50,'0.01'),
          'btn_text_jumbo' => $text('Quote Button Text','GET A QUOTE'),
          'btn_link_jumbo' => $text('Quote Button Link','/quote/'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  PURCHASE
   *  --------------------------------------------------------- */
  $purchase = [
    'title'  => 'Purchase',
    'groups' => [
      'gen' => [
        'title'  => 'Mortgage General Setting',
        'fields' => [
          'enable'        => $toggle('Enable Purchase Calculator','1'),
          'calc_title'    => $text('Calculator Title','Calculator'),
          'home_value'    => $num('Home Value',200000,'1'),
          'down_payment'  => $num('Down Payment',0,'1'),
          'base_amount'   => $num('Mortgage Amount',200000,'1'),
          'loan_terms'    => $num('Loan Terms',30,'1'),
          'interest_rate' => $num('Interest Rate',5,'0.01'),
          'pmi_yearly'    => $num('PM (Yearly)',0,'0.01'),
          'tax_yearly'    => $num('Property Tax (Yearly)',1000,'1'),
          'ins_yearly'    => $num('Home Insurance (Yearly)',1200,'1'),
          'hoa_month'     => $num('HOA Fees (Monthly)',0,'1'),
          'btn_text'      => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'      => $text('Quote Button Link','/quote/'),
          'pay_title'     => $text('Payment Breakdown Title','Payment Breakdown'),
          'pay_info'      => $text('Payment Breakdown Info','A breakdown of your total payment so you can see where money is allocated.'),
          'early_title'   => $text('Early Payoff Strategy Title','Early Payoff Strategy'),
          'early_info'    => $text('Early Payoff Strategy Info','Add an extra payment and see how many months you can eliminate on the back end of the loan.'),
          'lump_title'    => $text('Lump Sum Payment Title','Lump Sum Payment'),
          'lump_info'     => $text('Lump Sum Payment Info','Shorten your loan term by paying a lump sum all to principal.'),
        ],
      ],
      'style' => [
        'title'  => 'Style Settings',
        'fields' => [
          'link_color_current' => $toggle('Link Color: Current Calc Item','1'),
          'shadow_disable'     => $toggle('Do you want to disable calculator shadow?','0'),
          'field_bg'  => $color('Field Box Background Color','#0f1115'),
          'field_txt' => $color('Field Box Text Color','#e5e7eb'),
          'c_pni'     => $color('Principle & Interest Color','#f59e0b'),
          'c_hoa'     => $color('HOA Dues Color','#60a5fa'),
          'c_tax'     => $color('Taxes Color','#22c55e'),
          'c_pmi'     => $color('PMI Color','#a78bfa'),
          'c_ins'     => $color('Home Insurance Color','#fbbf24'),
          'c_extra'   => $color('Extra Payment Color','#fb7185'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  REFINANCE
   *  --------------------------------------------------------- */
  $refinance = [
    'title'  => 'Refinance',
    'groups' => [
      'current' => [
        'title'  => 'Current Loan',
        'fields' => [
          'orig_amount' => $num('Original Loan Amount',300000,'1'),
          'orig_rate'   => $num('Original Rate',5,'0.01'),
          'orig_term'   => $num('Original Loan Term',30,'1'),
          'loan_start'  => $text('Loan Start Date','March 2022'),
        ],
      ],
      'new' => [
        'title'  => 'New Loan',
        'fields' => [
          'balance'  => $num('Current Loan Balance',250000,'1'),
          'cash_out' => $num('Cash Out Amount',10000,'1'),
          'costs'    => $num('Refinance Costs',1000,'1'),
          'rate'     => $num('New Rate',3,'0.01'),
          'term'     => $num('New Loan Term',15,'1'),
        ],
      ],
      'gen' => [
        'title'  => 'General Settings',
        'fields' => [
          'enable'   => $toggle('Enable Refinance Calculator','1'),
          'btn_text' => $text('Quote Button Text','GET A QUOTE'),
          'btn_link' => $text('Quote Button Link','/quote/'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  RENT VS BUY
   *  --------------------------------------------------------- */
  $rentbuy = [
    'title'  => 'Rent vs Buy Calculator',
    'groups' => [
      'mortgage' => [
        'title'  => 'Mortgage Information Setting',
        'fields' => [
          'enable'     => $toggle('Enable Rent vs Buy Calculator','1'),
          'home_price' => $num('Home Price',500000,'1'),
          'down'       => $num('Down Payment',50000,'1'),
          'rate'       => $num('Interest Rate',7,'0.01'),
          'term'       => $num('Loan Terms',30,'1'),
          'start'      => $text('Loan Start Date','March 2020'),
          'ins_yearly' => $num('Home Insurance (Yearly)',1200,'1'),
          'tax_yearly' => $num('Taxes (Yearly)',6000,'1'),
          'hoa_month'  => $num('HOA Fees (Monthly)',600,'1'),
        ],
      ],
      'rent' => [
        'title'  => 'Renting Assumptions Setting',
        'fields' => [
          'monthly_rent'    => $num('Monthly Rent',2000,'1'),
          'renters_ins_pct' => $num('Renters Insurance',1.3,'0.01'),
          'rent_appreciation'=> $num('Rent Appreciation',2,'0.01'),
        ],
      ],
      'buy' => [
        'title'  => 'Buying Assumptions Setting',
        'fields' => [
          'marginal_tax' => $num('Marginal Tax Bracket',25,'0.01'),
          'annual_costs' => $num('Annual Costs',1,'0.01'),
          'selling_costs'=> $num('Selling Costs',6,'0.01'),
          'annual_app'   => $num('Annual Appreciation',3,'0.01'),
          'pmi_yearly'   => $num('PMI (Yearly)',0,'1'),
        ],
      ],
      'gen' => [
        'title'  => 'General Setting',
        'fields' => [
          'btn_text' => $text('Quote Button Text','GET A QUOTE'),
          'btn_link' => $text('Quote Button Link','/quote/'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  VA PURCHASE
   *  --------------------------------------------------------- */
  $va_purchase = [
    'title'  => 'VA Purchase Calculator',
    'groups' => [
      'gen' => [
        'title'  => 'VA General Settings',
        'fields' => [
          'enable'        => $toggle('Enable VA Purchase Calculator','1'),
          'home_value'    => $num('Home Value',200000,'1'),
          'down_payment'  => $num('Down Payment',0,'1'),
          'base_amount'   => $num('Base Mortgage Amount',200000,'1'),
          'loan_terms'    => $num('Loan Terms',30,'1'),
          'interest_rate' => $num('Interest Rate',5,'0.01'),
          'property_tax'  => $num('Property Tax (Yearly)',1200,'1'),
          'hoa_month'     => $num('HOA Fees (Monthly)',0,'1'),
          'ins_yearly'    => $num('Home Insurance (Yearly)',1200,'1'),
          'btn_text'      => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'      => $text('Quote Button Link','/quote/'),
          'pay_title'     => $text('Payment Breakdown Title','Payment Breakdown'),
          'pay_info'      => $text('Payment Breakdown Info','A breakdown of your total payment so you can see where money is allocated.'),
          'early_title'   => $text('Early Payoff Strategy Title','Early Payoff Strategy'),
          'early_info'    => $text('Early Payoff Strategy Info','Add an extra payment and see how many months you can eliminate on the back end of the loan.'),
          'lump_title'    => $text('Lump Sum Payment Title','Lump Sum Payment'),
          'lump_info'     => $text('Lump Sum Payment Info','Shorten your loan term by paying a lump sum all to principal.'),
        ],
      ],
      'va_fee' => [
        'title'  => 'VA Funding Fee Settings',
        'fields' => [
          'first_less5'    => $num('First Use less than 5%',2.15,'0.01'),
          'first_5plus'    => $num('5% or more',1.5,'0.01'),
          'first_10plus'   => $num('10% or more',1.25,'0.01'),
          'after_less5'    => $num('After First Use less than 5%',3.3,'0.01'),
          'after_5plus'    => $num('After First Use 5% or more',1.5,'0.01'),
          'after_10plus'   => $num('After First Use 10% or more',1.25,'0.01'),
          'first_use_flag' => $toggle('First Use','1'),
        ],
      ],
      'style' => [
        'title'  => 'Style Settings',
        'fields' => [
          'field_bg'  => $color('Field Box Background Color','#0f1115'),
          'field_txt' => $color('Field Box Text Color','#e5e7eb'),
          'c_pni'     => $color('Principal & Interest Color','#f59e0b'),
          'c_hoa'     => $color('HOA Dues Color','#60a5fa'),
          'c_tax'     => $color('Taxes Color','#22c55e'),
          'c_ins'     => $color('Home Insurance Color','#fbbf24'),
          'c_extra'   => $color('Extra Payment Color','#fb7185'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  VA REFINANCE
   *  --------------------------------------------------------- */
  $va_refinance = [
    'title'  => 'VA Refinance Calculator',
    'groups' => [
      'current' => [
        'title'  => 'Current Loan',
        'fields' => [
          'orig_amount' => $num('Original Loan Amount',300000,'1'),
          'orig_rate'   => $num('Original Rate',5,'0.01'),
          'orig_term'   => $num('Original Loan Term',30,'1'),
          'loan_start'  => $text('Loan Start Date','March 2022'),
        ],
      ],
      'new' => [
        'title'  => 'New Loan',
        'fields' => [
          'balance'  => $num('Current Loan Balance',250000,'1'),
          'cash_out' => $num('Cash Out Amount',10000,'1'),
          'costs'    => $num('Refinance Costs',1000,'1'),
          'rate'     => $num('New Rate',3,'0.01'),
          'term'     => $num('New Loan Term',15,'1'),
        ],
      ],
      'va_fee' => [
        'title'  => 'VA Refinance Funding Fee Settings',
        'fields' => [
          'first_use_rate'   => $num('First Use',2.15,'0.01'),
          'after_first_rate' => $num('After First Use',3.3,'0.01'),
          'irrrl'            => $num('IRRRL',0.5,'0.01'),
          'first_use_flag'   => $toggle('First Use','1'),
          'is_irrrl'         => $toggle('IRRRL','0'),
        ],
      ],
      'gen' => [
        'title'  => 'General Settings',
        'fields' => [
          'enable'                     => $toggle('Enable VA Refinance Calculator','1'),
          'monthly_comp_title'         => $text('Monthly Payment Comparison Title','Monthly Payment Comparison'),
          'monthly_comp_info'          => $text('Monthly Payment Comparison Info','A breakdown of your total payment so you can see where money is allocated.'),
          'interest_comp_title'        => $text('Total Interest Comparison Title','Total Interest Comparison'),
          'interest_comp_info'         => $text('Total Interest Comparison Info','A breakdown of your total payment so you can see where money is allocated.'),
          'btn_text'                   => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'                   => $text('Quote Button Link','/quote/'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  DSCR
   *  --------------------------------------------------------- */
  $dscr = [
    'title'  => 'Debt-Service (DSCR) Calculator',
    'groups' => [
      'general' => [
        'title'  => 'General Settings',
        'fields' => [
          'enable'         => $toggle('Enable Rental Loan Calculator','1'),
          'num_units'      => $num('Number of Units',1,'1'),
          'purpose'        => $text('Purchase or Refinance','Purchase'),
          'prop_value'     => $num('Property Value or Purchase Price',500000,'1'),
          'unit_rent'      => $num('Unit 1 Monthly Rent',2000,'1'),
          'taxes'          => $num('Annual Property Taxes',6000,'1'),
          'ins'            => $num('Annual Insurance',1200,'1'),
          'vacancy'        => $num('Vacancy Rate %',5,'0.01'),
          'repairs'        => $num('Annual Repairs & Maintenance',500,'1'),
          'utils'          => $num('Annual Utilities',3000,'1'),
          'hoa'            => $num('Monthly HOA Fee',0,'1'),
          'ltv'            => $num('Loan to Value %',80,'0.01'),
          'rate'           => $num('Interest Rate',10,'0.01'),
          'orig_fee'       => $num('Origination Fee',2,'0.01'),
          'closing'        => $num('Closing Costs',6500,'1'),
          'btn_text'       => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'       => $text('Quote Button Link','/quote/'),
          'deal_title'     => $text('Deal Breakdown Title','Deal Breakdown'),
          'deal_info'      => $text('Deal Breakdown Info','A breakdown of your rental loan deal.'),
          'metrics_title'  => $text('Deal Metrics Title','Deal Metrics'),
          'metrics_info'   => $text('Deal Metrics Info','A metrics of your rental loan deal.'),
          'return_title'   => $text('Return Metrics Title','Return Metrics'),
          'return_info'    => $text('Return Metrics Info','A metrics of your rental loan return.'),
          'cash_flow_info' => $text('Cash Flow Info','Annual cash flow after all expenses and mortgage are paid.'),
          'cap_rate_info'  => $text('Cap Rate Info','Cap rate is a net income metric including your mortgage on the purchase or property.'),
          'coc_info'       => $text('Cash on Cash Return Info','Cash on cash return is a metric that divides your pre tax cash flow by the cash invested in the deal.'),
          'dscr_info'      => $text('DSCR Info','DSCR calculates the ratio of rental income to your mortgage payment. Ideally, you will have a DSCR of 1.0 or higher.'),
        ],
      ],
    ],
  ];

  /** -----------------------------------------------------------
   *  FIX AND FLIP
   *  --------------------------------------------------------- */
  $fixflip = [
    'title'  => 'Fix & Flip Calculator',
    'groups' => [
      'general' => [
        'title'  => 'General Setting',
        'fields' => [
          'enable'         => $toggle('Enable Fix & Flip Calculator','1'),
          'enable_report'  => $toggle('Enable Analysis Report','1'),
          'enable_address' => $toggle('Enable Property Address','0'),
          'purchase_price' => $num('Purchase Price',500000,'1'),
          'reno'           => $num('Renovation Cost',75000,'1'),
          'arv'            => $num('After Repaired Value',750000,'1'),
          'length_month'   => $num('Length of Loan (Months)',8,'1'),
          'taxes'          => $num('Annual Property Taxes',4000,'1'),
          'ins'            => $num('Annual Insurance',3000,'1'),
          'ltv'            => $num('Purchase Price LTV %',80,'0.01'),
          'rate'           => $num('Interest Rate',10,'0.01'),
          'orig_fee'       => $num('Origination Fee',2,'0.01'),
          'other_closing'  => $num('Other Closing Costs',15000,'1'),
          'cost_to_sell'   => $num('Cost To Sell %',8,'0.01'),
          'btn_text'       => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'       => $text('Quote Button Link','/quote/'),
          'deal_title'     => $text('Deal Breakdown Title','Deal Breakdown'),
          'deal_info'      => $text('Deal Breakdown Info','A breakdown of your rental loan deal.'),
          'metrics_title'  => $text('Deal Metrics Title','Deal Metrics'),
          'metrics_info'   => $text('Deal Metrics Info','A metrics of your rental loan deal.'),
          'return_title'   => $text('Return Metrics Title','Return Metrics'),
          'return_info'    => $text('Return Metrics Info','A metrics of your rental loan return.'),
          'analysis_title' => $text('Analysis Report Title','Analysis Report'),
          'analysis_info'  => $text('Analysis Report Info','Get your calculated analysis report.'),
          'analysis_gf'    => $text('Analysis Report - Gravity Form Shortcode','Enter Analysis Report Gravity Form Shortcode'),
        ],
      ],
    ],
  ];

  return [
    'affordability'=> $affordability,
    'purchase'     => $purchase,
    'refinance'    => $refinance,
    'rentbuy'      => $rentbuy,
    'va_purchase'  => $va_purchase,
    'va_refinance' => $va_refinance,
    'dscr'         => $dscr,
    'fixflip'      => $fixflip,
  ];
}

/**
 * Initial tabs and theme settings the first time the plugin runs
 */
function creo_mc_seed_tabs() {
  $mk = function($label,$type){ return ['label'=>$label,'type'=>$type,'enabled'=>true,'data'=>[]]; };

  return [
    'afford'   => $mk('Affordability Calculator','affordability'),
    'purchase' => $mk('Purchase','purchase'),
    'refi'     => $mk('Refinance','refinance'),
    'rentbuy'  => $mk('Rent vs Buy','rentbuy'),
    'va_purch' => $mk('VA Purchase','va_purchase'),
    'va_refi'  => $mk('VA Refinance','va_refinance'),
    'dscr'     => $mk('Debt-Service (DSCR)','dscr'),
    'fixflip'  => $mk('Fix & Flip','fixflip'),
    '_theme'   => [
      'brand'  => '#0ea5e9',
      'accent' => '#16a34a',
    ],
  ];
}
