#!/usr/bin/env node
/**
 * Runs a scripts/z3 Python entry point with a Z3-capable interpreter.
 * Interpreter: $Z3_PYTHON, else the local Queens venv used to record the
 * receipts (if present), else python3. Fails loudly if z3 cannot be imported.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const candidates = [process.env.Z3_PYTHON, '/Users/joeywilkes/Desktop/scripts/Queens/.local/venv/bin/python', 'python3'].filter(Boolean)
const python = candidates.find(path => path === 'python3' || existsSync(path))
const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
const probe = spawnSync(python, ['-c', 'import z3; print(z3.get_full_version())'], { env, encoding: 'utf8' })
if (probe.status !== 0) {
  console.error(`FAIL no Z3-capable Python found (tried ${python}). Set Z3_PYTHON to an interpreter with z3-solver 4.16 installed.`)
  process.exit(1)
}
console.log(`Using ${python} (${probe.stdout.trim()})`)
const result = spawnSync(python, process.argv.slice(2), { env, stdio: 'inherit' })
process.exit(result.status ?? 1)
