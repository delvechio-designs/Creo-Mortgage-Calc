<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Frontend shell for Creo Mortgage Calculators
 * Left: dark form panel
 * Right: two row results layout for all calculators
 */

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
    <section class="creo-calc"<?php echo $first ? '' : ' hidden'; ?> data-pane="<?php echo esc_attr($id); ?>">
      <div class="creo-grid">
        <!-- LEFT: dark form panel with two column inputs -->
        <aside class="creo-left">
          <form class="creo-form" data-type="<?php echo esc_attr($tab['type']); ?>">
            <div class="creo-panel-h">
              <h3 class="creo-panel-title"><?php echo esc_html(($tab['label'] ?? ucfirst($tab['type'])) . ' Calculator'); ?></h3>
            </div>
            <div class="creo-inputs"><!-- JS fills fields --></div>
            <button type="button" class="creo-cta"><?php echo esc_html($tabs['_theme']['cta'] ?? 'GET A QUOTE'); ?></button>
          </form>
        </aside>

        <!-- RIGHT: fixed two row results layout -->
        <section class="creo-right">
          <!-- Row 1 -->
          <div class="creo-row row-one">
            <div class="creo-card chart-card">
              <div class="creo-card-h"><h3>Payment Breakdown</h3></div>
              <div class="creo-donut"></div>
              <div class="creo-legend"></div>
            </div>
            <div class="kpi-stack" aria-label="Key metrics"><!-- JS --></div>
          </div>

          <!-- Row 2 -->
          <div class="creo-row row-two">
            <div class="creo-card details-card">
              <div class="creo-card-h"><h3>Loan Details</h3></div>
              <div class="creo-slab" data-role="monthly"><!-- JS --></div>
            </div>

            <div class="rightcol">
              <div class="creo-card controls-card" data-role="controls"><!-- JS --></div>
              <div class="creo-card summary-card">
                <div class="creo-card-h"><h3>Summary</h3></div>
                <div class="creo-summary">
                  Results received from this calculator are for comparison only. Accuracy is not guaranteed. Confirm numbers with your loan officer.
                </div>
              </div>
            </div>
          </div>

          <p class="creo-disclaimer">
            Results received from this calculator are designed for comparative purposes only. Information such as rates, taxes, insurance and dues are estimates and should be used for comparison only.
          </p>
        </section>
      </div>
    </section>
  <?php $first = false; endforeach; ?>
</div>
