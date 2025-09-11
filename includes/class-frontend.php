<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Creo_MC_Frontend {
  public function __construct() {
    add_shortcode( 'creo_calculators', [ $this, 'shortcode' ] );
    add_action( 'wp_enqueue_scripts', [ $this, 'assets' ] );
  }

  public function assets() {
    wp_register_style( 'creo-mc-frontend', CREO_MC_URL.'assets/css/frontend.css', [], CREO_MC_VER );
    wp_register_script( 'creo-mc-donut', CREO_MC_URL.'assets/js/donut.js', [], CREO_MC_VER, true );
    wp_register_script( 'creo-mc-frontend', CREO_MC_URL.'assets/js/frontend.js', [], CREO_MC_VER, true );

    $tabs = creo_mc_get_tabs();
    wp_localize_script( 'creo-mc-frontend', 'CREO_MC', [
      'tabs'     => $tabs,
      'restRoot' => esc_url_raw( rest_url( 'creo-mc/v1' ) ),
      'nonce'    => wp_create_nonce( 'wp_rest' ),
    ] );
  }

  public function shortcode( $atts = [] ) {
    wp_enqueue_style( 'creo-mc-frontend' );
    wp_enqueue_script( 'creo-mc-donut' );
    wp_enqueue_script( 'creo-mc-frontend' );

    $tabs = creo_mc_get_tabs();
    ob_start();
    include CREO_MC_DIR.'templates/frontend.php';
    return ob_get_clean();
  }
}
