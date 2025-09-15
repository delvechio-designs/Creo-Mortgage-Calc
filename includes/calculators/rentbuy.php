<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_rentbuy($d){
  $years = max(1, intval($d['years'] ?? 8));
  $home  = floatval($d['home_price'] ?? 500000);
  $down  = floatval($d['down'] ?? 50000);
  $loan  = max(0.01, $home - $down);
  $rate  = floatval($d['rate'] ?? 7);
  $term  = intval($d['term'] ?? 30);

  $taxY  = floatval($d['tax_yearly'] ?? 6000);
  $insY  = floatval($d['ins_yearly'] ?? 1200);
  $hoaM  = floatval($d['hoa_month'] ?? 0);
  $pmiY  = floatval($d['pmi_yearly'] ?? 0);
  $maintPct = floatval($d['annual_costs'] ?? 1) / 100.0;
  $sellPct  = floatval($d['selling_costs'] ?? 6) / 100.0;
  $appPct   = floatval($d['annual_app'] ?? 3) / 100.0;
  $rent0    = floatval($d['monthly_rent'] ?? 2000);
  $rentApp  = floatval($d['rent_appreciation'] ?? 2) / 100.0;
  $rentInsPct = floatval($d['renters_ins_pct'] ?? 1.3) / 100.0;

  $piM   = creo_amort_payment($loan,$rate,$term);
  $taxM  = $taxY / 12.0;
  $insM  = $insY / 12.0;
  $pmiM  = $pmiY / 12.0;
  $maintM= ($home * $maintPct) / 12.0;
  $ownMonthly = $piM + $taxM + $insM + $hoaM + $pmiM + $maintM;

  $buyTotal = 0; $rentTotal = 0; $rentInsTotal = 0; $bal = $loan;
  $i = ($rate/100)/12;

  for ($m=1; $m<=($years*12); $m++){
    $interest  = $bal*$i;
    $principal = $piM - $interest;
    $bal = max(0, $bal - $principal);
    $buyTotal += $piM + $taxM + $insM + $hoaM + $pmiM + $maintM;

    $rentM = $rent0*pow(1+$rentApp, ($m-1)/12.0);
    $rentTotal += $rentM;
    $rentInsTotal += $rentM * $rentInsPct;
  }

  $homeFuture = $home * pow(1+$appPct, $years);
  $equity     = max(0, $homeFuture - $bal);
  $sellingCosts = $homeFuture * $sellPct;
  $netHome    = $equity - $sellingCosts;

  $rentCost = $rentTotal + $rentInsTotal;
  $netAdvantage = $netHome - max(0, $buyTotal - $rentCost);

  return [
    'kpis'=>[
      ['label'=>'Years Analyzed','value'=>$years],
      ['label'=>'Total Cost of Renting','value'=>$rentCost],
      ['label'=>'Total Cost of Buying','value'=>$buyTotal],
      ['label'=>'Net Worth Difference','value'=>$netAdvantage],
    ],
    'donut'=>[
      'monthly'=>[
        ['label'=>'Principal & interest','v'=>round($piM,2)],
        ['label'=>'Taxes','v'=>round($taxM,2)],
        ['label'=>'Insurance','v'=>round($insM,2)],
        ['label'=>'HOA Dues','v'=>round($hoaM,2)],
        ['label'=>'PMI','v'=>round($pmiM,2)],
        ['label'=>'Maintenance','v'=>round($maintM,2)],
      ],
      'colors'=>['#f59e0b','#22c55e','#fbbf24','#60a5fa','#a78bfa','#fb7185'],
    ],
    'monthlyBreak'=>[
      ['label'=>'Home Value','v'=>$home],
      ['label'=>'Down Payment','v'=>$down],
      ['label'=>'Loan Amount','v'=>$loan],
      ['label'=>'Monthly Principal & interest','v'=>$piM],
      ['label'=>'Monthly Property Tax','v'=>$taxM],
      ['label'=>'Monthly Home Insurance','v'=>$insM],
      ['label'=>'Monthly HOA Fee','v'=>$hoaM],
      ['label'=>'Monthly PMI','v'=>$pmiM],
      ['label'=>'Monthly Maintenance','v'=>$maintM],
    ],
    'comparison'=>[
      'rent_total'=>$rentCost,
      'buy_total'=>$buyTotal,
      'equity'=>$equity,
      'net_home'=>$netHome,
      'net_advantage'=>$netAdvantage,
      'remaining_balance'=>$bal,
      'future_value'=>$homeFuture,
      'selling_costs'=>$sellingCosts,
      'down_payment'=>$down,
    ],
  ];
}
