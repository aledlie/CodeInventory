#!/usr/bin/env node
/**
 * Environment Verification Script
 *
 * Checks that all required dependencies are available for the Code Inventory system.
 * Supports both local development and CI environments.
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const projectRoot = process.cwd();

console.log('================================================================================');
console.log('Code Inventory - Environment Verification');
console.log('================================================================================');
console.log(`Environment: ${isCI ? 'CI' : 'Local Development'}`);
console.log(`Project Root: ${projectRoot}`);
console.log('');

let hasErrors = false;

// Check Node.js
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion}`);
} catch (e) {
  console.log('❌ Node.js not found');
  hasErrors = true;
}

// Check Python
try {
  const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ ${pythonVersion}`);
} catch (e) {
  console.log('❌ Python3 not found');
  hasErrors = true;
}

// Check Python packages
const venvPython = join(projectRoot, '.venv', 'bin', 'python3');
const venvPythonAlt = join(projectRoot, 'venv', 'bin', 'python3');
let pythonPackagesOk = false;

// Try venv first (local dev)
for (const venv of [venvPython, venvPythonAlt]) {
  if (existsSync(venv)) {
    try {
      execSync(`"${venv}" -c "import pydantic; import tqdm"`, { stdio: 'ignore' });
      console.log(`✅ Python packages (venv: ${venv})`);
      pythonPackagesOk = true;
      break;
    } catch {}
  }
}

// Fallback to system Python (CI or global install)
if (!pythonPackagesOk) {
  try {
    execSync('python3 -c "import pydantic; import tqdm"', { stdio: 'ignore' });
    console.log(`✅ Python packages (${isCI ? 'CI global' : 'system'})`);
    pythonPackagesOk = true;
  } catch {}
}

if (!pythonPackagesOk) {
  console.log('❌ Python packages not found (pydantic, tqdm)');
  console.log(isCI
    ? '   Run: pip install -r requirements.txt'
    : '   Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt'
  );
  hasErrors = true;
}

// Check ast-grep (multiple locations)
const astGrepLocations = [
  join(projectRoot, 'node_modules', '.bin', 'ast-grep'),  // 1. Local npm (preferred)
  'npx ast-grep',                                          // 2. Via npx
  'ast-grep',                                              // 3. In PATH (brew, system)
  '/opt/homebrew/bin/ast-grep',                           // 4. macOS Homebrew (Apple Silicon)
  '/usr/local/bin/ast-grep',                              // 5. Linux/Intel Mac
];

let astGrepFound = false;
let astGrepLocation = '';

for (const loc of astGrepLocations) {
  try {
    const version = execSync(`${loc} --version`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    console.log(`✅ ast-grep ${version} (${loc})`);
    astGrepFound = true;
    astGrepLocation = loc;
    break;
  } catch {
    continue;
  }
}

if (!astGrepFound) {
  console.log('❌ ast-grep not found');
  console.log('   Install with one of:');
  console.log('   - npm install (uses devDependency)');
  console.log('   - brew install ast-grep (macOS)');
  console.log('   - cargo install ast-grep (cross-platform)');
  hasErrors = true;
}

// Check pytest
try {
  const pytestVersion = execSync('python3 -m pytest --version', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).split('\n')[0];
  console.log(`✅ ${pytestVersion}`);
} catch (e) {
  console.log('❌ pytest not found');
  console.log('   Run: pip install pytest pytest-cov');
  hasErrors = true;
}

console.log('');
console.log('================================================================================');

if (hasErrors) {
  console.log('❌ Some checks failed. Please install missing dependencies.');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Environment is ready.');
  process.exit(0);
}
