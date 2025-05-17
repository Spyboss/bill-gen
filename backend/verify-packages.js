// verify-packages.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Verifying package overrides...');

// Check if package.json has overrides
const packageJson = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));
if (!packageJson.overrides) {
  console.error('Error: No overrides found in package.json');
  process.exit(1);
}

console.log('Overrides found in package.json:', packageJson.overrides);

// Check if .npmrc exists
if (!fs.existsSync(path.resolve('./.npmrc'))) {
  console.error('Error: .npmrc file not found');
  process.exit(1);
}

console.log('.npmrc file found');

// List all packages that should be overridden
const packagesToCheck = [
  'inflight',
  'are-we-there-yet',
  'gauge',
  '@humanwhocodes/object-schema',
  '@humanwhocodes/config-array',
  'rimraf'
];

console.log('Checking for deprecated packages...');

// Function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    const output = execSync(`npm list ${packageName} --depth=10`, { encoding: 'utf8' });
    return output.includes(packageName);
  } catch (error) {
    // If the package is not found, npm list will exit with non-zero code
    return false;
  }
}

// Check each package
let allPackagesValid = true;
for (const pkg of packagesToCheck) {
  if (isPackageInstalled(pkg)) {
    console.log(`✓ ${pkg} is installed`);
    
    // Check if it's the correct version (for packages that should be replaced)
    if (pkg === 'inflight') {
      try {
        const output = execSync(`npm list ${pkg} --depth=10`, { encoding: 'utf8' });
        if (output.includes('inflight@1.0.6')) {
          console.error(`✗ ${pkg} is still using the deprecated version 1.0.6`);
          allPackagesValid = false;
        } else {
          console.log(`✓ ${pkg} is using a non-deprecated version`);
        }
      } catch (error) {
        console.error(`Error checking ${pkg} version:`, error.message);
        allPackagesValid = false;
      }
    }
  } else {
    console.log(`✓ ${pkg} is not installed (which is good if it was replaced)`);
  }
}

if (allPackagesValid) {
  console.log('All package overrides are working correctly!');
} else {
  console.error('Some package overrides are not working correctly.');
  process.exit(1);
}
