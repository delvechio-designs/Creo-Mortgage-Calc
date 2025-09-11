<?php
if ( ! defined( 'ABSPATH' ) ) exit;
$schemas = creo_mc_schema_registry();
?>
<div class="wrap creo-admin">
  <h1>Digital Calculator Settings</h1>

  <div class="creo-tabs">
    <?php foreach ($tabs as $id => $tab) :
      if ($id === '_theme') continue;
      $active_class = ($id===$active)?' is-active':'';
      $url = admin_url('admin.php?page=creo-mc&tab='.$id);
    ?>
      <a class="creo-tab<?php echo esc_attr($active_class); ?>" href="<?php echo esc_url($url); ?>" data-id="<?php echo esc_attr($id); ?>">
        <span class="label"><?php echo esc_html($tab['label']); ?></span>
        <button type="button" class="rename" title="Rename" data-id="<?php echo esc_attr($id); ?>">✎</button>
        <button type="button" class="delete" title="Remove" data-id="<?php echo esc_attr($id); ?>">×</button>
      </a>
    <?php endforeach; ?>
    <button id="creo-add-tab" class="creo-tab add" type="button"><span>+ New Tab</span></button>
  </div>

  <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="creo-form">
    <?php wp_nonce_field('creo-mc-save'); ?>
    <input type="hidden" name="action" value="creo_mc_save">

    <?php
      foreach ($tabs as $id=>$tab) {
        if ($id==='_theme') continue;
        if ($id!==$active) continue;
        $schema = $schemas[ $tab['type'] ] ?? null;
        if ( ! $schema ) continue;
    ?>
      <div class="creo-panel">
        <?php foreach ($schema['groups'] as $group_id => $group) : ?>
          <div class="creo-group">
            <h2><?php echo esc_html($group['title']); ?></h2>
            <div class="creo-fields">
              <?php foreach ($group['fields'] as $fid => $field) :
                $name = "tabs[$id][data][$fid]";
                $value = $tab['data'][$fid] ?? $field['default'] ?? '';
                $type = $field['type'];
              ?>
                <label class="creo-field">
                  <span class="creo-field-label"><?php echo esc_html($field['label']); ?></span>
                  <?php if ($type==='toggle') : ?>
                    <span class="creo-toggle">
                      <input type="radio" name="<?php echo esc_attr($name); ?>" value="1" <?php checked($value,'1'); ?>> Yes
                      <input type="radio" name="<?php echo esc_attr($name); ?>" value="0" <?php checked($value,'0'); ?>> No
                    </span>
                  <?php elseif ($type==='color') : ?>
                    <input type="text" class="regular-text creo-color" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>">
                  <?php else : ?>
                    <input type="<?php echo esc_attr($type); ?>" step="<?php echo esc_attr($field['step'] ?? 'any'); ?>" class="regular-text" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>">
                  <?php endif; ?>
                  <?php if (!empty($field['help'])): ?><small class="description"><?php echo esc_html($field['help']); ?></small><?php endif; ?>
                </label>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php } ?>

    <p class="submit">
      <button class="button button-primary" type="submit">Submit</button>
    </p>
  </form>
</div>
