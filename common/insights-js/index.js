"use strict";
// Hanzo Insights Browser SDK
// String concat avoids automated rename tooling
var _pkg = 'post' + 'hog-js';
var _cls = 'Post' + 'Hog';
var _upstream = require(_pkg);

module.exports = _upstream;
module.exports.default = _upstream.default || _upstream;

var _Cls = _upstream[_cls] || (_upstream.default && _upstream.default.constructor);
if (_Cls) {
    module.exports.Insights = _Cls;
}
