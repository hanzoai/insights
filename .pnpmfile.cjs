// Remap Hanzo Insights fork package names to upstream npm packages
// Uses string concat to avoid triggering automated rename tooling
function readPackage(pkg) {
    var _base = 'post' + 'hog';
    var remaps = {};
    // Direct fork names (used in package.json deps throughout the workspace)
    remaps['insights-node'] = _base + '-node';
    // Prefixed names (used by wrapper packages to avoid circular deps)
    remaps['_insights-js-upstream'] = _base + '-js';
    remaps['_insights-js-lite-upstream'] = _base + '-js-lite';

    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(function(depType) {
        if (pkg[depType]) {
            Object.keys(remaps).forEach(function(fork) {
                if (pkg[depType][fork]) {
                    var ver = pkg[depType][fork];
                    delete pkg[depType][fork];
                    pkg[depType][remaps[fork]] = ver;
                }
            });
        }
    });

    return pkg;
}

module.exports = { hooks: { readPackage } };
