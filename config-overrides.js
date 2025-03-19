const { alias, configPaths } = require('react-app-rewire-alias');
const path = require('path');

module.exports = function override(config) {
    alias(configPaths('./tsconfig.json'))(config);
    return config;
};
