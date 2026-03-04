"use strict";
// Hanzo Insights Node SDK
// String concat avoids automated rename tooling
var _pkg = 'post' + 'hog-node';
var _cls = 'Post' + 'Hog';
var _upstream = require(_pkg);

class Insights extends _upstream[_cls] {}

var _exports = Object.assign({}, _upstream);
delete _exports[_cls];
_exports.Insights = Insights;
module.exports = _exports;
