// src/utils/cloudinary.js
// Upload images to Cloudinary using the unsigned upload preset.
// Docs: https://cloudinary.com/documentation/upload_images#unsigned_upload

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Upload a single image file to Cloudinary.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Upload multiple image files to Cloudinary.
 * @param {File[]} files - Array of image files to upload.
 * @returns {Promise<string[]>} - Array of secure URLs.
 */
export async function uploadMultipleImages(files) {
  return Promise.all(files.map(uploadImageToCloudinary));
}
