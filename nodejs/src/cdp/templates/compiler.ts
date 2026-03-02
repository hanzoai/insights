import { exec } from 'child_process'
import { mkdirSync, readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

import { parseJSON } from '../../utils/json-parse'
import { UUIDT } from '../../utils/utils'
import { ScriptBytecode } from '../types'
import { Semaphore } from '../utils/sempahore'

const ROOT_DIR = path.join(__dirname, '..', '..', '..', '..')
const CACHE_FILE = path.join(__dirname, '.tmp/cache.json')

let CACHE: Record<string, ScriptBytecode> | null = null
const CONCURRENT_WORKERS = 10

const semaphore = new Semaphore(CONCURRENT_WORKERS)

export async function compileScript(scriptSource: string): Promise<ScriptBytecode> {
    return semaphore.run(async () => {
        if (CACHE === null) {
            mkdirSync(path.dirname(CACHE_FILE), { recursive: true })

            // Load from the tmp dir if it exists, otherwise new object
            try {
                CACHE = parseJSON(readFileSync(CACHE_FILE, 'utf-8'))
            } catch (error) {
                CACHE = {}
            }
        }
        CACHE = CACHE ?? {}

        if (CACHE[scriptSource]) {
            return CACHE[scriptSource]
        }

        // We invoke the ./bin/script-compiler from the root of the directory like bin/script-compile <file.src> [output.out]
        // We need to write and read from a temp file
        const uuid = new UUIDT().toString()
        const tempFile = path.join(tmpdir(), `script-${uuid}.src`)
        await writeFile(tempFile, scriptSource)

        const outputFile = path.join(tmpdir(), `script-${uuid}.out`)
        try {
            await new Promise((resolve, reject) => {
                exec(
                    `cd ${ROOT_DIR} && ./bin/script-compile ${tempFile} ${outputFile}`,
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
            console.error('Failed to compile script:', scriptSource)
            throw error
        }

        const output = parseJSON(await readFile(outputFile, 'utf-8'))

        CACHE[scriptSource] = output

        await writeFile(CACHE_FILE, JSON.stringify(CACHE, null, 2))

        return output
    })
}
