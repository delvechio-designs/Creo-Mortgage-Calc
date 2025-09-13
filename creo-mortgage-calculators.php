<?php
/**
 * Plugin Name: Creo Mortgage Calculators
 * Description: Full suite of mortgage calculators with admin tabs and a + tab creator. Frontend UI matches provided visuals.
 * Version: 1.0.0
 * Author: Delvechio Designs
 * License: GPL-2.0+
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* hard requirements */
if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
  add_action('admin_notices', function () {
    echo '<div class="notice notice-error"><p><strong>Creo Mortgage Calculators</strong> requires PHP 7.4 or newer. Current version: '
         . esc_html( PHP_VERSION ) . '</p></div>';
  });
  return;
}

define( 'CREO_MC_VER', '1.0.0' );
define( 'CREO_MC_DIR', plugin_dir_path( __FILE__ ) );
define( 'CREO_MC_URL', plugin_dir_url( __FILE__ ) );
define( 'CREO_MC_OPT_TABS',  'creo_mc_tabs' );
define( 'CREO_MC_OPT_THEME', 'creo_mc_theme' );

/* safe includes with file existence checks so activation never fatals */
$need = [
  CREO_MC_DIR . 'includes/helpers.php',
  CREO_MC_DIR . 'includes/schemas.php',
  CREO_MC_DIR . 'includes/class-admin.php',
  CREO_MC_DIR . 'includes/class-frontend.php',
  CREO_MC_DIR . 'includes/class-rest.php',
];

foreach ( $need as $file ) {
  if ( ! file_exists( $file ) ) {
    add_action('admin_notices', function () use ( $file ) {
      echo '<div class="notice notice-error"><p><strong>Creo Mortgage Calculators</strong> missing file: '
           . esc_html( str_replace( ABSPATH, '', $file ) ) . '</p></div>';
    });
    return;
  }
  require_once $file;
}

/* seed defaults on activation if nothing stored yet */
register_activation_hook( __FILE__, function () {
  if ( ! get_option( CREO_MC_OPT_TABS ) ) {
    if ( ! function_exists( 'creo_mc_seed_tabs' ) ) {
      require_once CREO_MC_DIR . 'includes/schemas.php';
    }
    update_option( CREO_MC_OPT_TABS, creo_mc_seed_tabs() );
  }
});

/* boot */
add_action( 'plugins_loaded', function () {
  new Creo_MC_Admin();
  new Creo_MC_Frontend();
  new Creo_MC_Rest();
});
