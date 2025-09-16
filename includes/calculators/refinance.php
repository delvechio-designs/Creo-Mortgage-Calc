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

  $baseNew = $newBal + $cashOut + $costs;

  $piCurrent = creo_amort_payment($origAmt,$origRate,$origTerm);
  $piNew     = creo_amort_payment($baseNew,$newRate,$newTerm);

  $diffM = $piNew - $piCurrent;

  $interestCurrent = $piCurrent*($origTerm*12) - $origAmt;
  $interestNew     = $piNew*($newTerm*12) - $baseNew;

  $savingsM = max(0, $piCurrent - $piNew);
  $recoupMonths = $savingsM > 0 ? ceil($costs / $savingsM) : 0;

  return [
    'kpis'=>[
      ['label'=>'Monthly Payment Increase','value'=>$diffM],
      ['label'=>'Total Interest Difference','value'=>$interestNew - $interestCurrent],
      ['label'=>'Refinance Costs','value'=>$costs],
      ['label'=>'Time to Recoup Fees','value'=>$recoupMonths],
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
    ],
    'monthlyBreak'=>[
      ['label'=>'Current Monthly Payment','v'=>$piCurrent],
      ['label'=>'New Monthly Payment','v'=>$piNew],
      ['label'=>'Monthly Payment Difference','v'=>$diffM],
      ['label'=>'Cash Out Amount','v'=>$cashOut],
      ['label'=>'Refinance Costs','v'=>$costs],
    ],
    'costs'=>$costs,
    'rate'=>$newRate,
    'term'=>$newTerm,
    'cash_out'=>$cashOut,
    'recoup_time'=>$recoupMonths,
  ];
}
