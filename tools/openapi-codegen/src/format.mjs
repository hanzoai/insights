import { spawnSync } from 'node:child_process'

/**
 * Format JS/TS files using `insightscli format:js`.
 *
 * @param {string[]} files - absolute paths to format
 * @param {string} insightscliPath - absolute path to the insightscli binary
 * @param {string} cwd - working directory for the insightscli call
 */
export function formatJs(files, insightscliPath, cwd) {
    if (files.length === 0) {
        return
    }
    spawnSync(insightscliPath, ['format:js', ...files], { stdio: 'pipe', cwd })
}

/**
 * Format JSON/YAML files using `insightscli format:yaml` (runs oxfmt).
 *
 * @param {string[]} files - absolute paths to format
 * @param {string} insightscliPath - absolute path to the insightscli binary
 * @param {string} cwd - working directory for the insightscli call
 */
export function formatYaml(files, insightscliPath, cwd) {
    if (files.length === 0) {
        return
    }
    spawnSync(insightscliPath, ['format:yaml', ...files], { stdio: 'pipe', cwd })
}
