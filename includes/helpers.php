<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_mc_get_tabs() {
  $tabs = get_option( 'creo_mc_tabs' );
  if ( ! is_array( $tabs ) ) {
    $tabs = creo_mc_seed_tabs();
    update_option( 'creo_mc_tabs', $tabs );
  }
  return $tabs;
}

function creo_mc_update_tabs( $tabs ) {
  update_option( 'creo_mc_tabs', $tabs );
}

function creo_mc_color( $tabs, $key, $fallback ) {
  return isset( $tabs['_theme'][ $key ] ) ? $tabs['_theme'][ $key ] : $fallback;
}

/* central amortization helper used by all calculators */
if ( ! function_exists( 'creo_amort_payment' ) ) {
  function creo_amort_payment( $principal, $annual_rate, $years ) {
    $i = ($annual_rate/100)/12;
    $n = max(1, $years*12);
    if ( $i == 0 ) return $principal / $n;
    return $principal * ( $i * pow(1+$i,$n) ) / ( pow(1+$i,$n) - 1 );
  }
}
