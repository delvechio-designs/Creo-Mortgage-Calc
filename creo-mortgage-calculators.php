<?php
/**
 * Plugin Name: Creo Mortgage Calculators
 * Description: Full suite of mortgage calculators with admin tabs and a + tab creator. Frontend UI matches provided visuals.
 * Version: 1.0.0
 * Author: Delvechio Designs
 * License: GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'CREO_MC_VER', '1.0.0' );
define( 'CREO_MC_DIR', plugin_dir_path( __FILE__ ) );
define( 'CREO_MC_URL', plugin_dir_url( __FILE__ ) );
define( 'CREO_MC_OPT_TABS', 'creo_mc_tabs' );         // all tabs structure and data
define( 'CREO_MC_OPT_THEME', 'creo_mc_theme' );       // global brand colors if needed

require_once CREO_MC_DIR . 'includes/helpers.php';
require_once CREO_MC_DIR . 'includes/schemas.php';
require_once CREO_MC_DIR . 'includes/class-admin.php';
require_once CREO_MC_DIR . 'includes/class-frontend.php';
require_once CREO_MC_DIR . 'includes/class-rest.php';

add_action( 'plugins_loaded', function () {
  new Creo_MC_Admin();
  new Creo_MC_Frontend();
  new Creo_MC_Rest();
} );
