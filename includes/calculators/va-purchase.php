<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * VA funding fee helper
 * $tbl keys: first_less5, first_5plus, first_10plus, after_less5, after_5plus, after_10plus
 */
if ( ! function_exists( 'creo_va_fee' ) ) {
  function creo_va_fee( $downPct, $firstUse = true, $tbl = [] ) {
    $pct = 0;
    if ( $firstUse ) {
      if ( $downPct >= 10 )      $pct = floatval( $tbl['first_10plus'] ?? 1.25 );
      elseif ( $downPct >= 5 )   $pct = floatval( $tbl['first_5plus'] ?? 1.5 );
      else                       $pct = floatval( $tbl['first_less5'] ?? 2.15 );
    } else {
      if ( $downPct >= 10 )      $pct = floatval( $tbl['after_10plus'] ?? 1.25 );
      elseif ( $downPct >= 5 )   $pct = floatval( $tbl['after_5plus'] ?? 1.5 );
      else                       $pct = floatval( $tbl['after_less5'] ?? 3.3 );
    }
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

function creo_calc_va_purchase( $d ) {
  $home   = floatval( $d['home_value'] ?? 200000 );
  $down   = floatval( $d['down_payment'] ?? 0 );
  $loan   = max( 0.01, floatval( $d['base_amount'] ?? ( $home - $down ) ) );
  $rate   = floatval( $d['interest_rate'] ?? 6.5 );
  $years  = intval( $d['loan_terms'] ?? 30 );

  $downPct  = $home > 0 ? ( $down / $home ) * 100 : 0;
  $firstUse = isset( $d['first_use'] ) ? (bool) $d['first_use'] : true;

  $feePct = creo_va_fee( $downPct, $firstUse, $d['fee'] ?? [] );
  $feeAmt = $loan * $feePct;
  $loanWithFee = $loan + $feeAmt;

  $piM = creo_amort_payment( $loanWithFee, $rate, $years );
  $totalMonths = $years * 12;
  $totalPaid   = $piM * $totalMonths;
  $interestTot = $totalPaid - $loanWithFee;

  return [
    'kpis' => [
      [ 'label' => 'All Payment',         'value' => $totalPaid ],
      [ 'label' => 'Total Loan Amount',   'value' => $loanWithFee ],
      [ 'label' => 'Total Interest Paid', 'value' => $interestTot ],
    ],
    'fee' => [
      'pct'    => $feePct,
      'amount' => $feeAmt,
      'first'  => $firstUse ? 1 : 0,
    ],
  ];
}
