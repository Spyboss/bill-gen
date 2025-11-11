# Package Updates

This document outlines the changes made to fix deprecated package warnings in the tmr application.

## Changes Made

1. Added package overrides in `backend/package.json`:
   - Replaced `inflight@1.0.6` with `lru-cache@^7.14.1`
   - Updated `are-we-there-yet` to `^3.0.1`
   - Updated `gauge` to `^5.0.0`
   - Replaced `@humanwhocodes/object-schema` with `@eslint/object-schema@^1.0.0`
   - Replaced `@humanwhocodes/config-array` with `@eslint/config-array@^1.0.0`
   - Updated `rimraf` to `^4.4.1`

2. Created `.npmrc` file in the backend directory to enforce package preferences

3. Updated Dockerfile to include the `.npmrc` file during the build process

4. Updated `railway.toml` to use `--no-package-lock` flag for cleaner installs

## Why These Changes Were Made

The application was showing warnings about deprecated packages during the build process on Railway. These warnings were related to transitive dependencies (dependencies of dependencies) rather than direct dependencies.

By using package overrides and npm's resolution mechanism, we can force the use of newer, non-deprecated packages without having to modify the direct dependencies.

## Testing

After making these changes, the application should build without the deprecated package warnings. The functionality should remain unchanged as we're only updating packages that have newer, compatible versions available.

## Future Maintenance

When updating dependencies in the future, it's recommended to:

1. Check for any new deprecated package warnings
2. Update the overrides in `package.json` as needed
3. Test thoroughly to ensure compatibility
