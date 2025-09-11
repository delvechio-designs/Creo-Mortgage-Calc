<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Creo_MC_Admin {
  public function __construct() {
    add_action( 'admin_menu', [ $this, 'menu' ] );
    add_action( 'admin_enqueue_scripts', [ $this, 'assets' ] );
    add_action( 'admin_post_creo_mc_save', [ $this, 'save' ] );
    add_action( 'wp_ajax_creo_mc_add_tab', [ $this, 'ajax_add_tab' ] );
    add_action( 'wp_ajax_creo_mc_rename_tab', [ $this, 'ajax_rename_tab' ] );
    add_action( 'wp_ajax_creo_mc_delete_tab', [ $this, 'ajax_delete_tab' ] );
  }

  public function menu() {
    add_menu_page('Calculator','Calculator','manage_options','creo-mc',[$this,'page'],'dashicons-calculator',58);
  }

  public function assets( $hook ) {
    if ( $hook !== 'toplevel_page_creo-mc' ) return;
    wp_enqueue_style( 'creo-mc-admin', CREO_MC_URL.'assets/css/admin.css',[],CREO_MC_VER );
    wp_enqueue_script('creo-mc-admin',CREO_MC_URL.'assets/js/admin.js',['jquery'],CREO_MC_VER,true);
    wp_localize_script('creo-mc-admin','CREO_MC_ADMIN',[
      'nonce'=>wp_create_nonce('creo-mc'),
      'ajax'=>admin_url('admin-ajax.php'),
      'schemas'=>creo_mc_schema_registry(),
    ]);
  }

  public function page() {
    $tabs = creo_mc_get_tabs();
    $active = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : array_key_first($tabs);
    if (!isset($tabs[$active])) $active = array_key_first($tabs);
    include CREO_MC_DIR.'templates/admin-page.php';
  }

  public function save() {
    if ( ! current_user_can('manage_options') ) wp_die();
    check_admin_referer('creo-mc-save');

    $tabs = creo_mc_get_tabs();
    $schemas = creo_mc_schema_registry();

    // Save posted tab data
    if ( isset($_POST['tabs']) && is_array($_POST['tabs']) ) {
      foreach ($_POST['tabs'] as $tab_id => $blob) {
        if ( ! isset($tabs[$tab_id]) ) continue;
        $type = sanitize_key($tabs[$tab_id]['type']);
        $schema = $schemas[$type] ?? null;
        if ( ! $schema ) continue;

        $incoming = $blob['data'] ?? [];
        $clean = [];
        foreach ($schema['groups'] as $g) {
          foreach ($g['fields'] as $fid => $field) {
            $raw = $incoming[$fid] ?? '';
            $val = $field['type']==='number' ? (is_numeric($raw)?0+$raw:'') : sanitize_text_field($raw);
            if ($field['type']==='toggle') $val = $raw==='1' ? '1' : '0';
            $clean[$fid] = $val;
          }
        }
        $tabs[$tab_id]['data'] = $clean;
      }
    }

    // Optional theme save
    if ( isset($_POST['_theme']) && is_array($_POST['_theme']) ) {
      foreach($_POST['_theme'] as $k=>$v) {
        $tabs['_theme'][$k] = sanitize_text_field($v);
      }
    }

    creo_mc_update_tabs($tabs);
    wp_safe_redirect( admin_url('admin.php?page=creo-mc&saved=1') );
    exit;
  }

  public function ajax_add_tab() {
    check_ajax_referer('creo-mc','nonce');
    if ( ! current_user_can('manage_options') ) wp_send_json_error();

    $label = sanitize_text_field($_POST['label'] ?? 'New Tab');
    $type  = sanitize_key($_POST['type'] ?? 'purchase');

    $tabs = creo_mc_get_tabs();
    $id = sanitize_key( uniqid('tab_', true) );
    $tabs[$id] = ['label'=>$label,'type'=>$type,'enabled'=>true,'data'=>[]];
    creo_mc_update_tabs($tabs);
    wp_send_json_success(['id'=>$id,'label'=>$label,'type'=>$type]);
  }

  public function ajax_rename_tab() {
    check_ajax_referer('creo-mc','nonce');
    if ( ! current_user_can('manage_options') ) wp_send_json_error();
    $id = sanitize_key($_POST['id']??'');
    $label = sanitize_text_field($_POST['label']??'');
    $tabs = creo_mc_get_tabs();
    if ($id && $label && isset($tabs[$id])) {
      $tabs[$id]['label'] = $label;
      creo_mc_update_tabs($tabs);
      wp_send_json_success();
    }
    wp_send_json_error();
  }

  public function ajax_delete_tab() {
    check_ajax_referer('creo-mc','nonce');
    if ( ! current_user_can('manage_options') ) wp_send_json_error();
    $id = sanitize_key($_POST['id']??'');
    $tabs = creo_mc_get_tabs();
    if ($id && isset($tabs[$id])) {
      unset($tabs[$id]);
      creo_mc_update_tabs($tabs);
      wp_send_json_success();
    }
    wp_send_json_error();
  }
}
