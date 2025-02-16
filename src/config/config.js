import dotenv from 'dotenv';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Azure Key Vault configuration
const keyVaultName = process.env.KEY_VAULT_NAME;
const keyVaultUri = `https://${keyVaultName}.vault.azure.net`;

// Initialize Azure Key Vault client if in production
let secretClient;
if (isProduction) {
  const credential = new DefaultAzureCredential();
  secretClient = new SecretClient(keyVaultUri, credential);
}

// Function to get secret from Key Vault or environment variable
async function getSecret(secretName, fallback) {
  if (isProduction && secretClient) {
    try {
      const secret = await secretClient.getSecret(secretName);
      return secret.value;
    } catch (error) {
      console.warn(`Failed to get secret ${secretName} from Key Vault, using fallback`);
      return fallback;
    }
  }
  return fallback;
}

export const config = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: await getSecret('JWT-SECRET', process.env.JWT_SECRET),
    jwtExpiration: process.env.JWT_EXPIRATION || '24h'
  },
  database: {
    host: await getSecret('DB-HOST', process.env.DB_HOST),
    port: parseInt(process.env.DB_PORT || '1433'),
    name: await getSecret('DB-NAME', process.env.DB_NAME),
    username: await getSecret('DB-USERNAME', process.env.DB_USER),
    password: await getSecret('DB-PASSWORD', process.env.DB_PASSWORD),
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    logging: process.env.DB_LOGGING === 'true'
  },
  email: {
    host: await getSecret('SMTP-HOST', process.env.SMTP_HOST),
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: await getSecret('SMTP-USER', process.env.SMTP_USER),
      pass: await getSecret('SMTP-PASS', process.env.SMTP_PASS)
    }
  },
  azure: {
    storageAccount: await getSecret('STORAGE-ACCOUNT', process.env.AZURE_STORAGE_ACCOUNT),
    storageKey: await getSecret('STORAGE-KEY', process.env.AZURE_STORAGE_KEY),
    containerName: process.env.AZURE_STORAGE_CONTAINER || 'documents'
  }
};
