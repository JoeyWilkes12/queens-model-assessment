#!/usr/bin/env node
/**
 * Runs a scripts/z3 Python entry point with a Z3-capable interpreter.
 * Interpreter: $Z3_PYTHON if set, else python3. The receipts were recorded with
 * z3-solver 4.16.0. Fails loudly if z3 cannot be imported.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const python = process.env.Z3_PYTHON || 'python3'
if (process.env.Z3_PYTHON && !existsSync(process.env.Z3_PYTHON)) {
  console.error(`FAIL Z3_PYTHON does not exist: ${process.env.Z3_PYTHON}`)
  process.exit(1)
}
const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
const probe = spawnSync(python, ['-c', 'import z3; print(z3.get_full_version())'], { env, encoding: 'utf8' })
if (probe.status !== 0) {
  console.error(`FAIL no Z3-capable Python found (tried ${python}). Set Z3_PYTHON to an interpreter with z3-solver 4.16 installed.`)
  process.exit(1)
}
console.log(`Using ${python} (${probe.stdout.trim()})`)
const result = spawnSync(python, process.argv.slice(2), { env, stdio: 'inherit' })
process.exit(result.status ?? 1)
