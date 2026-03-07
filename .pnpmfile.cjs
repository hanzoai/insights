// Remap workspace SDK wrapper internal dep names.
// All upstream package overrides are in package.json pnpm.overrides.
function readPackage(pkg) {
    ['dependencies', 'devDependencies'].forEach(function(depType) {
        if (!pkg[depType]) return;

        // Workspace wrapper internal dep remaps
        var remaps = {
            'insights-node-upstream': 'npm:@hanzo/insights-node@5.10.4',
            'insights-js-upstream': 'npm:@hanzo/insights@1.352.0',
            'insights-lite-upstream': 'npm:@hanzo/insights-lite@4.2.2'
        };

        Object.keys(remaps).forEach(function(key) {
            if (pkg[depType][key]) {
                pkg[depType][key] = remaps[key];
            }
        });
    });

    return pkg;
}

module.exports = { hooks: { readPackage } };
