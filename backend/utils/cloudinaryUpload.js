const cloudinary = require('../config/cloudinary');

const UPLOAD_OPTIONS = {
  folder: 'book-covers',
  transformation: [
    { quality: 'auto', fetch_format: 'auto' },
    { width: 400, crop: 'limit' },
  ],
};

// Upload from a Buffer (multer memoryStorage)
exports.uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(UPLOAD_OPTIONS, (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      })
      .end(buffer);
  });

// Upload from a remote URL (ISBN lookup or manually entered)
exports.uploadFromUrl = async (url) => {
  const result = await cloudinary.uploader.upload(url, UPLOAD_OPTIONS);
  return result.secure_url;
};
