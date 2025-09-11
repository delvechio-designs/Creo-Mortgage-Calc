# Creo Mortgage Calculators

- Admin page with a tab strip and a + tab creator
- Tabs mirror: Affordability, Purchase, Refinance, Rent vs Buy, VA Purchase, VA Refinance, DSCR, Fix & Flip
- Frontend shortcode: `[creo_calculators]`
- Vanilla JS, custom donut renderer, no frameworks

## Install
1. Upload to `wp-content/plugins/creo-mortgage-calculators`
2. Activate the plugin
3. Configure tabs in **Calculator** in the WP sidebar
4. Add `[creo_calculators]` to a page

## Notes
- All labels and defaults come from `includes/schemas.php`
- Math functions live in `includes/calculators/*`
- Add more fields to a tab by editing the schema. The admin form and sanitizer will update automatically
