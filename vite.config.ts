import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import type { PluginOption } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  
  return {
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('scheduler') || 
                id.includes('react-router')
              ) {
                return 'vendor-react';
              }
              if (id.includes('supabase') || id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('lucide-react') || id.includes('lucide')) {
                return 'vendor-lucide';
              }
            }
          }
        }
      }
    }
  };
})
