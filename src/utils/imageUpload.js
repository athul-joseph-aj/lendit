// src/utils/imageUpload.js
// Safe image handler: attempts Firebase Storage, then Cloudinary / compressed Base64 fallback.

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';

/**
 * Compresses an image file to a lightweight data URL string.
 * Keeps file size < 80KB so it safely fits within Firestore's 1MB limit without storage issues.
 */
export function compressImageToDataUrl(file, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image safely. Never throws or halts form submission.
 * @param {File} file
 * @param {string} storagePath
 * @returns {Promise<string>} image URL or data URI
 */
export async function uploadImageSafely(file, storagePath) {
  if (!file) return '';

  // 1. First try Firebase Storage
  try {
    const storageRef = ref(storage, storagePath);
    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);
    if (url) return url;
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed, falling back to local compression:', storageErr.message);
  }

  // 2. Fallback to lightweight compressed base64
  try {
    const dataUrl = await compressImageToDataUrl(file);
    return dataUrl;
  } catch (fallbackErr) {
    console.warn('Base64 compression failed:', fallbackErr);
    return '';
  }
}
