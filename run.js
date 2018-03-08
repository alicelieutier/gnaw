require('babel-register')({
  presets: [ 'env' ]
})

module.exports = require('./commands/delegator.js')
