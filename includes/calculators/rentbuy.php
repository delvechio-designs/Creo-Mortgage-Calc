<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_rentbuy($d){
  $years = intval($d['years'] ?? 8);
  $home  = floatval($d['home_price'] ?? 500000);
  $down  = floatval($d['down'] ?? 50000);
  $loan  = $home - $down;
  $rate  = floatval($d['rate'] ?? 7);
  $term  = intval($d['term'] ?? 30);
  $start = $d['start'] ?? 'March 2020';

  $rent0 = floatval($d['monthly_rent'] ?? 2000);
  $rentApp = floatval($d['rent_appreciation'] ?? 2)/100.0;

  $piM = creo_amort_payment($loan,$rate,$term);
  $buyTotal = 0; $rentTotal = 0; $equity = 0; $bal = $loan;

  $i = ($rate/100)/12;

  for ($m=1; $m<=($years*12); $m++){
    // buy
    $interest = $bal*$i;
    $principal = $piM - $interest;
    $bal = max(0, $bal - $principal);
    $equity += $principal;
    $buyTotal += $piM;

    // rent with yearly appreciation monthly rate
    $rentM = $rent0*pow(1+$rentApp, ($m-1)/12.0);
    $rentTotal += $rentM;
  }

  $gain = $equity - max(0,$rentTotal - $buyTotal);

  return [
    'kpis'=>[
      ['label'=>'Year','value'=>$years],
      ['label'=>'Buy Gain','value'=>$gain],
    ],
    'bars'=>[
      'buy'=>$buyTotal,
      'rent'=>$rentTotal,
    ]
  ];
}
