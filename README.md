# Node.js Azure Boilerplate

A production-ready Node.js boilerplate application with MSSQL, Sequelize ORM, and Azure Key Vault integration. This application follows security best practices and implements comprehensive user management, document handling, and role-based access control.

## Features

- 🔐 **User Management & Authentication**
  - JWT-based authentication
  - Role-Based Access Control (RBAC)
  - Password encryption with bcrypt

- 📄 **Document Management**
  - File upload/download functionality
  - Support for multiple file types
  - Secure file storage

- 🔒 **Security**
  - Azure Key Vault integration
  - Request validation
  - Security headers with Helmet
  - CORS configuration

- 📨 **Email Integration**
  - SMTP email service
  - Templated emails for user events
  - Async email processing

- 📊 **Database**
  - Microsoft SQL Server integration
  - Sequelize ORM
  - Database migrations and seeds
  - Super Admin user creation

- 📝 **API Documentation**
  - Swagger UI integration
  - API validation schemas
  - Request/Response examples

## Prerequisites

- Node.js 20 or higher
- Microsoft SQL Server
- Azure subscription (for Key Vault and deployment)
- SMTP server credentials

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd node-azure-boilerplate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   npm run seed
   ```

5. Start the application:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=1433
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# Azure Key Vault
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
KEY_VAULT_NAME=your_keyvault_name

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## Azure Deployment

1. Create Azure resources:
   - Azure Function App
   - Azure SQL Database
   - Azure Key Vault

2. Configure Azure Function App settings:
   ```bash
   az functionapp config appsettings set --name YourFunctionApp --resource-group YourResourceGroup --settings @settings.json
   ```

3. Deploy the application:
   ```bash
   az functionapp deployment source config-zip --resource-group YourResourceGroup --name YourFunctionApp --src dist/function.zip
   ```

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## API Documentation

Access Swagger UI documentation at:
```
http://localhost:3000/api-docs
```

## Super Admin Credentials

Default super admin credentials (change after first login):
- Email: admin@example.com
- Password: See the value in `seeders/superadmin.js`

## License

MIT
## .env.example:

# Azure Function Configuration
FUNCTIONS_WORKER_RUNTIME=node
NODE_ENV=development
WEBSITE_NODE_DEFAULT_VERSION=~20

# Database Configuration
DB_HOST=your-db-host
DB_PORT=1433
DB_NAME=your-db-name
DB_USER=your-db-username
DB_PASSWORD=your-db-password

# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=your-container-name

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=24h

# Azure Key Vault (Optional)
AZURE_KEY_VAULT_URL=your-key-vault-url
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging & Monitoring
LOG_LEVEL=info
APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
APPINSIGHTS_INSTRUMENTATIONKEY=your-instrumentation-key
APPLICATION_INSIGHTS_ROLE=azure-function-rbac
