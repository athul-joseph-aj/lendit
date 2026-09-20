// src/pages/ListItem.jsx
// Route: /list-item  (Protected)
// Full item listing form with Firebase Storage image upload and Firestore save.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import { itemsCol } from '../firebase/collections';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  Upload,
  X,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  Package,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Cameras',
  'Laptops',
  'Tools',
  'Event Equipment',
  'Vehicles',
  'Household',
  'Other',
];

const PRICE_UNITS = ['hour', 'day', 'week'];

const INITIAL_FORM = {
  name: '',
  category: '',
  description: '',
  price: '',
  priceUnit: 'day',
  securityDeposit: '',
  location: '',
  availability: true,
};

export default function ListItem() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // ── Field change handler ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Image selection ──────────────────────────────────────
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      setError(t('maxImages'));
      return;
    }
    setError('');
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.category || !form.price || !form.location.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    setUploading(true);
    try {
      // Upload images to Firebase Storage
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const path = `items/${currentUser.uid}/${Date.now()}_${file.name}`;
          const fileRef = storageRef(storage, path);
          const snap = await uploadBytes(fileRef, file);
          return getDownloadURL(snap.ref);
        })
      );

      // Save item document to Firestore
      await addDoc(itemsCol, {
        ownerId:         currentUser.uid,
        name:            form.name.trim(),
        category:        form.category,
        description:     form.description.trim(),
        images:          imageUrls,
        price:           parseFloat(form.price),
        priceUnit:       form.priceUnit,
        securityDeposit: parseFloat(form.securityDeposit) || 0,
        location:        form.location.trim(),
        availability:    form.availability,
        rating:          0,
        createdAt:       serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/owner/listings'), 1800);
    } catch (err) {
      console.error('List item error:', err);
      setError(err.message || t('error'));
    } finally {
      setUploading(false);
    }
  };

  // ── Success screen ───────────────────────────────────────
  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-9 h-9 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t('itemListed')}</h2>
        <p className="text-gray-500 text-sm">Redirecting to your listings...</p>
      </div>
    );
  }

  return (
    <div className="container-main py-6 md:py-10 flex-1">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('listItem')}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Fill in the details below to list your item for rent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Item Name ── */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Basic Information
            </h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('itemName')} <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Canon EOS 90D Camera"
                  required
                  className="input"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Tag className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                  {t('categories')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="input bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <FileText className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                  {t('description')}
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your item, condition, included accessories..."
                  className="input resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Images ── */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              {t('uploadImages')}
              <span className="text-xs text-gray-400 font-normal">({t('maxImages')})</span>
            </h2>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {imageFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="w-7 h-7" />
                <span className="text-sm font-medium">{t('addImages')}</span>
                <span className="text-xs">PNG, JPG up to 10MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* ── Pricing ── */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('rentalPrice')} (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="input"
                />
              </div>

              {/* Price unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('priceUnit')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="priceUnit"
                  value={form.priceUnit}
                  onChange={handleChange}
                  className="input bg-white"
                >
                  {PRICE_UNITS.map((u) => (
                    <option key={u} value={u}>{t(u)}</option>
                  ))}
                </select>
              </div>

              {/* Security deposit */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
                  {t('securityDeposit')} (₹)
                </label>
                <input
                  name="securityDeposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.securityDeposit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* ── Location & Availability ── */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {t('location')} & {t('availability')}
            </h2>
            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('location')} <span className="text-red-500">*</span>
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Kochi, Kerala"
                  required
                  className="input"
                />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('availability')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.availability ? t('availableNow') : t('unavailable')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, availability: !prev.availability }))}
                  className="transition-colors"
                >
                  {form.availability ? (
                    <ToggleRight className="w-10 h-10 text-primary" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="btn btn-secondary btn-lg flex-1"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="btn btn-primary btn-lg flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('imageUploading')}
                </>
              ) : (
                t('listItem')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
