import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f87eea1e87704fbca36ab565d45dc8dd',
  appName: 'potion-master-pi',
  webDir: 'dist',
  server: {
    url: 'https://f87eea1e-8770-4fbc-a36a-b565d45dc8dd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'dark'
    }
  }
};

export default config;