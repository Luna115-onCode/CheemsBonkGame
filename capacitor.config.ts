import type { CapacitorConfig } from '@capacitor/cli';
<<<<<<< HEAD
import type { CapacitorElectronConfig } from '@capacitor-community/electron';

const config: CapacitorElectronConfig = {
  appId: 'com.cheems.app',
  appName: 'Cheems Bonk Game',
  webDir: 'dist/cheems-angular/browser',
  electron: {
    trayIconAndMenuEnabled: false,
    splashScreenEnabled: false
  }
=======

const config: CapacitorConfig = {
  appId: 'com.cheems.app',
  appName: 'Cheems Bonk Game',
  webDir: 'dist/cheems-angular/browser'
>>>>>>> 978282b3d376db0a28f8a319cd5e15d9f5cddf20
};

export default config;
