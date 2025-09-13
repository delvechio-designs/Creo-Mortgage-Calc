<?php
if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! function_exists('creo_amort_payment') ) {
  function creo_amort_payment($principal,$annual_rate,$years){
    $i = ($annual_rate/100)/12;
    $n = max(1, $years*12);
    if ($i==0) return $principal/$n;
    return $principal * ($i * pow(1+$i,$n)) / (pow(1+$i,$n) - 1);
  }
}

function creo_calc_affordability($d){
  $incomeM   = floatval($d['gross_income_monthly'] ?? 5500);
  $debtsM    = floatval($d['monthly_debts'] ?? 1500);
  $home      = floatval($d['home_price'] ?? 200000);
  $down      = floatval($d['down_payment'] ?? 0);
  $years     = intval($d['loan_terms'] ?? 30);
  $rate      = floatval($d['interest_rate'] ?? 6.5);

  // admin schema uses homeowners_ins + prop_tax_pct (% of home)
  $propPct   = floatval($d['prop_tax_pct'] ?? 0.8) / 100.0;
  $insYearly = floatval($d['homeowners_ins'] ?? 1200);
  $pmiYearly = floatval($d['pmi_yearly'] ?? 3000);
  $hoaMonth  = floatval($d['hoa_month'] ?? 0);

  $loan      = max(0.01, floatval($d['loan_amount'] ?? ($home - $down)));
  $piM       = creo_amort_payment($loan,$rate,$years);
  $taxM      = ($home * $propPct) / 12.0;
  $insM      = $insYearly / 12.0;
  $pmiM      = $pmiYearly / 12.0;

  $totalM    = $piM + $taxM + $insM + $hoaMonth + $pmiM;

  // DTI (front/back)
  $frontDTI  = $incomeM>0 ? ($totalM/$incomeM)*100 : 0;
  $backDTI   = $incomeM>0 ? (($totalM+$debtsM)/$incomeM)*100 : 0;

  // Allowable (can be extended to pull from saved conv/va/usda settings)
  $allowFront = 50; $allowBack = 50;

  return [
    'kpis'=>[
      ['label'=>'Monthly Mortgage Payment','value'=>$totalM],
      ['label'=>'Loan Amount','value'=>$loan],
      ['label'=>'Your Debt to Income Ratio','value'=>[$frontDTI,$backDTI]],
      ['label'=>'Allowable Debt to Income Ratio','value'=>[$allowFront,$allowBack]],
    ],
    'donut'=>[
      'monthly'=>[
        ['label'=>'Principal & interest','v'=>round($piM,2)],
        ['label'=>'Taxes','v'=>round($taxM,2)],
        ['label'=>'Insurance','v'=>round($insM,2)],
        ['label'=>'HOA Dues','v'=>round($hoaMonth,2)],
        ['label'=>'PMI','v'=>round($pmiM,2)],
      ],
      'colors'=>['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa'],
    ],
    'monthlyBreak'=>[
      ['label'=>'Home Value','v'=>$home],
      ['label'=>'Mortgage Amount','v'=>$loan],
      ['label'=>'Monthly Principal & interest','v'=>$piM],
      ['label'=>'Monthly Property Tax','v'=>$taxM],
      ['label'=>'Monthly HOA Fee','v'=>$hoaMonth],
      ['label'=>'Monthly Home Insurance','v'=>$insM],
      ['label'=>'Monthly PMI','v'=>$pmiM],
    ],
    'afford'=>[
      'purchase_price' => $home,
      'down_payment'   => $down,
      'dti_you'        => sprintf('%.2f%% / %.2f%%',$frontDTI,$backDTI),
      'dti_allowed'    => sprintf('%.0f%% / %.0f%%',$allowFront,$allowBack),
    ],
  ];
}
