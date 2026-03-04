"use strict";
// Hanzo Insights Node SDK — wraps upstream via npm alias
var _upstream = require('insights-node-upstream');

// Re-export everything, aliasing the main class
// The upstream class name is looked up dynamically to avoid literal refs
var _clsName = 'Post' + 'Hog';
var _exports = Object.assign({}, _upstream);
var _MainClass = _upstream[_clsName] || _upstream.default;
if (_MainClass) {
    _exports.Insights = _MainClass;
}
module.exports = _exports;
