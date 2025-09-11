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

  $opExp = $tax + $ins + $rep + $utils + ($hoa*12) + ($gross*$vac);
  $noi   = $gross - $opExp;

  $value = floatval($d['prop_value'] ?? 500000);
  $ltv   = floatval($d['ltv'] ?? 80)/100;
  $loan  = $value*$ltv;

  $rate  = floatval($d['rate'] ?? 10);
  $years = 30;
  $piM   = creo_amort_payment($loan,$rate,$years);
  $piY   = $piM * 12;

  $dscr  = $piY>0 ? $noi/$piY : 0;

  // cash flow, cap rate, cash on cash return
  $cashFlow = $noi - $piY;
  $capRate = $value>0 ? ($noi/$value) : 0;
  $coc     = ($loan>0) ? ($cashFlow/($value - $loan)) : 0;

  return [
    'kpis'=>[
      ['label'=>'Cash Flow','value'=>$cashFlow],
      ['label'=>'Cap Rate','value'=>$capRate],
      ['label'=>'Cash on Cash Return','value'=>$coc],
      ['label'=>'DSCR','value'=>$dscr],
    ],
    'breakdown'=>[
      'loan_amount'=>$loan,
      'down_payment'=>$value-$loan,
      'mortgage'=>$piY,
      'origination'=>$loan*(floatval($d['orig_fee']??2)/100),
    ]
  ];
}
