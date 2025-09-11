(function($){
    const ajax = CREO_MC_ADMIN.ajax;
    const nonce = CREO_MC_ADMIN.nonce;
  
    $('#creo-add-tab').on('click', function(){
      const label = prompt('New tab label', 'New Tab');
      if(!label) return;
      const type = prompt('Type key (purchase, affordability, refinance, rentbuy, va_purchase, va_refinance, dscr, fixflip)', 'purchase') || 'purchase';
      $.post(ajax, { action:'creo_mc_add_tab', nonce, label, type }, () => location.reload() );
    });
  
    $('.creo-tab .rename').on('click', function(e){
      e.preventDefault();
      const id = $(this).data('id');
      const label = prompt('Rename tab');
      if(!label) return;
      $.post(ajax, { action:'creo_mc_rename_tab', nonce, id, label }, () => location.reload() );
    });
  
    $('.creo-tab .delete').on('click', function(e){
      e.preventDefault();
      if(!confirm('Remove this tab')) return;
      const id = $(this).data('id');
      $.post(ajax, { action:'creo_mc_delete_tab', nonce, id }, () => location.reload() );
    });
  })(jQuery);
  