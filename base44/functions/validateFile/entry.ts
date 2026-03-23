import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        valid: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { fileSize, fileType, fileName, mediaType } = await req.json();

    const errors = [];

    // Validate file size
    const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (fileSize > maxSize) {
      errors.push(`File size exceeds ${Math.floor(maxSize / 1024 / 1024)}MB limit`);
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[mediaType === 'photo' ? 'image' : mediaType] || [];
    if (!allowedTypes.includes(fileType)) {
      errors.push('File type not supported for this media category');
    }

    // Validate file name (prevent path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      errors.push('Invalid file name');
    }

    return Response.json({
      valid: errors.length === 0,
      errors,
      maxSize,
      allowedTypes
    });

  } catch (error) {
    return Response.json({ 
      valid: false, 
      error: 'Validation failed' 
    }, { status: 500 });
  }
});