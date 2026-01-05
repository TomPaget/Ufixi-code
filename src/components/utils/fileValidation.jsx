// File validation utilities

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/mpeg'
];

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a'
];

export function validateFile(file, type = 'photo') {
  const errors = [];

  if (!file) {
    return { valid: false, errors: ['No file provided'] };
  }

  // Check file size
  const maxSize = type === 'video' ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${Math.floor(maxSize / 1024 / 1024)}MB limit`);
  }

  // Check file type
  let allowedTypes = [];
  switch (type) {
    case 'photo':
      allowedTypes = ALLOWED_IMAGE_TYPES;
      break;
    case 'video':
      allowedTypes = ALLOWED_VIDEO_TYPES;
      break;
    case 'audio':
      allowedTypes = ALLOWED_AUDIO_TYPES;
      break;
    default:
      allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES];
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported`);
  }

  return {
    valid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeFormatted: formatFileSize(file.size)
    }
  };
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}