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

function creo_calc_purchase($d){
  $home   = floatval($d['home_value'] ?? 200000);
  $down   = floatval($d['down_payment'] ?? 0);
  $loan   = max(0.01, floatval($d['base_amount'] ?? ($home-$down)));
  $rate   = floatval($d['interest_rate'] ?? 5);
  $years  = intval($d['loan_terms'] ?? 30);
  $taxY   = floatval($d['tax_yearly'] ?? 1000);
  $insY   = floatval($d['ins_yearly'] ?? 1200);
  $hoaM   = floatval($d['hoa_month'] ?? 0);
  $pmiY   = floatval($d['pmi_yearly'] ?? 0);

  $piM    = creo_amort_payment($loan,$rate,$years);

  $taxM = $taxY/12;
  $insM = $insY/12;
  $pmiM = $pmiY/12;

  $totalM = $piM + $taxM + $insM + $hoaM + $pmiM;
  $totalPaid = $totalM * ($years*12);
  $interestTotal = $piM*($years*12) - $loan;

  $slices = [
    ['k'=>'pni','label'=>'Principal & interest','v'=>round($piM,2)],
    ['k'=>'tax','label'=>'Taxes','v'=>round($taxM,2)],
    ['k'=>'ins','label'=>'Insurance','v'=>round($insM,2)],
    ['k'=>'hoa','label'=>'HOA Dues','v'=>round($hoaM,2)],
    ['k'=>'pmi','label'=>'PMI','v'=>round($pmiM,2)],
  ];

  return [
    'kpis'=>[
      ['label'=>'All Payment','value'=>$totalPaid],
      ['label'=>'Total Loan Amount','value'=>$loan],
      ['label'=>'Total Interest Paid','value'=>$interestTotal],
    ],
    'donut'=>[
      'monthly'=>$slices,
      'colors'=>['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa'],
    ],
    'monthlyBreak'=>[
      ['label'=>'Home Value','v'=>$home],
      ['label'=>'Mortgage Amount','v'=>$loan],
      ['label'=>'Monthly Principal & interest','v'=>$piM],
      ['label'=>'Monthly Property Tax','v'=>$taxM],
      ['label'=>'Monthly HOA Fee','v'=>$hoaM],
      ['label'=>'Monthly Home Insurance','v'=>$insM],
      ['label'=>'Monthly PMI','v'=>$pmiM],
    ],
    'totalsBreak'=>[
      ['label'=>'Total Payment','v'=>$totalPaid],
      ['label'=>'Total Interest','v'=>$interestTotal],
    ],
    'down_payment' => $down,
  ];
}
