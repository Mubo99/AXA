import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mn.aha.quiz',
  appName: 'АХА',
  webDir: 'www',
  backgroundColor: '#15101F',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#15101F',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#15101F'
    }
  }
};

export default config;
