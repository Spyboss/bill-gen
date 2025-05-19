@echo off
echo === Testing Build Process ===

echo Creating dist directory...
mkdir dist 2>nul
mkdir dist\utils 2>nul
mkdir dist\models 2>nul
mkdir dist\routes 2>nul
mkdir dist\middleware 2>nul
mkdir dist\config 2>nul
mkdir dist\auth 2>nul
mkdir dist\templates 2>nul

echo Copying crypto-polyfill.js...
copy src\utils\crypto-polyfill.js dist\utils\ /Y

echo Copying jose-crypto.js...
copy src\utils\jose-crypto.js dist\utils\ /Y

echo Creating server.js...
copy dist\server.js dist\server.js.bak /Y 2>nul
copy src\server.js dist\ /Y 2>nul

echo Testing import...
cd dist
node -e "import('./utils/crypto-polyfill.js').then(m => console.log('Successfully imported crypto-polyfill.js')).catch(e => console.error('Failed to import crypto-polyfill.js:', e.message))"
node -e "import('./utils/jose-crypto.js').then(m => console.log('Successfully imported jose-crypto.js')).catch(e => console.error('Failed to import jose-crypto.js:', e.message))"
cd ..

echo === Test Complete ===
