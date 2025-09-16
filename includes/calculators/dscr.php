<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_dscr($d){
  $units = intval($d['num_units'] ?? 1);
  $rent1 = floatval($d['unit_rent'] ?? 2000);
  $gross = $rent1 * $units * 12;

  $tax   = floatval($d['taxes'] ?? 6000);
  $ins   = floatval($d['ins'] ?? 1200);
  $vac   = floatval($d['vacancy'] ?? 5)/100;
  $rep   = floatval($d['repairs'] ?? 500);
  $utils = floatval($d['utils'] ?? 3000);
  $hoa   = floatval($d['hoa'] ?? 0);
  $closing = floatval($d['closing'] ?? 6500);
  $origPct = floatval($d['orig_fee'] ?? 2)/100;

  $vacancyLoss = $gross * $vac;
  $opExp = $tax + $ins + $rep + $utils + ($hoa*12) + $vacancyLoss;
  $noi   = $gross - $opExp;

  $value = floatval($d['prop_value'] ?? 500000);
  $ltv   = floatval($d['ltv'] ?? 80)/100;
  $loan  = $value*$ltv;
  $down  = max(0, $value - $loan);

  $rate  = floatval($d['rate'] ?? 10);
  $years = 30;
  $piM   = creo_amort_payment($loan,$rate,$years);
  $piY   = $piM * 12;

  $dscr  = $piY>0 ? $noi/$piY : 0;

  $cashFlow = $noi - $piY;
  $capRate = $value>0 ? ($noi/$value) : 0;
  $origination = $loan * $origPct;
  $cashNeeded = $down + $closing + $origination;
  $coc     = $cashNeeded>0 ? ($cashFlow/$cashNeeded) : 0;

  return [
    'returns'=>[
      'cash_flow'=>$cashFlow,
      'cap_rate'=>$capRate*100,
      'coc'=>$coc*100,
      'dscr'=>$dscr,
    ],
    'donut'=>[
      'monthly'=>[
        ['label'=>'Net Operating Income','v'=>round($noi/12,2)],
        ['label'=>'Debt Service','v'=>round($piY/12,2)],
        ['label'=>'Vacancy Loss','v'=>round($vacancyLoss/12,2)],
        ['label'=>'Operating Expenses','v'=>round(($opExp-$vacancyLoss)/12,2)],
      ],
      'colors'=>['#16a34a','#0ea5e9','#f97316','#fbbf24'],
    ],
    'monthlyBreak'=>[
      ['label'=>'Gross Scheduled Rent','v'=>$gross/12],
      ['label'=>'Vacancy Allowance','v'=>$vacancyLoss/12],
      ['label'=>'Net Operating Income','v'=>$noi/12],
      ['label'=>'Debt Service','v'=>$piY/12],
      ['label'=>'Monthly Cash Flow','v'=>$cashFlow/12],
      ['label'=>'Taxes (Monthly)','v'=>$tax/12],
      ['label'=>'Insurance (Monthly)','v'=>$ins/12],
      ['label'=>'HOA Fees','v'=>$hoa],
      ['label'=>'Repairs & Maintenance (Monthly)','v'=>$rep/12],
      ['label'=>'Utilities (Monthly)','v'=>$utils/12],
    ],
    'dealBreak'=>[
      ['label'=>'Property Value','v'=>$value],
      ['label'=>'Loan Amount','v'=>$loan],
      ['label'=>'Down Payment','v'=>$down],
      ['label'=>'Origination Fee','v'=>$origination],
      ['label'=>'Closing Costs','v'=>$closing],
    ],
    'metrics'=>[
      'cash_needed'=>$cashNeeded,
      'operating'=>$opExp,
      'ltv'=>$ltv*100,
      'origination'=>$origination,
    ],
  ];
}
