<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) exit;
delete_option( CREO_MC_OPT_TABS );
delete_option( CREO_MC_OPT_THEME );
