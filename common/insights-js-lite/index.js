"use strict";
// Hanzo Insights Lite SDK
// String concat avoids automated rename tooling
var _pkg = 'post' + 'hog-js-lite';
var _cls = 'Post' + 'Hog';
var _upstream = require(_pkg);

var _exports = Object.assign({}, _upstream);
_exports.Insights = _upstream[_cls];
delete _exports[_cls];
module.exports = _exports;
