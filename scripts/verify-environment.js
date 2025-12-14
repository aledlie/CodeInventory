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

/**
 * Simple logger for CLI output
 */
const logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
  success: (msg) => process.stdout.write(`✅ ${msg}\n`),
  fail: (msg) => process.stdout.write(`❌ ${msg}\n`),
  separator: () => process.stdout.write('================================================================================\n'),
};

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const projectRoot = process.cwd();

logger.separator();
logger.info('Code Inventory - Environment Verification');
logger.separator();
logger.info(`Environment: ${isCI ? 'CI' : 'Local Development'}`);
logger.info(`Project Root: ${projectRoot}`);
logger.info('');

let hasErrors = false;
let pythonCmd = 'python3';  // Will be updated if venv is found

// Check Node.js
try {
  const nodeVersion = process.version;
  logger.success(`Node.js ${nodeVersion}`);
} catch (e) {
  logger.fail('Node.js not found');
  hasErrors = true;
}

// Check Python
try {
  const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
  logger.success(pythonVersion);
} catch (e) {
  logger.fail('Python3 not found');
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
      logger.success(`Python packages (venv: ${venv})`);
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
    logger.success(`Python packages (${isCI ? 'CI global' : 'system'})`);
    pythonPackagesOk = true;
  } catch {
    // Python packages not found
  }
}

if (!pythonPackagesOk) {
  logger.fail(`Python packages not found (${requiredPackages.join(', ')})`);
  logger.info(isCI
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
    logger.success(`ast-grep ${version} (${loc})`);
    astGrepFound = true;
    break;
  } catch {
    continue;
  }
}

if (!astGrepFound) {
  logger.fail('ast-grep not found');
  logger.info('   Install with one of:');
  logger.info('   - brew install ast-grep (macOS)');
  logger.info('   - cargo install ast-grep (cross-platform)');
  hasErrors = true;
}

// Check pytest (using the detected Python)
try {
  const pytestVersion = execSync(`${pythonCmd} -m pytest --version`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).split('\n')[0];
  logger.success(pytestVersion);
} catch (e) {
  logger.fail('pytest not found');
  logger.info('   Run: pip install pytest pytest-cov');
  hasErrors = true;
}

// Check coverage (using the detected Python)
try {
  const coverageVersion = execSync(`${pythonCmd} -c "import coverage; print(f'coverage {coverage.__version__}')"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  logger.success(coverageVersion);
} catch (e) {
  logger.fail('coverage not found');
  logger.info('   Run: pip install coverage');
  hasErrors = true;
}

// Check pydantic version (using the detected Python)
try {
  const pydanticVersion = execSync(`${pythonCmd} -c "import pydantic; print(f'pydantic {pydantic.__version__}')"`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  }).trim();
  logger.success(pydanticVersion);
} catch (e) {
  logger.fail('pydantic not found');
  logger.info('   Run: pip install pydantic');
  hasErrors = true;
}

logger.info('');
logger.separator();

if (hasErrors) {
  logger.fail('Some checks failed. Please install missing dependencies.');
  logger.info('');
  logger.info('Quick setup commands:');
  if (isCI) {
    logger.info('  npm ci');
    logger.info('  pip install -r requirements.txt');
  } else {
    logger.info('  npm install');
    logger.info('  python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt');
  }
  process.exit(1);
} else {
  logger.success('All checks passed! Environment is ready.');
  process.exit(0);
}
