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

module.exports = require("./commands/delegator.js");
