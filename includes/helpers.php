<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function creo_mc_get_tabs() {
  $tabs = get_option( CREO_MC_OPT_TABS );
  if ( ! is_array( $tabs ) ) {
    $tabs = creo_mc_seed_tabs(); // from schemas.php
    update_option( CREO_MC_OPT_TABS, $tabs );
  }
  return $tabs;
}

function creo_mc_update_tabs( $tabs ) {
  update_option( CREO_MC_OPT_TABS, $tabs );
}

function creo_mc_color( $tabs, $key, $fallback ) {
  return isset( $tabs['_theme'][ $key ] ) ? $tabs['_theme'][ $key ] : $fallback;
}
