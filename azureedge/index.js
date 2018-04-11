(function() {
    'use strict';
  
    const Gateway = require('azure-iot-gateway');
    let configPath = null;
  
    // node app.js [local | cloud ]
    if (process.argv.length < 3) {
      throw 'Syntax: npm run [local|cloud]';
    }

    const option = process.argv[2];
  
    if (option === 'local') {
      configPath = './gw_local_config.json';
    } else if (option === 'cloud') {
      configPath = './gw_cloud_config.json';
    } else {
      throw 'Invalid option to start app.js !';
    }
  
    const gw = new Gateway(configPath);
    gw.run();
  })();
  