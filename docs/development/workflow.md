# Git Workflow and Branch Management

## Branch Structure

The project follows a simplified Git Flow workflow with the following branches:

1. **`master`** - Production branch
   - Contains stable, production-ready code
   - No direct commits should be made to this branch
   - Updated only via pull requests from `dev`
   - Tagged with version numbers for releases

2. **`dev`** - Development branch
   - Main integration branch for all features
   - Code here should always be in a working state
   - All feature branches are merged here first
   - Regularly synced to avoid conflicts

3. **Feature branches** - Feature-specific development
   - Named with convention: `feature/feature-name`
   - Created from the latest `dev` branch
   - Focused on a specific feature or bug fix
   - Merged back to `dev` when complete

## Development Workflow

### Starting a New Feature

1. Ensure you have the latest `dev` branch:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Create a new feature branch:
   ```bash
   git checkout -b feature/tricycle-model
   ```

3. Implement the feature with regular commits:
   ```bash
   git add .
   git commit -m "Add tricycle model schema"
   ```

4. Push your feature branch to remote:
   ```bash
   git push -u origin feature/tricycle-model
   ```

### Completing a Feature

1. Ensure your feature branch is up to date with `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/tricycle-model
   git merge dev
   ```

2. Resolve any merge conflicts if they occur

3. Push your changes:
   ```bash
   git push origin feature/tricycle-model
   ```

4. Create a pull request from your feature branch to `dev`
   - Add appropriate description of changes
   - Request code review if working in a team

5. After approval, merge the pull request into `dev`

6. Delete the feature branch after successful merge:
   ```bash
   git branch -d feature/tricycle-model
   ```

### Preparing a Release

1. Merge `dev` into `master`:
   ```bash
   git checkout master
   git pull origin master
   git merge dev
   git push origin master
   ```

2. Create a version tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

## Working Across Multiple Environments

When working across different environments (e.g., work and home computers):

1. **Always pull before starting work:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout your-feature-branch
   git pull origin your-feature-branch
   ```

2. **Push completed work before switching locations:**
   ```bash
   git add .
   git commit -m "Meaningful commit message"
   git push origin your-feature-branch
   ```

3. **Use GitHub Issues to track progress:**
   - Create issues for features you're working on
   - Use comments to document progress
   - Reference issue numbers in commit messages (#123)

4. **Keep consistent branch naming across environments**

## Commit Messages

Good commit messages are important for maintaining a clear history:

- Use the imperative mood: "Add feature" not "Added feature"
- Start with a capital letter
- Keep the subject line under 50 characters 
- Provide more details in the commit body if needed
- Reference issue numbers when applicable

Example:
```
Add tricycle model schema and validation

- Created Mongoose schema for tricycle model
- Added validation rules for unique fields
- Updated controller to handle tricycle-specific logic

Resolves #45
```

## Code Reviews

Before merging feature branches into `dev`:

1. Ensure code follows project conventions
2. Run tests to verify functionality
3. Review for potential bugs and edge cases
4. Check for any missing documentation 