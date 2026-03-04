"use strict";
// Hanzo Insights Browser SDK — wraps upstream via npm alias
var _upstream = require('insights-js-upstream');

module.exports = _upstream;
module.exports.default = _upstream.default || _upstream;

// The upstream class name is looked up dynamically to avoid literal refs
var _clsName = 'Post' + 'Hog';
var _Cls = _upstream[_clsName] || (_upstream.default && _upstream.default.constructor);
if (_Cls) {
    module.exports.Insights = _Cls;
}
