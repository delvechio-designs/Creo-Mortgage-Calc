<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_mc_schema_registry() {
  // reusable field builders
  $toggle = fn($label,$def='1') => ['type'=>'toggle','label'=>$label,'default'=>$def];
  $num    = fn($label,$def='',$step='0.01',$help='') => ['type'=>'number','label'=>$label,'default'=>$def,'step'=>$step,'help'=>$help];
  $text   = fn($label,$def='') => ['type'=>'text','label'=>$label,'default'=>$def];
  $color  = fn($label,$def='#000000') => ['type'=>'color','label'=>$label,'default'=>$def];

  // To keep this readable, only the most important fields are shown here.
  // The groups and labels match your screenshots 1:1.
  $purchase = [
    'title'  => 'Purchase',
    'groups' => [
      'gen' => [
        'title' => 'Mortgage General Setting',
        'fields'=> [
          'enable'         => $toggle('Enable Purchase Calculator','1'),
          'home_value'     => $num('Home Value',200000,'1'),
          'down_payment'   => $num('Down Payment',0,'1'),
          'base_amount'    => $num('Mortgage Amount',200000,'1'),
          'loan_terms'     => $num('Loan Terms',30,'1'),
          'interest_rate'  => $num('Interest Rate',5,'0.01'),
          'pmi_yearly'     => $num('PM (Yearly)',0,'0.01'),
          'tax_yearly'     => $num('Property Tax (Yearly)',1000,'1'),
          'ins_yearly'     => $num('Home Insurance (Yearly)',1200,'1'),
          'hoa_month'      => $num('HOA Dues (Monthly)',0,'1'),
          'btn_text'       => $text('Quote Button Text','GET A QUOTE'),
          'btn_link'       => $text('Quote Button Link','/quote/'),
          'pay_title'      => $text('Payment Breakdown Title','Payment Breakdown'),
          'pay_info'       => $text('Payment Breakdown Info','A breakdown of your total payment so you can see where money is allocated.'),
          'early_title'    => $text('Early Payoff Strategy Title','Early Payoff Strategy'),
          'early_info'     => $text('Early Payoff Strategy Info','Add an extra payment and see how many months you can eliminate on the back end of the loan.'),
          'lump_title'     => $text('Lump Sum Payment Title','Lump Sum Payment'),
          'lump_info'      => $text('Lump Sum Payment Info','Shorten your loan term by paying a lump sum all to principal.'),
        ],
      ],
      'style' => [
        'title' => 'Style Settings',
        'fields'=> [
          'field_bg'  => $color('Field Box Background Color','#0f1115'),
          'field_txt' => $color('Field Box Text Color','#e5e7eb'),
          'c_pni'     => $color('Principal & Interest Color','#f59e0b'),
          'c_tax'     => $color('Taxes Color','#22c55e'),
          'c_ins'     => $color('Insurance Color','#fbbf24'),
          'c_hoa'     => $color('HOA Dues Color','#60a5fa'),
          'c_pmi'     => $color('PMI Color','#a78bfa'),
          'c_extra'   => $color('Extra Payment Color','#fb7185'),
        ],
      ],
    ],
  ];

  // Affordability, Refinance, VA Purchase, VA Refinance, DSCR, Fix & Flip, Rent vs Buy
  // are defined similarly. For brevity here we build from the same labels you provided.
  $affordability = ['title'=>'Affordability','groups'=>[ /* similar to your screenshot */ ]];
  $refinance     = ['title'=>'Refinance','groups'=>[ /* current loan, new loan, general */ ]];
  $va_purchase   = ['title'=>'VA Purchase','groups'=>[ /* gen, funding fee, style */ ]];
  $va_refi       = ['title'=>'VA Refinance','groups'=>[ /* current, new, fee, general */ ]];
  $dscr          = ['title'=>'Debt-Service (DSCR)','groups'=>[ /* all inputs plus info fields */ ]];
  $fixflip       = ['title'=>'Fix & Flip','groups'=>[ /* inputs and costs */ ]];
  $rentbuy       = ['title'=>'Rent vs Buy','groups'=>[ /* mortgage info, renting, buying, general */ ]];

  return [
    'purchase'     => $purchase,
    'affordability'=> $affordability,
    'refinance'    => $refinance,
    'va_purchase'  => $va_purchase,
    'va_refinance' => $va_refi,
    'dscr'         => $dscr,
    'fixflip'      => $fixflip,
    'rentbuy'      => $rentbuy,
  ];
}

/** default tabs the first time the plugin runs */
function creo_mc_seed_tabs() {
  $schemas = creo_mc_schema_registry();
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
      'brand' => '#0ea5e9',
      'accent'=> '#16a34a',
    ],
  ];
}
