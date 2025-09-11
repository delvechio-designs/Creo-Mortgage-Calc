<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/** Pull tabs from your stored options */
$tabs = is_array( get_option('creo_mc_tabs') ) ? get_option('creo_mc_tabs') : [];
if ( empty($tabs) && function_exists('creo_mc_seed_tabs') ) {
  $tabs = creo_mc_seed_tabs();
  update_option('creo_mc_tabs', $tabs);
}

/** Prepare a simple ordered list of visible calc tabs */
$ordered = [];
foreach ($tabs as $key => $tab) {
  if (substr($key,0,1)==='_') continue;
  if (!is_array($tab) || empty($tab['enabled'])) continue;
  $ordered[$key] = $tab;
}
?>
<div class="creo-wrap">
  <div class="creo-calcs-nav" role="tablist" aria-label="Calculator Tabs">
    <?php $first = true; foreach ($ordered as $id => $t): ?>
      <button class="creo-nav-btn<?php echo $first?' is-active':''; ?>"
              role="tab"
              data-tab="<?php echo esc_attr($id); ?>">
        <?php echo esc_html($t['label'] ?? ucfirst($t['type'])); ?>
      </button>
    <?php $first = false; endforeach; ?>
  </div>

  <?php $first = true; foreach ($ordered as $id => $t): ?>
    <section class="creo-calc"<?php echo $first?'':' hidden'; ?>
             data-pane="<?php echo esc_attr($id); ?>">
      <div class="creo-grid">
        <aside class="creo-left">
          <form class="creo-form" data-type="<?php echo esc_attr($t['type']); ?>">
            <div class="creo-panel-h">
              <h3 class="creo-panel-title">
                <?php echo esc_html($t['label'] ?? ucfirst($t['type']).' Calculator'); ?>
              </h3>
              <div class="creo-panel-tabs">
                <!-- Slot for inner program toggles if you add them later -->
              </div>
            </div>
            <div class="creo-inputs"><!-- JS builds inputs here --></div>
            <button type="button" class="creo-cta"><?php echo esc_html( $tabs['_theme']['cta'] ?? 'GET A QUOTE' ); ?></button>
          </form>
        </aside>

        <section class="creo-right">
          <div class="creo-row kpis">
            <div class="creo-kpis"><!-- JS fills KPI tiles --></div>
          </div>

          <div class="creo-row charts">
            <div class="creo-card">
              <div class="creo-card-h"><h3>Payment Breakdown</h3></div>
              <div class="creo-donut" aria-label="Payment breakdown chart"></div>
              <div class="creo-legend"></div>
            </div>
            <div class="creo-card">
              <div class="creo-card-h"><h3>Loan Details</h3></div>
              <div class="creo-slab" data-role="monthly"><!-- JS fills --></div>
            </div>
          </div>

          <div class="creo-row details">
            <div class="creo-card">
              <div class="creo-card-h"><h3>Total</h3></div>
              <div class="creo-slab" data-role="total"><!-- JS fills --></div>
            </div>
            <div class="creo-card">
              <div class="creo-card-h"><h3>Summary</h3></div>
              <div class="creo-summary">
                Results received from this calculator are for comparison only. We do not guarantee accuracy. Confirm all numbers with your loan officer.
              </div>
            </div>
          </div>

          <div class="creo-row dynamic">
            <div class="creo-dynamic"><!-- JS inserts type specific cards here --></div>
          </div>

          <p class="creo-disclaimer">
            Results received from this calculator are designed for comparative purposes only, and accuracy is not guaranteed. Information such as interest rates, taxes, insurance, PMI payments, or dues are estimates and should be used for comparison only.
          </p>
        </section>
      </div>
    </section>
  <?php $first = false; endforeach; ?>
</div>
