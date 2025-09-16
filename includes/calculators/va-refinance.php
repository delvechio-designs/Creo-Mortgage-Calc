<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * VA Refinance calculator
 * Accepts fee table keys:
 *   first_use, after_first, irrrl or irrrl_redux
 * Flags:
 *   first_use (bool), is_irrrl (bool)
 */
if ( ! function_exists( 'creo_va_fee' ) ) {
  function creo_va_fee( $downPct, $firstUse = true, $tbl = [] ) {
    $pct = $firstUse ? floatval( $tbl['first_use'] ?? 2.15 ) : floatval( $tbl['after_first'] ?? 3.3 );
    return $pct / 100.0;
  }
}

/** amortization helper is defined in purchase.php */
if ( ! function_exists( 'creo_amort_payment' ) ) {
  function creo_amort_payment($principal,$annual_rate,$years){
    $i = ($annual_rate/100)/12;
    $n = max(1, $years*12);
    if ($i==0) return $principal/$n;
    return $principal * ($i * pow(1+$i,$n)) / (pow(1+$i,$n) - 1);
  }
}

function creo_calc_va_refinance( $d ) {
  // current loan snapshot
  $origAmt  = floatval( $d['orig_amount'] ?? 300000 );
  $origRate = floatval( $d['orig_rate'] ?? 5 );
  $origTerm = intval( $d['orig_term'] ?? 30 );

  // new loan inputs
  $balance  = floatval( $d['balance'] ?? 250000 );
  $cashOut  = floatval( $d['cash_out'] ?? 0 );
  $costs    = floatval( $d['costs'] ?? 1000 );
  $newRate  = floatval( $d['rate'] ?? 3 );
  $newTerm  = intval( $d['term'] ?? 15 );

  // funding fee logic
  $feeTbl   = $d['fee'] ?? [];
  $firstUse = isset( $d['first_use'] ) ? (bool) $d['first_use'] : true;
  $isIRRRL  = ! empty( $d['is_irrrl'] );

  if ( $isIRRRL ) {
    $irrrlPct = floatval( $feeTbl['irrrl'] ?? $feeTbl['irrrl_redux'] ?? 0.5 ) / 100.0;
    $feePct   = $irrrlPct;
  } else {
    $feePct = $firstUse ? floatval( $feeTbl['first_use'] ?? 2.15 ) / 100.0
                        : floatval( $feeTbl['after_first'] ?? 3.3 ) / 100.0;
  }

  $baseNew   = $balance + $cashOut + $costs;
  $feeAmt    = $baseNew * $feePct;
  $loanNew   = $baseNew + $feeAmt;

  // payments
  $piCurrent = creo_amort_payment( $origAmt, $origRate, $origTerm );
  $piNew     = creo_amort_payment( $loanNew, $newRate, $newTerm );
  $diffM     = $piNew - $piCurrent;

  $interestCurrent = $piCurrent * ( $origTerm * 12 ) - $origAmt;
  $interestNew     = $piNew * ( $newTerm * 12 ) - $loanNew;

  // simple recoup months if saving
  $savingsM = max( 0, $piCurrent - $piNew );
  $recoupMonths = $savingsM > 0 ? ceil( $costs / $savingsM ) : 0;

  return [
    'kpis' => [
      [ 'label' => 'Monthly Payment Increase',   'value' => $diffM ],
      [ 'label' => 'Total Interest Difference',  'value' => $interestNew - $interestCurrent ],
      [ 'label' => 'Refinance Costs',            'value' => $costs ],
      [ 'label' => 'Time to Recoup Fees',        'value' => $recoupMonths ],
    ],
    'compare' => [
      'current'  => $piCurrent,
      'new'      => $piNew,
      'diff'     => $diffM,
      'interest' => [
        'current' => $interestCurrent,
        'new'     => $interestNew,
        'diff'    => $interestNew - $interestCurrent,
      ],
    ],
    'monthlyBreak' => [
      [ 'label' => 'Current Monthly Payment', 'v' => $piCurrent ],
      [ 'label' => 'New Monthly Payment',     'v' => $piNew ],
      [ 'label' => 'Monthly Payment Difference', 'v' => $diffM ],
      [ 'label' => 'Cash Out Amount',         'v' => $cashOut ],
      [ 'label' => 'Refinance Costs',         'v' => $costs ],
    ],
    'fee' => [
      'pct'    => $feePct,
      'amount' => $feeAmt,
      'irrrl'  => $isIRRRL ? 1 : 0,
    ],
    'costs'      => $costs,
    'rate'       => $newRate,
    'term'       => $newTerm,
    'cash_out'   => $cashOut,
    'recoup_time'=> $recoupMonths,
  ];
}
