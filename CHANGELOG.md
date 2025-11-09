# 📝 Changelog

All notable changes to the Gunawardhana Motors Business Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [x.x.x] - 2025-11-10 - 🔐 **Crypto correctness with compatibility window**

### Changed
- Replaced all insecure RNG/hash fallbacks in auth with `node:crypto`.
- Token IDs and random values use `crypto.randomBytes(32).toString('hex')`.
- Refresh token hashing uses `crypto.createHash('sha256').update(JWT_SECRET + value).digest('hex')`.
- Added `LEGACY_REFRESH_ACCEPT=true` (default) to accept legacy refresh-token keys in Redis during verification.
- On successful legacy refresh, the server rotates to a new refresh token (salted SHA-256 key) and revokes the old one.

### Notes
- No schema changes or route signature changes.
- No new dependencies; runtime behavior remains stable (cookie options unchanged).
- Sessions created pre-patch continue to refresh; on first refresh they migrate seamlessly to the new format.
- Redis will show the old key revoked and the new key present with the correct TTL.

## [2.0.2] - 2025-11-09 - 🔧 **Env-Driven CORS & .env Consolidation**

### Changed
- Backend server now reads allowed CORS origins from `CORS_ORIGINS` (comma-separated). If unset, it falls back to the previous hard-coded origins for safety.
- Consolidated `backend/.env.example`:
  - Added optional `MONGODB_DB_NAME` to match runtime configuration.
  - Clarified CORS comments to indicate env-driven behavior with fallback.
  - Corrected `ENCRYPTION_KEY` guidance to “at least 32 characters”.
  - Removed duplicate, unused JWT section to prevent confusion.

### Notes
- No changes to authentication logic, token flow, or database schemas.
- Existing MongoDB data remains compatible.
- Production configs remain valid; if `CORS_ORIGINS` is already set, behavior is unchanged.

## [2.0.3] - 2025-11-10 - 🧰 **Dev Startup Fix**

### Changed
- Updated dev script to preload environment variables via `dotenv` using Node’s `--import tsx` and `--watch` for hot reload.
  - `backend/package.json`: `"dev": "node --watch -r dotenv/config --import tsx src/server.ts"`
- Added minimal `backend/.env` with `ENCRYPTION_KEY` to satisfy the encryption service at startup.

### Notes
- No changes to authentication logic, token flow, or schemas.
- This fix targets local development only; production start already preloads dotenv.

## [2.0.4] - 2025-11-10 - 🔧 **Frontend Dev Proxy Fix**

### Changed
- Configured Vite dev proxy to forward `/api` requests to the backend on `http://localhost:8080` to prevent `404` errors from the frontend when calling auth routes.
  - `frontend/vite.config.ts`: `server.proxy['/api'].target = 'http://localhost:8080'`
  - `frontend/vite.config.js`: added equivalent proxy configuration to ensure consistent behavior regardless of config file resolution.

### Notes
- Resolves `POST http://localhost:5173/api/auth/login 404 (Not Found)` during local development.
- No changes to API routes or backend logic; this is a dev-only routing fix.

## [2.0.5] - 2025-11-10 - 🧹 **Vite Config Consolidation**

### Changed
- Standardized frontend config to TypeScript and removed duplicate JavaScript config.
  - Deleted `frontend/vite.config.js`.
  - Ensured `frontend/vite.config.ts` explicitly sets `server.port: 5173` and proxies `/api` to `http://localhost:8080`.

### Notes
- No runtime behavior change beyond dev server resolution; build and proxy settings remain as previously configured in the TypeScript config.
- Keeps project conventions consistent and prevents config drift.

## [2.0.6] - 2025-11-10 - 🧩 **TypeScript Config Compatibility**

### Changed
- Resolved IDE TypeScript diagnostic in `vite.config.ts` by explicitly typing the plugin list.
  - `frontend/vite.config.ts`: cast `plugins` to `PluginOption[]` to avoid cross-workspace Vite type mismatches.

### Notes
- Runtime behavior unchanged; fix targets TypeScript type resolution in monorepo workspaces.
    - Consider running `npm dedupe` at the repo root to reduce duplicate packages.

## [x.x.x] - 2025-11-10 - 🔒 **Env validation + remove hardcoded URI (no behavior change)**

### Changed
- Removed hardcoded MongoDB Atlas URI fallback from `backend/src/config/database.ts`. The backend now requires `MONGODB_URI` to be provided via environment.
- Added startup environment validation in `backend/src/server.ts` for:
  - `NODE_ENV` presence
  - `MONGODB_URI` presence
  - `JWT_SECRET` length (>= 32 chars)
  - `ENCRYPTION_KEY` length (>= 32 chars)
  - `REDIS_URL` presence (required in production, optional in development)
- Updated `backend/.env.example` with clarifying comments for each key.
- Updated `backend/README.md` with an environment variables table and Quick Start recap.

### Notes
- No changes to routes, auth logic, schemas, or token behavior.
- Production is safe: if Railway already has envs set, runtime behavior is unchanged.
- Rollback: revert this commit; do not reintroduce any hardcoded Atlas URI fallback.

## [2.0.1] - 2025-11-09 - 🔧 **Env & Docs Cleanup**

### Changed
- Removed unused `JWT_REFRESH_SECRET` and `ALLOW_ORIGIN` from `backend/.env.production` to reflect current refresh token implementation (opaque tokens stored in Redis).
- Clarified `ENCRYPTION_KEY` requirement to be "at least 32 characters" to match encryption utility validation.
- Updated `backend/README.md` environment variables to remove `JWT_REFRESH_SECRET`, add `REDIS_URL`, and document the refresh token mechanism.

### Notes
- No runtime code changes were made; authentication behavior remains the same.
- Existing data in MongoDB is unaffected.

## [2.0.0] - 2024-01-XX - 🚀 **Major System Evolution**

### 🌟 **System Transformation**
- **BREAKING**: Evolved from simple bill generator to comprehensive business management system
- **BREAKING**: Rebranded from "TMR Bill Generator" to "Gunawardhana Motors Business Management System"
- **NEW**: Complete system architecture overhaul with enterprise-grade features

### ✨ **New Features**

#### 🏢 **Business Management**
- **Quotation System**: Complete quotation management with insurance claims support
- **Advanced Inventory**: Real-time stock tracking with analytics and batch operations
- **User Management**: Role-based access control with comprehensive user profiles
- **Activity Tracking**: Complete audit trails for all user actions
- **Professional Reporting**: LaTeX-quality PDF reports with business intelligence

#### 🔐 **Security & Compliance**
- **Field-level Encryption**: Sensitive data protection using MongoDB encryption
- **GDPR Compliance**: Complete data protection framework with user rights
- **JWT Authentication**: Secure token-based auth with refresh token rotation
- **Rate Limiting**: API abuse prevention with configurable limits
- **Security Monitoring**: Real-time threat detection and logging

#### 🎨 **User Experience**
- **Dark/Light Themes**: Consistent theming across all components
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Live data synchronization across all modules
- **Accessibility**: WCAG compliant interface design
- **Modern UI**: Complete redesign with Ant Design components

#### 📊 **Advanced Analytics**
- **Business Intelligence**: KPI dashboards and performance metrics
- **Inventory Analytics**: Stock insights with actionable recommendations
- **Financial Reporting**: Revenue tracking and payment analysis
- **Custom Reports**: Flexible reporting system with PDF generation

### 🛠️ **Technical Improvements**

#### Backend Enhancements
- **TypeScript Migration**: Complete codebase conversion to TypeScript
- **API Restructure**: RESTful API design with comprehensive endpoints
- **Database Optimization**: MongoDB with optimized schemas and indexing
- **Error Handling**: Comprehensive error management with structured responses
- **Logging System**: Winston-based structured logging with multiple levels

#### Frontend Modernization
- **React 18**: Upgraded to latest React with modern hooks and patterns
- **Vite Build System**: Fast development and optimized production builds
- **TailwindCSS**: Utility-first styling with custom design system
- **State Management**: Context API for global state management
- **Component Library**: Reusable component system with consistent styling

#### Infrastructure
- **Cloudflare Pages**: Frontend deployment with global CDN
- **Railway Backend**: Scalable backend hosting with automatic deployments
- **MongoDB Atlas**: Cloud database with global clusters and encryption
- **Docker Support**: Containerized development and deployment

### 🔄 **Migration & Compatibility**
- **Data Migration**: Automatic migration scripts for existing data
- **API Versioning**: Backward compatibility for existing integrations
- **Configuration**: Environment-based configuration management

### 📚 **Documentation**
- **Complete Rewrite**: Professional documentation with comprehensive guides
- **API Reference**: Detailed API documentation with examples
- **Development Guide**: Setup and contribution guidelines
- **Business Workflows**: User manuals and process documentation

### 🐛 **Bug Fixes**
- Fixed inventory synchronization issues
- Resolved PDF generation memory leaks
- Corrected authentication token handling
- Fixed responsive design issues on mobile devices
- Resolved dark mode inconsistencies

### 🔧 **Maintenance**
- Updated all dependencies to latest stable versions
- Improved build processes and deployment pipelines
- Enhanced error monitoring and alerting
- Optimized database queries and performance

---

## [1.0.0] - 2023-XX-XX - 🎯 **Initial Release**

### ✨ **Core Features**
- Basic bill generation for motorcycle sales
- Simple inventory tracking
- PDF invoice generation
- Customer data management
- Payment type support (cash/leasing)

### 🛠️ **Technical Foundation**
- Node.js backend with Express
- React frontend with basic styling
- MongoDB database
- Basic authentication system

### 📋 **Business Logic**
- RMV/CPZ charge calculations
- Vehicle type handling (motorcycles, e-bicycles, tricycles)
- Basic bill status management
- Simple customer records

---

## 🚀 **Future Roadmap**

### Version 2.1.0 - **Enhanced Analytics**
- Advanced business intelligence dashboards
- Predictive inventory analytics
- Customer behavior insights
- Financial forecasting tools

### Version 2.2.0 - **Mobile Application**
- Native mobile app for iOS and Android
- Offline capability for field operations
- Push notifications for important updates
- Mobile-optimized workflows

### Version 2.3.0 - **Integration Platform**
- Third-party accounting software integration
- Bank payment gateway integration
- Government system integrations
- API marketplace for extensions

---

## 📞 **Support & Migration**

For assistance with upgrades or migration:
- **Developer**: [Uminda Herath](https://github.com/Spyboss)
- **Email**: contact@uhadev.com
- **Documentation**: [System Docs](./docs/README.md)
## [2.0.7] - 2025-11-10 - 🔐 **Environment Secrets Cleanup**
- Scrubbed real credentials from `backend/.env.production`, replacing with safe placeholders and clear instructions.
- Strengthened `.gitignore` in root and backend to ignore `.env` and `.env.*` globally, while keeping example files tracked.
- Updated `backend/.env.example` with guidance and generic domains; noted dev proxy behavior for CORS.
- Updated `frontend/.env.example` to recommend using `VITE_API_URL=/api` for dev with Vite proxy and set local direct URL to `http://localhost:8080/api`.
- Non-destructive: no production routes or database schema changes.
