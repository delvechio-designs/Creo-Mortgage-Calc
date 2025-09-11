<?php
if ( ! defined( 'ABSPATH' ) ) exit;
$tabs = array_filter( $tabs, fn($k)=>$k!=='_theme', ARRAY_FILTER_USE_KEY );
?>
<div class="creo-calcs">
  <div class="creo-calcs-nav">
    <?php foreach ($tabs as $id=>$tab): ?>
      <button class="creo-nav-btn" data-tab="<?php echo esc_attr($id); ?>"><?php echo esc_html($tab['label']); ?></button>
    <?php endforeach; ?>
  </div>

  <?php foreach ($tabs as $id=>$tab): ?>
    <section class="creo-calc" data-pane="<?php echo esc_attr($id); ?>" hidden>
      <div class="creo-grid">
        <aside class="creo-panel">
          <form class="creo-form" data-type="<?php echo esc_attr($tab['type']); ?>">
            <!-- inputs are built by JS based on stored schema values so the same template can serve all types -->
            <div class="creo-inputs"></div>
            <button type="button" class="creo-cta"><?php echo esc_html($tab['data']['btn_text'] ?? 'GET A QUOTE'); ?></button>
          </form>
        </aside>

        <main class="creo-results">
          <div class="creo-kpis"></div>
          <div class="creo-cards">
            <div class="creo-card">
              <div class="creo-card-h">
                <h3><?php echo esc_html( $tab['data']['pay_title'] ?? 'Payment Breakdown'); ?></h3>
                <span class="tip" data-tip="<?php echo esc_attr( $tab['data']['pay_info'] ?? 'A breakdown of your total payment so you can see where money is allocated.'); ?>">i</span>
              </div>
              <div class="creo-flex">
                <canvas class="creo-donut" width="240" height="240"></canvas>
                <div class="creo-legend"></div>
              </div>
              <div class="creo-split">
                <div class="creo-stack" data-role="monthly"></div>
                <div class="creo-stack" data-role="total"></div>
              </div>
            </div>

            <div class="creo-card" data-role="early">
              <div class="creo-card-h">
                <h3><?php echo esc_html( $tab['data']['early_title'] ?? 'Early Payoff Strategy'); ?></h3>
                <span class="tip" data-tip="<?php echo esc_attr( $tab['data']['early_info'] ?? 'Add an extra payment and see how many months you can eliminate on the back end of the loan.'); ?>">i</span>
              </div>
              <div class="creo-form-inline">
                <input type="number" step="1" min="0" value="0" data-ctl="early-extra">
                <div class="creo-pill-group" data-ctl="early-frequency">
                  <button data-v="monthly" class="is-active">Monthly</button>
                  <button data-v="bi">Bi weekly</button>
                  <button data-v="weekly">Weekly</button>
                </div>
              </div>
              <div class="creo-early-out"></div>
            </div>

            <div class="creo-card" data-role="lump">
              <div class="creo-card-h">
                <h3><?php echo esc_html( $tab['data']['lump_title'] ?? 'Lump Sum Payment'); ?></h3>
                <span class="tip" data-tip="<?php echo esc_attr( $tab['data']['lump_info'] ?? 'Shorten your loan term by paying a lump sum all to principal.'); ?>">i</span>
              </div>
              <div class="creo-form-inline">
                <input type="number" step="100" min="0" value="0" data-ctl="lump-sum">
                <div class="creo-pill-group" data-ctl="lump-frequency">
                  <button data-v="one" class="is-active">One time</button>
                  <button data-v="yearly">Yearly</button>
                  <button data-v="quarterly">Quarterly</button>
                </div>
              </div>
              <div class="creo-lump-out"></div>
            </div>

            <!-- DSCR, Fix & Flip, Refi comparison blocks will be dynamically injected by JS for the matching tab type -->
            <div class="creo-dynamic"></div>
          </div>

          <p class="creo-disclaimer">
            Results received from this calculator are designed for comparative purposes only, and accuracy is not guaranteed.
            We do not guarantee the accuracy of any information or inputs by users of the software.
          </p>
        </main>
      </div>
    </section>
  <?php endforeach; ?>
</div>
