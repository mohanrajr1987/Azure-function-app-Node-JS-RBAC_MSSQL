import { BlobServiceClient } from '@azure/storage-blob';
import { config } from '../config/config.js';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class StorageService {
  constructor() {
    this.isAzureConfigured = Boolean(config.azure.storageAccount && config.azure.storageKey);
    
    if (this.isAzureConfigured) {
      const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.azure.storageAccount};AccountKey=${config.azure.storageKey};EndpointSuffix=core.windows.net`;
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(config.azure.containerName);
    }
    
    this.localUploadPath = process.env.LOCAL_UPLOAD_PATH || './uploads';
  }

  async initialize() {
    if (this.isAzureConfigured) {
      try {
        await this.containerClient.createIfNotExists();
      } catch (error) {
        console.error('Failed to initialize Azure Storage:', error);
        this.isAzureConfigured = false;
      }
    }

    // Ensure local upload directory exists
    try {
      await fs.mkdir(this.localUploadPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create local upload directory:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    
    if (this.isAzureConfigured) {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(uniqueFileName);
        await blockBlobClient.uploadData(file.buffer);
        
        return {
          filename: uniqueFileName,
          path: blockBlobClient.url,
          size: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
          provider: 'azure'
        };
      } catch (error) {
        console.error('Azure upload failed, falling back to local storage:', error);
      }
    }

    // Local storage fallback
    const localFilePath = path.join(this.localUploadPath, uniqueFileName);
    await fs.writeFile(localFilePath, file.buffer);
    
    return {
      filename: uniqueFileName,
      path: localFilePath,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      provider: 'local'
    };
  }

  async downloadFile(filename, provider) {
    if (provider === 'azure' && this.isAzureConfigured) {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
        const downloadResponse = await blockBlobClient.download();
        return downloadResponse.readableStreamBody;
      } catch (error) {
        console.error('Azure download failed:', error);
        throw new Error('File not found');
      }
    } else {
      const localFilePath = path.join(this.localUploadPath, filename);
      try {
        const fileStream = await fs.readFile(localFilePath);
        return fileStream;
      } catch (error) {
        console.error('Local file download failed:', error);
        throw new Error('File not found');
      }
    }
  }

  async deleteFile(filename, provider) {
    if (provider === 'azure' && this.isAzureConfigured) {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
        await blockBlobClient.delete();
      } catch (error) {
        console.error('Azure delete failed:', error);
        throw new Error('Failed to delete file');
      }
    } else {
      const localFilePath = path.join(this.localUploadPath, filename);
      try {
        await fs.unlink(localFilePath);
      } catch (error) {
        console.error('Local file deletion failed:', error);
        throw new Error('Failed to delete file');
      }
    }
  }
}

export default new StorageService();
