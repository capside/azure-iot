(function() {
    'use strict';
  
    const Gateway = require('azure-iot-gateway');
    
    if (process.argv.length < 3) {
      throw 'Syntax: npm run [local|cloud]';
    }

    const config = process.argv[2];
    if (!config) {
      console.error('Usage: npm run [yee | dyee | cloud | dcloud]');
      return -1;
    }
    const configPath = config + '.json';
    const gw = new Gateway(configPath);
    gw.run();
  })();
  