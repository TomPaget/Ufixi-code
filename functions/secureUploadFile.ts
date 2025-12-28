import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const RATE_LIMIT = 10; // uploads per minute
const RATE_WINDOW = 60000; // 1 minute

const uploadCounts = new Map();

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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const userUploads = uploadCounts.get(user.id) || [];
    const recentUploads = userUploads.filter(time => now - time < RATE_WINDOW);
    
    if (recentUploads.length >= RATE_LIMIT) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please wait before uploading again.' 
      }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const mediaType = formData.get('mediaType') || 'photo';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return Response.json({ 
        error: `File too large. Max size: ${Math.floor(maxSize / 1024 / 1024)}MB` 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[mediaType === 'photo' ? 'image' : mediaType] || [];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'File type not supported',
        allowedTypes 
      }, { status: 400 });
    }

    // Upload using Core integration with service role
    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Update rate limit
    recentUploads.push(now);
    uploadCounts.set(user.id, recentUploads);

    return Response.json(result);

  } catch (error) {
    return Response.json({ 
      error: 'Upload failed. Please try again.' 
    }, { status: 500 });
  }
});