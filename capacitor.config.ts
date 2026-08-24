import type { CapacitorConfig } from '@capacitor/cli';
import type { CapacitorElectronConfig } from '@capacitor-community/electron';

const config: CapacitorElectronConfig = {
  appId: 'com.cheems.app',
  appName: 'Cheems Bonk Game',
  webDir: 'dist/cheems-angular/browser',
  electron: {
    trayIconAndMenuEnabled: false,
    splashScreenEnabled: false
  }
};

export default config;
