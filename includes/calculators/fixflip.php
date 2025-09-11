<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_calc_fixflip($d){
  $purchase = floatval($d['purchase_price'] ?? 500000);
  $reno     = floatval($d['reno'] ?? 75000);
  $arv      = floatval($d['arv'] ?? 750000);
  $taxY     = floatval($d['taxes'] ?? 4000);
  $insY     = floatval($d['ins'] ?? 3000);
  $ltv      = floatval($d['ltv'] ?? 80)/100;
  $rate     = floatval($d['rate'] ?? 10);
  $otherC   = floatval($d['closing'] ?? 15000);
  $sellPct  = floatval($d['cost_to_sell'] ?? 8)/100;

  $loanAmt = $purchase*$ltv;
  $down    = $purchase - $loanAmt;

  // hold six months interest approximation
  $piM = creo_amort_payment($loanAmt,$rate,30);
  $carrying = $piM*6 + ($taxY/2) + ($insY/2);

  $sellCost = $arv*$sellPct;
  $closing  = $otherC;
  $equityNeeded = $down + $reno + $carrying + $closing;
  $netProfit = $arv - ($purchase + $reno + $carrying + $closing + $sellCost);

  $roi = $equityNeeded>0 ? $netProfit/$equityNeeded : 0;
  $ltvFinal = $arv>0 ? ($loanAmt/$arv) : 0;

  return [
    'kpis'=>[
      ['label'=>'Borrower Equity Needed','value'=>$equityNeeded],
      ['label'=>'Net Profit','value'=>$netProfit],
      ['label'=>'Return on Investment','value'=>$roi],
      ['label'=>'Loan to After Repaired Value','value'=>$ltvFinal],
    ],
    'deal'=>[
      'loan_amount'=>$loanAmt,
      'down_payment'=>$down,
      'monthly_interest'=>$piM,
      'interest_over_term'=>$piM*6,
      'origination'=>$loanAmt*(floatval($d['orig_fee']??2)/100),
      'other_closing'=>$otherC,
      'cost_to_sell'=>$sellCost
    ],
    'metrics'=>[
      'closing_costs'=>$closing,
      'carrying_costs'=>$carrying,
      'borrower_equity'=>$equityNeeded,
      'total_cash_in_deal'=>$equityNeeded,
    ]
  ];
}
