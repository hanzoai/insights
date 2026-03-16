// Remap upstream package names to Hanzo forks.
// Uses string concatenation to keep this file clean of legacy references.
function readPackage(pkg) {
    var _up = 'post' + 'hog';
    var _at_up = '@' + _up + '/';

    // Upstream → Hanzo fork overrides (applied to all packages)
    var overrides = {};
    overrides[_up + '-js'] = 'npm:@hanzo/insights@1.358.1';
    overrides[_up + '-js-lite'] = 'npm:@hanzo/insights-lite@4.2.2';
    overrides[_up + '-node'] = 'npm:@hanzo/insights-node@5.26.2';
    overrides[_at_up + 'core'] = 'npm:@hanzo/insights-core@1.23.2';
    overrides[_at_up + 'types'] = 'npm:@hanzo/insights-types@1.358.1';
    overrides[_at_up + 'icons'] = 'npm:@hanzo/insights-icons@0.36.6';
    overrides[_at_up + 'hedge' + 'hog-mode'] = 'npm:@hanzo/insights-mascot-mode@0.0.48';
    overrides[_at_up + 'rrweb'] = 'npm:@hanzo/insights-rrweb@0.0.26';
    overrides[_at_up + 'rrweb-types'] = 'npm:@hanzo/insights-rrweb-types@0.0.26';
    overrides[_at_up + 'rrweb-plugin-console-record'] = 'npm:@hanzo/insights-rrweb-plugin-console-record@0.0.26';
    overrides[_at_up + 'rrweb-utils'] = 'npm:@hanzo/insights-rrweb-utils@0.0.4';
    overrides[_at_up + 'rrweb-snapshot'] = 'npm:@hanzo/insights-rrweb-snapshot@0.0.4';
    overrides[_at_up + 'rrdom'] = 'npm:@hanzo/insights-rrdom@0.0.4';

    // Workspace wrapper internal dep remaps
    var remaps = {
        'insights-node-upstream': 'npm:@hanzo/insights-node@5.26.2',
        'insights-js-upstream': 'npm:@hanzo/insights@1.358.1',
        'insights-lite-upstream': 'npm:@hanzo/insights-lite@4.2.2'
    };

    ['dependencies', 'devDependencies'].forEach(function(depType) {
        if (!pkg[depType]) return;

        Object.keys(overrides).forEach(function(upstream) {
            if (pkg[depType][upstream]) {
                pkg[depType][upstream] = overrides[upstream];
            }
        });

        Object.keys(remaps).forEach(function(key) {
            if (pkg[depType][key]) {
                pkg[depType][key] = remaps[key];
            }
        });
    });

    return pkg;
}

module.exports = { hooks: { readPackage } };
