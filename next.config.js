var path = require('path');

module.exports = {
  webpack: function (config) {
    config.resolve.alias['~components'] = path.resolve('components')
    config.resolve.alias['~models'] = path.resolve('models')
    return config
  }
}
