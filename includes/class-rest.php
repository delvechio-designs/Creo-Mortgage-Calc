<?php
if ( ! defined( 'ABSPATH' ) ) exit;

require_once CREO_MC_DIR.'includes/calculators/affordability.php';
require_once CREO_MC_DIR.'includes/calculators/purchase.php';
require_once CREO_MC_DIR.'includes/calculators/refinance.php';
require_once CREO_MC_DIR.'includes/calculators/rentbuy.php';
require_once CREO_MC_DIR.'includes/calculators/va-purchase.php';
require_once CREO_MC_DIR.'includes/calculators/va-refinance.php';
require_once CREO_MC_DIR.'includes/calculators/dscr.php';
require_once CREO_MC_DIR.'includes/calculators/fixflip.php';

class Creo_MC_Rest {
  public function __construct() {
    add_action( 'rest_api_init', [ $this, 'routes' ] );
  }
  public function routes() {
    register_rest_route( 'creo-mc/v1', '/calc/(?P<type>[a-z_\-]+)', [
      'methods'  => 'POST',
      'permission_callback' => '__return_true',
      'callback' => [ $this, 'calculate' ],
    ] );
  }
  public function calculate( WP_REST_Request $req ) {
    $type = sanitize_key( $req['type'] );
    $data = $req->get_json_params();
    switch ( $type ) {
      case 'purchase':     $out = creo_calc_purchase($data); break;
      case 'affordability':$out = creo_calc_affordability($data); break;
      case 'refinance':    $out = creo_calc_refinance($data); break;
      case 'rentbuy':      $out = creo_calc_rentbuy($data); break;
      case 'va_purchase':  $out = creo_calc_va_purchase($data); break;
      case 'va_refinance': $out = creo_calc_va_refinance($data); break;
      case 'dscr':         $out = creo_calc_dscr($data); break;
      case 'fixflip':      $out = creo_calc_fixflip($data); break;
      default: return new WP_Error('bad_type','Unknown calculator');
    }
    return rest_ensure_response($out);
  }
}
