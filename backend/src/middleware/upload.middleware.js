const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, isCloudinaryReady } = require('../config/cloudinary');

function createStorage(folder) {
  if (!isCloudinaryReady) {
    return multer.memoryStorage();
  }

  return new CloudinaryStorage({
    cloudinary,
    params: async (request, file) => ({
      folder,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-').toLowerCase()}`,
    }),
  });
}

function createUploader(folder, limits) {
  return multer({
    storage: createStorage(folder),
    limits,
  });
}

const upload = createUploader('cbrpnk-chat/messages', {
  fileSize: 15 * 1024 * 1024,
  files: 6,
});

const avatarUpload = createUploader('cbrpnk-chat/avatars', {
  fileSize: 5 * 1024 * 1024,
  files: 1,
});

module.exports = {
  upload,
  avatarUpload,
};
