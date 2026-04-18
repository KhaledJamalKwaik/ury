import { db, call } from './frappe-sdk';

export async function getBrandLogo(): Promise<string | null> {
  console.log('Fetching brand logo from Website Settings...');
  try {
    // Try to get banner_image (Brand Image)
    const bannerRes = await call.get('frappe.client.get_single_value', {
      doctype: 'Website Settings',
      field: 'banner_image'
    });
    
    if (bannerRes.message) return bannerRes.message;

    // Fallback to app_logo
    const logoRes = await call.get('frappe.client.get_single_value', {
      doctype: 'Website Settings',
      field: 'app_logo'
    });
    
    return logoRes.message || null;
  } catch (error) {
    console.error('Failed to fetch brand logo from Website Settings:', error);
    return null;
  }
}
