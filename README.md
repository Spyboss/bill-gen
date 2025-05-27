# 🏍️ Gunawardhana Motors Business Management System

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

**A comprehensive business management solution for motorcycle dealerships**

[🚀 Live Demo](https://gunawardanamotors.pages.dev) • [📖 Documentation](./docs) • [🐛 Report Bug](https://github.com/your-repo/issues)

</div>

---

## 🌟 Overview

What started as a simple bill generator has evolved into a **full-featured business management system** specifically designed for motorcycle dealerships. This enterprise-grade solution handles everything from sales and inventory to quotations and comprehensive reporting.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   React + Vite  │◄──►│  Node.js + TS   │◄──►│  MongoDB Atlas  │
│   Cloudflare    │    │    Railway      │    │   + Encryption  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: Modern React SPA with TypeScript, TailwindCSS, and Ant Design
- **Backend**: Scalable Node.js API with TypeScript, Express, and comprehensive security
- **Database**: MongoDB Atlas with field-level encryption for sensitive data
- **Deployment**: Cloudflare Pages (Frontend) + Railway (Backend)

## ✨ Core Features

### 🧾 **Sales Management**
- **Smart Bill Generation** - Automated calculations for different vehicle types
- **Payment Processing** - Support for cash, leasing, and advance payments
- **Status Tracking** - Real-time bill status management (pending, completed, cancelled)
- **PDF Generation** - Professional, branded invoices and receipts
- **Customer Management** - Secure customer data with encryption

### 📦 **Inventory Management**
- **Real-time Tracking** - Live inventory status across all locations
- **Batch Operations** - Efficient bulk inventory additions and updates
- **Lifecycle Management** - Track bikes from arrival to sale
- **Smart Analytics** - Inventory insights, stock alerts, and trend analysis
- **Integration** - Seamless connection with sales processes

### 💼 **Quotation System**
- **Insurance Claims** - Specialized quotations for insurance work
- **Estimate Management** - Professional estimates with conversion to invoices
- **Template System** - Standardized quotation formats
- **Client Communication** - Streamlined quotation approval workflow

### 👥 **User Management**
- **Role-based Access** - Admin, Manager, and User permission levels
- **Activity Tracking** - Comprehensive audit logs for all user actions
- **Profile Management** - User preferences and account settings
- **Security Features** - Multi-factor authentication and session management

### 📊 **Advanced Reporting**
- **Professional PDFs** - LaTeX-quality reports with company branding
- **Business Intelligence** - KPI dashboards and performance metrics
- **Inventory Reports** - Stock analysis with actionable insights
- **Financial Summaries** - Revenue tracking and payment analysis

### 🔒 **Enterprise Security**
- **Data Encryption** - Field-level encryption for sensitive information
- **GDPR Compliance** - Complete data protection and user rights
- **Rate Limiting** - API protection against abuse
- **Audit Trails** - Comprehensive activity logging

### 🎨 **Modern UI/UX**
- **Dark/Light Themes** - Consistent theming across all components
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Accessibility** - WCAG compliant interface design
- **Real-time Updates** - Live data synchronization

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **MongoDB** (Atlas recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gunawardhana-motors.git
   cd gunawardhana-motors
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8080`

## 🌐 Production Deployment

### Current Infrastructure
- **Frontend**: [Cloudflare Pages](https://gunawardanamotors.pages.dev)
- **Backend**: [Railway](https://bill-gen-production.up.railway.app)
- **Database**: MongoDB Atlas with global clusters
- **CDN**: Cloudflare for optimal performance

### Environment Configuration

<details>
<summary><strong>Backend Environment Variables</strong></summary>

```env
# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Security
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGINS=https://gunawardanamotors.pages.dev

# Application
NODE_ENV=production
PORT=8080
```
</details>

<details>
<summary><strong>Frontend Environment Variables</strong></summary>

```env
VITE_API_URL=https://bill-gen-production.up.railway.app
VITE_APP_NAME=Gunawardhana Motors
```
</details>

## 📚 Documentation

| Section | Description |
|---------|-------------|
| [📋 API Reference](./docs/api) | Complete API documentation |
| [🗄️ Database Schema](./docs/models) | Data models and relationships |
| [🔄 Workflows](./docs/workflow) | Business process documentation |
| [🛠️ Development](./docs/development) | Setup and contribution guide |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/development/README.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Author

**Uminda H. Aberathne** ([@Spyboss](https://github.com/Spyboss))
- 🌐 Website: [uhadev.com](https://uhadev.com)
- 📧 Email: contact@uhadev.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for Gunawardhana Motors
- Special thanks to the open-source community
- Powered by modern web technologies

---

<div align="center">
<strong>Made with ❤️ by <a href="https://github.com/Spyboss">@uhadev</a></strong>
</div>