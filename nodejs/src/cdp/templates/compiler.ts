import { exec } from 'child_process'
import { mkdirSync, readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { parseJSON } from '~/common/utils/json-parse'
import { UUIDT } from '~/common/utils/utils'

import { HogBytecode } from '../types'
import { Semaphore } from '../utils/sempahore'

const ROOT_DIR = path.join(__dirname, '..', '..', '..', '..')
const CACHE_FILE = path.join(__dirname, '.tmp/cache.json')

let CACHE: Record<string, HogBytecode> | null = null
const CONCURRENT_WORKERS = 10

const semaphore = new Semaphore(CONCURRENT_WORKERS)

export async function compileHog(script: string): Promise<HogBytecode> {
    return semaphore.run(async () => {
        if (CACHE === null) {
            mkdirSync(path.dirname(CACHE_FILE), { recursive: true })

            // Load from the tmp dir if it exists, otherwise new object
            try {
                CACHE = parseJSON(readFileSync(CACHE_FILE, 'utf-8'))
            } catch {
                CACHE = {}
            }
        }
        CACHE = CACHE ?? {}

        if (CACHE[script]) {
            return CACHE[script]
        }

        // We invoke the ./bin/script from the root of the directory like bin/hoge <file.script> [output.hoge]
        // We need to write and read from a temp file
        const uuid = new UUIDT().toString()
        const tempFile = path.join(tmpdir(), `script-${uuid}.script`)
        await writeFile(tempFile, script)

        const outputFile = path.join(tmpdir(), `script-${uuid}.hoge`)
        try {
            await new Promise((resolve, reject) => {
                exec(
                    `cd ${ROOT_DIR} && ./bin/hoge ${tempFile} ${outputFile}`,
                    {
                        env: {
                            ...process.env,
                            TEST: 'true',
                        },
                    },
                    (error, stdout) => (error ? reject(error) : resolve(stdout))
                )
            })
        } catch (error) {
            console.error('Failed to compile script:', script)
            throw error
        }

        const output = parseJSON(await readFile(outputFile, 'utf-8'))

        CACHE[script] = output

        await writeFile(CACHE_FILE, JSON.stringify(CACHE, null, 2))

        return output
    })
}
