import { Document } from '../models/index.js';
import storageService from '../services/storage.js';

export const documentController = {
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Upload file to storage
      const fileInfo = await storageService.uploadFile(req.file);

      // Create document record
      const document = await Document.create({
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        path: fileInfo.path,
        uploadedBy: req.user.id,
        isPublic: req.body.isPublic || false,
        metadata: {
          provider: fileInfo.provider,
          ...req.body.metadata
        }
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  },

  async uploadMultipleDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedDocuments = [];
      const errors = [];

      // Process each file
      for (const file of req.files) {
        try {
          const fileInfo = await storageService.uploadFile(file);
          const document = await Document.create({
            filename: fileInfo.filename,
            originalName: fileInfo.originalName,
            mimeType: fileInfo.mimeType,
            size: fileInfo.size,
            path: fileInfo.path,
            uploadedBy: req.user.id,
            isPublic: req.body.isPublic || false,
            metadata: {
              provider: fileInfo.provider,
              ...req.body.metadata
            }
          });
          uploadedDocuments.push(document);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.status(201).json({
        message: 'Documents processed',
        uploaded: uploadedDocuments,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Multiple documents upload error:', error);
      res.status(500).json({ message: 'Failed to process documents' });
    }
  },

  async getDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check access permissions
      if (!document.isPublic && document.uploadedBy !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get file from storage
      const fileBuffer = await storageService.downloadFile(
        document.filename,
        document.metadata.provider
      );

      // Set response headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);

      // Send file
      res.send(fileBuffer);
    } catch (error) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Failed to download document' });
    }
  },

  async listDocuments(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const documents = await Document.findAndCountAll({
        where: {
          [Op.or]: [
            { uploadedBy: req.user.id },
            { isPublic: true }
          ]
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        documents: documents.rows,
        total: documents.count,
        page: parseInt(page),
        totalPages: Math.ceil(documents.count / limit)
      });
    } catch (error) {
      console.error('List documents error:', error);
      res.status(500).json({ message: 'Failed to list documents' });
    }
  },

  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const { isPublic, metadata } = req.body;

      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check ownership
      if (document.uploadedBy !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update document
      if (typeof isPublic === 'boolean') document.isPublic = isPublic;
      if (metadata) {
        document.metadata = {
          ...document.metadata,
          ...metadata
        };
      }

      await document.save();

      res.json({
        message: 'Document updated successfully',
        document
      });
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({ message: 'Failed to update document' });
    }
  },

  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await Document.findByPk(id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Check ownership
      if (document.uploadedBy !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete from storage
      await storageService.deleteFile(
        document.filename,
        document.metadata.provider
      );

      // Delete from database
      await document.destroy();

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  }
};
