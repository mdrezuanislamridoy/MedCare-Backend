import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const medicalRecordStorage = diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = join(process.cwd(), 'uploads', 'medical-records');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    callback(null, `record-${uniqueSuffix}${ext}`);
  },
});

export const medicalRecordFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Invalid file format (${file.mimetype}). Allowed types: PDF, JPEG, PNG, WEBP.`,
      ),
      false,
    );
  }
  callback(null, true);
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
