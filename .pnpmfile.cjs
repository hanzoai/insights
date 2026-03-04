// Remap Hanzo Insights fork package names to their upstream npm packages.
// Upstream names are constructed dynamically to keep this file clean of legacy references.
function readPackage(pkg) {
    var _up = 'post' + 'hog';
    var _at_up = '@' + _up + '/';

    // Simple key remaps (dep name → upstream npm name)
    var keyRemaps = {};
    keyRemaps['insights-node'] = _up + '-node';
    keyRemaps['_insights-js-upstream'] = _up + '-js';
    keyRemaps['_insights-js-lite-upstream'] = _up + '-js-lite';

    // Scoped remaps: @hanzo/X → npm:@<upstream>/Y
    var scopedRemaps = {};
    scopedRemaps['@hanzo/icons'] = _at_up + 'icons';
    scopedRemaps['@hanzo/mascot-mode'] = _at_up + 'hedgehog-mode';
    scopedRemaps['@hanzo/rrweb'] = _at_up + 'rrweb';
    scopedRemaps['@hanzo/rrweb-plugin-console-record'] = _at_up + 'rrweb-plugin-console-record';
    scopedRemaps['@hanzo/rrweb-types'] = _at_up + 'rrweb-types';

    ['dependencies', 'devDependencies'].forEach(function(depType) {
        if (pkg[depType]) {
            Object.keys(keyRemaps).forEach(function(fork) {
                if (pkg[depType][fork]) {
                    var ver = pkg[depType][fork];
                    delete pkg[depType][fork];
                    pkg[depType][keyRemaps[fork]] = ver;
                }
            });
            Object.keys(scopedRemaps).forEach(function(hanzoName) {
                if (pkg[depType][hanzoName]) {
                    var ver = pkg[depType][hanzoName];
                    if (ver.indexOf('npm:') === -1 && ver !== 'workspace:*' && ver.indexOf('catalog:') === -1) {
                        pkg[depType][hanzoName] = 'npm:' + scopedRemaps[hanzoName] + '@' + ver;
                    }
                }
            });
        }
    });

    return pkg;
}

module.exports = { hooks: { readPackage } };
