import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
await mkdir('reports', { recursive: true });
const child = spawn(process.execPath, ['--test', '--test-concurrency=1',
  '--test-reporter=spec', '--test-reporter=junit',
  '--test-reporter-destination=stdout', '--test-reporter-destination=reports/results.xml',
  'specs.test.js'], { stdio:'inherit', env:process.env });
child.on('error', e => { console.error(e); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = signal ? 1 : code ?? 1; });
