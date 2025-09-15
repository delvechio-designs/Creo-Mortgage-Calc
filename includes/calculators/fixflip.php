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
  $closingIn= floatval($d['other_closing'] ?? ($d['closing'] ?? 15000));
  $sellPct  = floatval($d['cost_to_sell'] ?? 8)/100;
  $origPct  = floatval($d['orig_fee'] ?? 2)/100;

  $loanAmt = $purchase*$ltv;
  $down    = $purchase - $loanAmt;

  $piM = creo_amort_payment($loanAmt,$rate,30);
  $carrying = $piM*6 + ($taxY/2) + ($insY/2);

  $sellCost = $arv*$sellPct;
  $origination = $loanAmt * $origPct;
  $cashNeeded = $down + $reno + $carrying + $closingIn + $origination;
  $netProfit = $arv - ($purchase + $reno + $carrying + $closingIn + $sellCost + $origination);

  $roi = $cashNeeded>0 ? ($netProfit/$cashNeeded) : 0;
  $ltvFinal = $arv>0 ? ($loanAmt/$arv) : 0;

  return [
    'returns'=>[
      'borrower_equity'=>$cashNeeded,
      'net_profit'=>$netProfit,
      'roi'=>$roi*100,
      'ltv_to_arv'=>$ltvFinal*100,
    ],
    'donut'=>[
      'monthly'=>[
        ['label'=>'Purchase Price','v'=>round($purchase,2)],
        ['label'=>'Renovation Cost','v'=>round($reno,2)],
        ['label'=>'Carrying Costs','v'=>round($carrying,2)],
        ['label'=>'Closing & Fees','v'=>round($closingIn + $origination,2)],
      ],
      'colors'=>['#0ea5e9','#f97316','#facc15','#22c55e'],
    ],
    'dealBreak'=>[
      ['label'=>'Purchase Price','v'=>$purchase],
      ['label'=>'Renovation Cost','v'=>$reno],
      ['label'=>'Loan Amount','v'=>$loanAmt],
      ['label'=>'Down Payment','v'=>$down],
      ['label'=>'Origination Fee','v'=>$origination],
      ['label'=>'Carrying Costs','v'=>$carrying],
      ['label'=>'Closing Costs','v'=>$closingIn],
      ['label'=>'Cost to Sell','v'=>$sellCost],
    ],
    'metrics'=>[
      'closing_costs'=>$closingIn,
      'carrying_costs'=>$carrying,
      'borrower_equity'=>$cashNeeded,
      'total_cash_in_deal'=>$cashNeeded,
      'selling_costs'=>$sellCost,
    ],
  ];
}
