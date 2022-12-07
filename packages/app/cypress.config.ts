import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: '**/*.spec.ts',
    supportFile: 'test/cypress/support/index.ts',
    setupNodeEvents: (on, config) => {
      // change screen size
      // see: https://docs.cypress.io/api/plugins/browser-launch-api#Set-screen-size-when-running-headless
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--window-size=1400,1024');
          launchOptions.args.push('--force-device-scale-factor=1');
        }
        return launchOptions;
      });
    },
  },
  fileServerFolder: 'test/cypress',
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',

  viewportWidth: 1400,
  viewportHeight: 1024,

  defaultCommandTimeout: 30000,
});
