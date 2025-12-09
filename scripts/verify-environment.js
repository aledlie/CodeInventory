#!/usr/bin/env node
/**
 * Environment Verification Script
 *
 * Checks that all required dependencies are available for the Code Inventory system.
 * Supports both local development and CI environments.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const projectRoot = process.cwd();

console.log('================================================================================');
console.log('Code Inventory - Environment Verification');
console.log('================================================================================');
console.log(`Environment: ${isCI ? 'CI' : 'Local Development'}`);
console.log(`Project Root: ${projectRoot}`);
console.log('');

let hasErrors = false;
let pythonCmd = 'python3';  // Will be updated if venv is found

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

const requiredPackages = ['pydantic', 'tqdm', 'coverage'];

// Try venv first (local dev)
for (const venv of [venvPython, venvPythonAlt]) {
  if (existsSync(venv)) {
    try {
      const importCmd = requiredPackages.map(p => `import ${p}`).join('; ');
      execSync(`"${venv}" -c "${importCmd}"`, { stdio: 'ignore' });
      console.log(`✅ Python packages (venv: ${venv})`);
      pythonPackagesOk = true;
      pythonCmd = `"${venv}"`;  // Use this venv for subsequent checks
      break;
    } catch {
      // Try next venv location
    }
  }
}

// Fallback to system Python (CI or global install)
if (!pythonPackagesOk) {
  try {
    const importCmd = requiredPackages.map(p => `import ${p}`).join('; ');
    execSync(`python3 -c "${importCmd}"`, { stdio: 'ignore' });
    console.log(`✅ Python packages (${isCI ? 'CI global' : 'system'})`);
    pythonPackagesOk = true;
  } catch {
    // Python packages not found
  }
}

if (!pythonPackagesOk) {
  console.log(`❌ Python packages not found (${requiredPackages.join(', ')})`);
  console.log(isCI
    ? '   Run: pip install -r requirements.txt'
    : '   Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt'
  );
  hasErrors = true;
}

// Check ast-grep (multiple locations)
const astGrepLocations = [
  join(projectRoot, 'node_modules', '.bin', 'ast-grep'),  // 1. Local npm (preferred)
  'ast-grep',                                              // 2. In PATH (brew, system)
  '/opt/homebrew/bin/ast-grep',                           // 3. macOS Homebrew (Apple Silicon)
  '/usr/local/bin/ast-grep',                              // 4. Linux/Intel Mac
];

let astGrepFound = false;

for (const loc of astGrepLocations) {
  try {
    const version = execSync(`${loc} --version`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    console.log(`✅ ast-grep ${version} (${loc})`);
    astGrepFound = true;
    break;
  } catch {
    continue;
  }
}

if (!astGrepFound) {
  console.log('❌ ast-grep not found');
  console.log('   Install with one of:');
  console.log('   - brew install ast-grep (macOS)');
  console.log('   - cargo install ast-grep (cross-platform)');
  hasErrors = true;
}

// Check pytest (using the detected Python)
try {
  const pytestVersion = execSync(`${pythonCmd} -m pytest --version`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).split('\n')[0];
  console.log(`✅ ${pytestVersion}`);
} catch (e) {
  console.log('❌ pytest not found');
  console.log('   Run: pip install pytest pytest-cov');
  hasErrors = true;
}

// Check coverage (using the detected Python)
try {
  const coverageVersion = execSync(`${pythonCmd} -c "import coverage; print(f'coverage {coverage.__version__}')"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  console.log(`✅ ${coverageVersion}`);
} catch (e) {
  console.log('❌ coverage not found');
  console.log('   Run: pip install coverage');
  hasErrors = true;
}

// Check pydantic version (using the detected Python)
try {
  const pydanticVersion = execSync(`${pythonCmd} -c "import pydantic; print(f'pydantic {pydantic.__version__}')"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  console.log(`✅ ${pydanticVersion}`);
} catch (e) {
  console.log('❌ pydantic not found');
  console.log('   Run: pip install pydantic');
  hasErrors = true;
}

console.log('');
console.log('================================================================================');

if (hasErrors) {
  console.log('❌ Some checks failed. Please install missing dependencies.');
  console.log('');
  console.log('Quick setup commands:');
  if (isCI) {
    console.log('  npm ci');
    console.log('  pip install -r requirements.txt');
  } else {
    console.log('  npm install');
    console.log('  python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt');
  }
  process.exit(1);
} else {
  console.log('✅ All checks passed! Environment is ready.');
  process.exit(0);
}
