// Remap Hanzo Insights fork package names to upstream npm packages
// Uses string concat to avoid triggering automated rename tooling
function readPackage(pkg) {
    var _ph = 'post' + 'hog';
    var _at_ph = '@' + _ph + '/';

    // Simple key remaps (dep name changes, used by wrapper packages)
    var keyRemaps = {};
    keyRemaps['insights-node'] = _ph + '-node';
    keyRemaps['_insights-js-upstream'] = _ph + '-js';
    keyRemaps['_insights-js-lite-upstream'] = _ph + '-js-lite';

    // Scoped package remaps: @hanzo/X -> npm:@posthog/Y (alias keeps @hanzo/ in node_modules)
    var scopedRemaps = {};
    scopedRemaps['@hanzo/icons'] = _at_ph + 'icons';
    scopedRemaps['@hanzo/mascot-mode'] = _at_ph + 'hedgehog-mode';
    scopedRemaps['@hanzo/rrweb'] = _at_ph + 'rrweb';
    scopedRemaps['@hanzo/rrweb-plugin-console-record'] = _at_ph + 'rrweb-plugin-console-record';
    scopedRemaps['@hanzo/rrweb-types'] = _at_ph + 'rrweb-types';

    ['dependencies', 'devDependencies'].forEach(function(depType) {
        if (pkg[depType]) {
            // Key remaps: change dep name entirely
            Object.keys(keyRemaps).forEach(function(fork) {
                if (pkg[depType][fork]) {
                    var ver = pkg[depType][fork];
                    delete pkg[depType][fork];
                    pkg[depType][keyRemaps[fork]] = ver;
                }
            });
            // Scoped remaps: use npm alias to keep @hanzo/ in node_modules
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
