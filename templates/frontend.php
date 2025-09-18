<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// fetch enabled tabs in saved order
$tabs = get_option('creo_mc_tabs');
if (!is_array($tabs)) { $tabs = []; }
$enabled = [];
foreach ($tabs as $id => $t) {
  if (substr($id,0,1)==='_') { continue; }
  if (!empty($t['enabled'])) { $enabled[$id] = $t; }
}
?>
<div class="creo-wrap">
  <div class="creo-calcs-nav" role="tablist" aria-label="Calculator Tabs">
    <?php $first = true; foreach ($enabled as $id => $tab): ?>
      <button class="creo-nav-btn<?php echo $first ? ' is-active' : ''; ?>" role="tab" data-tab="<?php echo esc_attr($id); ?>">
        <?php echo esc_html($tab['label'] ?? ucfirst($tab['type'])); ?>
      </button>
    <?php $first = false; endforeach; ?>
  </div>

  <?php $first = true; foreach ($enabled as $id => $tab): ?>
    <section class="creo-calc creo-type-<?php echo esc_attr($tab['type']); ?>"<?php echo $first ? '' : ' hidden'; ?> data-pane="<?php echo esc_attr($id); ?>">
      <div class="creo-grid">
        <!-- LEFT: dark form panel with two column inputs -->
        <aside class="creo-left">
          <form class="creo-form" data-type="<?php echo esc_attr($tab['type']); ?>">
            <div class="creo-panel-h">
              <?php
                $label = $tab['label'] ?? ucfirst($tab['type']);
                $title = stripos($label,'calculator') !== false ? $label : ($label.' Calculator');
              ?>
              <h3 class="creo-panel-title"><?php echo esc_html($title); ?></h3>
              
            </div>
            <div class="creo-inputs"><!-- JS fills fields --></div>
            <button type="button" class="creo-cta"><?php echo esc_html($tabs['_theme']['cta'] ?? 'GET A QUOTE'); ?></button>
          </form>
        </aside>

        <!-- RIGHT: fixed two row results layout -->
        <section class="creo-right" data-type="<?php echo esc_attr($tab['type']); ?>">
          <div class="creo-row row-one" data-role="row1"></div>
          <div class="creo-row row-two" data-role="row2"></div>
          <div class="creo-row row-three" data-role="row3"></div>
          <div class="creo-row row-four" data-role="row4"></div>
          <div class="creo-row row-five" data-role="row5"></div>
          <div class="creo-row row-six" data-role="row6"></div>
        </section>
      </div>
    </section>
  <?php $first = false; endforeach; ?>
</div>
