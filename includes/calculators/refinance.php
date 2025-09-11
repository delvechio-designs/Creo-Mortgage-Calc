<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_refinance($d){
  $origAmt = floatval($d['orig_amount'] ?? 300000);
  $origRate= floatval($d['orig_rate'] ?? 5);
  $origTerm= intval($d['orig_term'] ?? 30);

  $newBal  = floatval($d['balance'] ?? 250000);
  $cashOut = floatval($d['cash_out'] ?? 0);
  $costs   = floatval($d['costs'] ?? 1000);
  $newRate = floatval($d['rate'] ?? 3);
  $newTerm = intval($d['term'] ?? 15);

  $piCurrent = creo_amort_payment($origAmt,$origRate,$origTerm);
  $piNew     = creo_amort_payment($newBal + $cashOut + $costs,$newRate,$newTerm);

  $diffM = $piNew - $piCurrent;

  $interestCurrent = $piCurrent*($origTerm*12) - $origAmt;
  $interestNew     = $piNew*($newTerm*12) - ($newBal + $cashOut + $costs);

  return [
    'kpis'=>[
      ['label'=>'Monthly Payment Increase','value'=>$diffM],
      ['label'=>'Total Interest Difference','value'=>$interestNew - $interestCurrent],
      ['label'=>'Refinance Costs','value'=>$costs],
    ],
    'compare'=>[
      'current'=>$piCurrent,
      'new'=>$piNew,
      'diff'=>$diffM,
      'interest'=>[
        'current'=>$interestCurrent,
        'new'=>$interestNew,
        'diff'=>$interestNew - $interestCurrent
      ]
    ]
  ];
}
