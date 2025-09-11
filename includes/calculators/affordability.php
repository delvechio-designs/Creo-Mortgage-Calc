<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_affordability($d){
  $incomeM = floatval($d['gross_income_monthly'] ?? 5500);
  $debtsM  = floatval($d['monthly_debts'] ?? 1500);
  $rate    = floatval($d['interest_rate'] ?? 6.5);
  $years   = intval($d['loan_terms'] ?? 30);
  $dtiFront= floatval($d['front_dti'] ?? 0.31);
  $dtiBack = floatval($d['back_dti'] ?? 0.43);

  $pmax = max(0, $incomeM*$dtiBack - $debtsM); // back-end
  $pmax = min($pmax, $incomeM*$dtiFront);

  // invert payment to principal
  $i = ($rate/100)/12; $n=$years*12;
  $loanMax = ($i==0) ? $pmax*$n : $pmax * (pow(1+$i,$n) - 1) / ($i*pow(1+$i,$n));

  return [
    'kpis'=>[
      ['label'=>'Monthly Mortgage Payment','value'=>$pmax],
      ['label'=>'Loan Amount','value'=>$loanMax],
      ['label'=>'Your Debt to Income Ratio','value'=>[round($dtiFront*100,2), round($dtiBack*100,2)]],
    ],
  ];
}
