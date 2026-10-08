import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lsc.control',
  appName: 'LSC Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        itemListTitle: 'Available LED Devices',
        scanning: 'Scanning for LED Strips...',
        cancel: 'Cancel',
      }
    }
  }
};

export default config;