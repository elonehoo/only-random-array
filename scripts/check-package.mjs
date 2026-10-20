import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const temporary = mkdtempSync(join(tmpdir(), '.package-check-'))
const consumer = join(temporary, 'consumer')
const packageName = '@elonehoo/only-random-array'

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

try {
  const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary]))
  run('tar', ['-xzf', join(temporary, packed[0].filename), '-C', temporary])
  const scope = join(consumer, 'node_modules', '@elonehoo')
  mkdirSync(scope, { recursive: true })
  renameSync(join(temporary, 'package'), join(scope, 'only-random-array'))
  // Copy the declared runtime dependency, which currently has no dependencies of its own.
  const dependency = resolve(root, 'node_modules/@elonehoo/only-random')
  const manifest = JSON.parse(readFileSync(join(dependency, 'package.json'), 'utf8'))
  if (Object.keys(manifest.dependencies || {}).length)
    throw new Error('Update the consumer fixture to include the runtime dependency closure')
  cpSync(dependency, join(scope, 'only-random'), { recursive: true, dereference: true })
  // An external package scope cannot inherit the repository's node_modules.
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'package-consumer', private: true, type: 'module' }))

  const assertion = 'const result: number = random([1, 2, 3])()\nvoid result\n'
  writeFileSync(join(consumer, 'esm.mts'), `import random from '${packageName}'\n${assertion}`)
  writeFileSync(join(consumer, 'common.cts'), `import random = require('${packageName}')\n${assertion}`)
  writeFileSync(join(consumer, 'legacy.ts'), `import random = require('${packageName}')\n${assertion}`)
  const compiler = resolve(root, 'node_modules/typescript/bin/tsc')
  const options = [compiler, '--noEmit', '--strict', '--skipLibCheck', 'false', '--target', 'ES2022']
  for (const file of ['esm.mts', 'common.cts'])
    run(process.execPath, [...options, '--module', 'NodeNext', '--moduleResolution', 'NodeNext', join(consumer, file)])
  run(process.execPath, [...options, '--module', 'CommonJS', '--moduleResolution', 'Node', '--esModuleInterop', join(consumer, 'legacy.ts')])

  writeFileSync(join(consumer, 'esm.mjs'), `import random from '${packageName}'; import assert from 'node:assert/strict'; assert.ok([1,2,3].includes(random([1,2,3])()));`)
  writeFileSync(join(consumer, 'common.cjs'), `const random = require('${packageName}'); const assert = require('node:assert/strict'); assert.ok(require.resolve('${packageName}').includes('.package-check-')); assert.ok([1,2,3].includes(random([1,2,3])()));`)
  run(process.execPath, [join(consumer, 'esm.mjs')])
  run(process.execPath, [join(consumer, 'common.cjs')])
}
finally {
  rmSync(temporary, { recursive: true, force: true })
}
