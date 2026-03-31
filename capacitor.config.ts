import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daree.app',
  appName: 'Daree',
  server: {
    url: 'https://daree.vercel.app',
    cleartext: true
  }
};

export default config;
