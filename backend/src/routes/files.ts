import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { prisma } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.STORAGE_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const { roomId, messageId } = req.body;
    const file = req.file;

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (file.mimetype.startsWith('image/')) {
      try {
        const thumbnailName = `thumb_${file.filename}`;
        const thumbnailPath = path.join(path.dirname(file.path), thumbnailName);
        
        await sharp(file.path)
          .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        thumbnailUrl = `/uploads/${thumbnailName}`;
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    }

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        userId: req.user!.id,
        roomId: roomId || null,
        messageId: messageId || null,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        thumbnailUrl
      }
    });

    res.json({
      success: true,
      data: { file: fileRecord }
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req: AuthRequest, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      });
    }

    const { roomId, messageId } = req.body;
    const fileRecords = [];

    for (const file of files) {
      // Generate thumbnail for images
      let thumbnailUrl = null;
      if (file.mimetype.startsWith('image/')) {
        try {
          const thumbnailName = `thumb_${file.filename}`;
          const thumbnailPath = path.join(path.dirname(file.path), thumbnailName);
          
          await sharp(file.path)
            .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          thumbnailUrl = `/uploads/${thumbnailName}`;
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
        }
      }

      // Save file record to database
      const fileRecord = await prisma.file.create({
        data: {
          userId: req.user!.id,
          roomId: roomId || null,
          messageId: messageId || null,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          thumbnailUrl
        }
      });

      fileRecords.push(fileRecord);
    }

    res.json({
      success: true,
      data: { files: fileRecords }
    });
  } catch (error) {
    next(error);
  }
});

// Get file by ID
router.get('/:fileId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check if user has access to this file
    if (file.roomId) {
      const membership = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId: file.roomId,
            userId: req.user!.id
          }
        }
      });

      if (!membership || !membership.isActive) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }
    } else if (file.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    res.json({
      success: true,
      data: { file }
    });
  } catch (error) {
    next(error);
  }
});

// Get files for a room
router.get('/room/:roomId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, cursor } = req.query;

    // Check if user is a member
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const whereClause: any = {
      roomId,
      isDeleted: false
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Get next cursor
    const nextCursor = files.length === parseInt(limit as string) 
      ? files[files.length - 1].id 
      : null;

    res.json({
      success: true,
      data: { 
        files,
        nextCursor 
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check if user owns the file or has admin permissions
    if (file.userId !== req.user!.id) {
      if (file.roomId) {
        const membership = await prisma.roomMember.findUnique({
          where: {
            roomId_userId: {
              roomId: file.roomId,
              userId: req.user!.id
            }
          }
        });

        if (!membership || !membership.isActive || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
          return res.status(403).json({
            success: false,
            error: { message: 'Insufficient permissions' }
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }
    }

    // Soft delete file
    const deletedFile = await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true }
    });

    // Delete physical file
    try {
      const filePath = path.join(process.env.STORAGE_PATH || './uploads', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (file.thumbnailUrl) {
        const thumbnailPath = path.join(process.env.STORAGE_PATH || './uploads', path.basename(file.thumbnailUrl));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }

    res.json({
      success: true,
      data: { file: deletedFile }
    });
  } catch (error) {
    next(error);
  }
});

// Serve uploaded files
router.get('/serve/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.env.STORAGE_PATH || './uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
});

export { router as fileRoutes };
