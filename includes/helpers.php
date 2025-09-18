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

function creo_mc_normalize_metric_value( $value ) {
  if ( is_object( $value ) ) {
    $value = (array) $value;
  }

  if ( is_array( $value ) ) {
    $candidates = [ 'value', 'yearly_change', 'yearlyChange', 'rate', 'amount' ];
    foreach ( $candidates as $key ) {
      if ( array_key_exists( $key, $value ) ) {
        return creo_mc_normalize_metric_value( $value[ $key ] );
      }
    }
    return '';
  }

  if ( is_numeric( $value ) ) {
    return 0 + $value;
  }

  if ( is_string( $value ) ) {
    return sanitize_text_field( $value );
  }

  return '';
}

function creo_mc_get_live_metrics() {
  $stored  = get_option( 'creo_mc_yearly_change', '' );
  $payload = [ 'yearly_change' => $stored ];

  $filtered = apply_filters( 'creo_mc_live_metrics', $payload, $stored );
  if ( is_array( $filtered ) ) {
    $payload = array_merge( $payload, $filtered );
  }

  $value = isset( $payload['yearly_change'] ) ? $payload['yearly_change'] : $stored;
  $payload['yearly_change'] = creo_mc_normalize_metric_value( $value );

  return $payload;
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
