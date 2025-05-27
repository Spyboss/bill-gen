# 📚 Gunawardhana Motors Documentation

**Comprehensive documentation for the Gunawardhana Motors Business Management System**

## 🗂️ Documentation Structure

### 🏗️ **Development**
Complete guides for developers working on the system.

| Document | Description |
|----------|-------------|
| [Setup Guide](./development/setup.md) | Development environment setup |
| [Workflow](./development/workflow.md) | Development processes and standards |
| [New Features](./development/new-features.md) | Feature development guidelines |

### 🗄️ **Data Models**
Detailed documentation of all database schemas and relationships.

| Document | Description |
|----------|-------------|
| [Models Overview](./models/README.md) | Complete model documentation index |
| [Bill Schema](./models/bill-schema.md) | Sales transaction data structure |
| [Inventory Schema](./models/inventory-schema.md) | Bike inventory management |
| [Bike Models](./models/bike-models.md) | Available motorcycle models |

### 🔄 **Business Workflows**
Documentation of business processes and operational procedures.

| Document | Description |
|----------|-------------|
| [Workflow Overview](./workflow/README.md) | Business process documentation |
| [Bill Generation](./workflow/bill-generation.md) | Sales transaction workflow |
| [Inventory Management](./workflow/inventory-management.md) | Stock management processes |
| [Payment Types](./workflow/payment-types.md) | Payment processing workflows |

## 🚀 Quick Navigation

### For Developers
- **Getting Started**: [Development Setup](./development/setup.md)
- **API Reference**: [Backend README](../backend/README.md)
- **Frontend Guide**: [Frontend README](../frontend/README.md)

### For Business Users
- **User Manual**: [Business Workflows](./workflow/README.md)
- **Feature Guide**: [System Overview](../README.md#-core-features)

### For System Administrators
- **Deployment**: [Production Setup](../README.md#-production-deployment)
- **Security**: [Data Models](./models/README.md#-security-features)

## 📋 System Overview

The Gunawardhana Motors Business Management System is a comprehensive solution that includes:

- **Sales Management** - Complete bill lifecycle management
- **Inventory Control** - Real-time stock tracking and analytics
- **Quotation System** - Insurance claims and estimate management
- **User Management** - Role-based access and activity tracking
- **Reporting** - Professional PDF generation and analytics
- **Security** - Enterprise-grade data protection

## 🔧 Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   React + Vite  │◄──►│  Node.js + TS   │◄──►│  MongoDB Atlas  │
│   Cloudflare    │    │    Railway      │    │   + Encryption  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📞 Support

For technical support or questions:

- **Developer**: [Uminda Herath](https://github.com/Spyboss)
- **Email**: contact@uhadev.com
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
