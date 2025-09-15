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

  $taxY = floatval( $d['tax_yearly'] ?? $d['property_tax'] ?? 1200 );
  $insY = floatval( $d['ins_yearly'] ?? 1200 );
  $hoaM = floatval( $d['hoa_month'] ?? 0 );

  $downPct  = $home > 0 ? ( $down / $home ) * 100 : 0;
  $firstUse = isset( $d['first_use'] ) ? (bool) $d['first_use'] : true;

  $feePct = creo_va_fee( $downPct, $firstUse, $d['fee'] ?? [] );
  $feeAmt = $loan * $feePct;
  $loanWithFee = $loan + $feeAmt;

  $piM = creo_amort_payment( $loanWithFee, $rate, $years );
  $taxM = $taxY / 12.0;
  $insM = $insY / 12.0;
  $hoa  = $hoaM;

  $totalMonthly = $piM + $taxM + $insM + $hoa;
  $totalMonths = $years * 12;
  $totalPaid   = $totalMonthly * $totalMonths;
  $interestTot = $piM * $totalMonths - $loanWithFee;

  return [
    'kpis' => [
      [ 'label' => 'All Payment',         'value' => $totalPaid ],
      [ 'label' => 'Total Loan Amount',   'value' => $loanWithFee ],
      [ 'label' => 'Total Interest Paid', 'value' => $interestTot ],
    ],
    'donut' => [
      'monthly' => [
        [ 'label' => 'Principal & interest', 'v' => round( $piM, 2 ) ],
        [ 'label' => 'Taxes',                'v' => round( $taxM, 2 ) ],
        [ 'label' => 'Insurance',            'v' => round( $insM, 2 ) ],
        [ 'label' => 'HOA Dues',             'v' => round( $hoa, 2 ) ],
      ],
      'colors'=>['#f59e0b','#22c55e','#fbbf24','#60a5fa'],
    ],
    'monthlyBreak' => [
      [ 'label' => 'Home Value',             'v' => $home ],
      [ 'label' => 'Base Mortgage Amount',   'v' => $loan ],
      [ 'label' => 'VA Funding Fee',         'v' => $feeAmt ],
      [ 'label' => 'Total Loan Amount',      'v' => $loanWithFee ],
      [ 'label' => 'Monthly Principal & interest', 'v' => $piM ],
      [ 'label' => 'Monthly Property Tax',   'v' => $taxM ],
      [ 'label' => 'Monthly Home Insurance', 'v' => $insM ],
      [ 'label' => 'Monthly HOA Fee',        'v' => $hoa ],
    ],
    'fee' => [
      'pct'    => $feePct,
      'amount' => $feeAmt,
      'first'  => $firstUse ? 1 : 0,
    ],
  ];
}
