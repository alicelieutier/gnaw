require("babel-register")({
  presets: [
    [
      "env",
      {
        targets: {
          node: "9.5.0"
        }
      }
    ]
  ]
});
require("babel-polyfill");

module.exports = require("./commands/delegator.js");
