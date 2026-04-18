<template>
  <header class="bg-white p-4 flex justify-between items-center">
    <div class="flex items-center">
      <img :src="logoSrc" alt="Logo" class="h-10 w-auto object-contain" @error="handleLogoError">
    </div>
    <div class="flex items-center">
      <button class="hover:bg-slate-300 text-blue font-semibold px-6 py-1 rounded-md" @click="reloadKOT">
        <svg class="w-6 h-6 text-blue-800 dark:text-blue" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/> Refresh
        </svg> 
      </button>
    </div>
  </header>
</template>

<script>
import { call } from "../lib/frappe";
import uriMosaicImage from "@/assets/logos/mosaic.jpg";

export default {
  name: "Header",
  data() {
    return {
      brandLogo: null,
      defaultLogo: uriMosaicImage,
      hasError: false,
    };
  },
  mounted() {
    this.fetchWebsiteSettings();
  },
  methods: {
    async fetchWebsiteSettings() {
      try {
        const bannerRes = await call.get('frappe.client.get_single_value', {
          doctype: 'Website Settings',
          field: 'banner_image'
        });
        if (bannerRes.message) {
          this.brandLogo = this.getFileUrl(bannerRes.message);
          return;
        }

        const logoRes = await call.get('frappe.client.get_single_value', {
          doctype: 'Website Settings',
          field: 'app_logo'
        });
        if (logoRes.message) {
          this.brandLogo = this.getFileUrl(logoRes.message);
        }
      } catch (error) {
        console.error('Failed to fetch website settings:', error);
      }
    },
    getFileUrl(path) {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      const baseUrl = window.location.origin;
      return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    },
    handleLogoError() {
      this.hasError = true;
    },
    reloadKOT() {
      window.location.reload();
    }
  },
  computed: {
    logoSrc() {
      if (this.hasError || !this.brandLogo) {
        return this.defaultLogo;
      }
      return this.brandLogo;
    }
  },
};
</script>
