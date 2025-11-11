#!/usr/bin/env node

/**
 * Security Validation Script
 * Tests that all security fixes are working correctly
 */

const path = require('path');
const fs = require('fs');

console.log('🔒 Security Validation Script');
console.log('============================\n');

// Test 1: Check that hardcoded secrets are removed
console.log('1. Checking for hardcoded secrets...');

const filesToCheck = [
  'src/server.ts',
  'src/utils/encryption.ts',
  'src/auth/jwt.strategy.ts',
  'src/auth/auth.controller.ts',
  'src/scripts/createAdminUser.ts',
  'src/scripts/createAdmin.ts',
  'src/scripts/createAdmin.js'
];

const dangerousPatterns = [
  /Admin@12345/,
  /AdminPass123!/,
  /a5f3d8c1b4e2a9f7d6c3b5a2e4f8c9d6/,
  /admin-setup-secret-key/,
  /padEnd\(32, 'x'\)/,
  /DEFAULT_KEY/,
  /DEFAULT_ADMIN_PASSWORD/
];

let foundIssues = false;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    dangerousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`   ❌ Found hardcoded secret in ${filePath}`);
        foundIssues = true;
      }
    });
  }
});

if (!foundIssues) {
  console.log('   ✅ No hardcoded secrets found');
}

// Test 2: Check that environment variable validation exists
console.log('\n2. Checking environment variable validation...');

const validationChecks = [
  { file: 'src/server.ts', pattern: /process\.exit\(1\)/ },
  { file: 'src/utils/encryption.ts', pattern: /throw new Error\('ENCRYPTION_KEY/ },
  { file: 'src/auth/jwt.strategy.ts', pattern: /throw new Error\('JWT_SECRET/ },
  { file: 'src/scripts/createAdminUser.ts', pattern: /process\.exit\(1\)/ }
];

let validationIssues = false;

validationChecks.forEach(check => {
  const fullPath = path.join(__dirname, check.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (!check.pattern.test(content)) {
      console.log(`   ❌ Missing validation in ${check.file}`);
      validationIssues = true;
    }
  }
});

if (!validationIssues) {
  console.log('   ✅ Environment variable validation found');
}

// Test 3: Check .env.example has all required variables
console.log('\n3. Checking .env.example configuration...');

const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  const requiredVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'ADMIN_SETUP_KEY'
  ];
  
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`   ❌ Missing variables in .env.example: ${missingVars.join(', ')}`);
  } else {
    console.log('   ✅ All required variables found in .env.example');
  }
} else {
  console.log('   ❌ .env.example file not found');
}

// Summary
console.log('\n🔒 Security Validation Summary');
console.log('==============================');

if (!foundIssues && !validationIssues) {
  console.log('✅ All security fixes have been successfully applied!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set all required environment variables in your .env file');
  console.log('2. Generate strong secrets using: openssl rand -base64 32');
  console.log('3. Test that the application starts with your configuration');
  console.log('4. Change default admin credentials after first setup');
  process.exit(0);
} else {
  console.log('❌ Security issues found. Please review the output above.');
  process.exit(1);
}