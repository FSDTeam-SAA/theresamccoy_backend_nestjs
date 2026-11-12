// Export the same Swagger document used by the server from an isolated test application.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js'), '--config', './test/jest-integration.json', '--runInBand', '--testNamePattern', 'serves an importable Swagger contract'], { cwd: path.join(__dirname, '..'), env: { ...process.env, EXPORT_OPENAPI: '1' }, stdio: 'inherit' });
if (result.error) { console.error(result.error.message); process.exitCode = 1; }
else process.exitCode = result.status ?? 1;
