/**
 * SMEC AI Logo as Base64 encoded data URI
 *
 * To update this logo:
 * 1. Place the PNG image in public/smec_ai_logo_horizontal.png
 * 2. Run: base64 -i public/smec_ai_logo_horizontal.png | tr -d '\n'
 * 3. Prepend "data:image/png;base64," to the output
 * 4. Update the LOGO_BASE64 constant below
 */

// Placeholder - set to empty string when no logo is available
// The buildFullHtml function will gracefully handle this
export const LOGO_BASE64 = '';

/**
 * Check if logo is available
 */
export function hasLogo(): boolean {
  return LOGO_BASE64.length > 0;
}
