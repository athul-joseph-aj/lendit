// src/pages/services/RequestForm.jsx
// Service request form — saves to Firestore serviceRequests collection.
// No authentication required.

import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin,
  FileText, DollarSign, ImagePlus, CheckCircle2, Loader2,
  User, Phone, Navigation, AlertCircle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import { getActiveUserId, getCustomerInfo, saveCustomerInfo } from '../../utils/userSession';
import { uploadImageSafely } from '../../utils/imageUpload';
import { SERVICE_CATEGORIES } from '../Services';

export default function RequestForm() {
  const { providerId } = useParams();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { provider, loading: providerLoading } = useProviderProfile(providerId);
  const fileRef = useRef(null);

  const savedCustomer = getCustomerInfo(currentUser);

  const [form, setForm] = useState({
    customerName:    savedCustomer.name || '',
    customerPhone:   savedCustomer.phone || '',
    serviceCategory: '',
    description:     '',
    date:            new Date().toISOString().split('T')[0],
    time:            '10:00 AM',
    location:        '',
    estimatedBudget: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.suburb || 'Local Area';
          setForm((prev) => ({ ...prev, location: city }));
        } catch {
          setForm((prev) => ({ ...prev, location: 'Near My Location' }));
        } finally {
          setDetectingLocation(false);
        }
      },
      () => setDetectingLocation(false),
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError(t('problemDescription') + ' is required.');
      return;
    }
    if (!form.customerName.trim()) {
      setError('Please provide your name so the service provider knows who to contact.');
      return;
    }
    if (!form.customerPhone.trim()) {
      setError('Please provide your phone number so the provider can confirm the booking.');
      return;
    }
    if (!form.date || !form.time) {
      setError(t('preferredDate') + ' and ' + t('preferredTime') + ' are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const activeCustomerId = getActiveUserId(currentUser);
      saveCustomerInfo(form.customerName.trim(), form.customerPhone.trim());

      // Safe image upload
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageSafely(
          imageFile,
          `serviceRequests/${activeCustomerId}_${Date.now()}`
        );
      }

      const primaryService = provider?.services?.[0] ?? 'other';
      const requestData = {
        customerId:      activeCustomerId,
        customerName:    form.customerName.trim(),
        customerPhone:   form.customerPhone.trim(),
        providerId:      providerId,
        providerName:    provider?.name ?? 'Provider',
        serviceCategory: form.serviceCategory || primaryService,
        description:     form.description.trim(),
        date:            form.date,
        time:            form.time,
        location:        form.location.trim() || provider?.location || 'Direct Visit',
        imageUrl:        imageUrl || '',
        estimatedBudget: parseFloat(form.estimatedBudget) || provider?.startingPrice || 0,
        status:          'pending',
        createdAt:       serverTimestamp(),
      };

      await addDoc(collection(db, 'serviceRequests'), requestData);
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting service request:', err);
      setError(err.message || 'Failed to submit service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('requestSent')}</h2>
        <p className="text-gray-500 mb-8 max-w-sm">{t('requestSentDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/services/my-requests"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm"
          >
            {t('goToRequests')}
          </Link>
          <Link
            to="/services"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            {t('services')}
          </Link>
        </div>
      </div>
    );
  }

  const primaryService = provider?.services?.[0] ?? 'other';

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to={providerId ? `/services/provider/${providerId}` : '/services'}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {provider?.name ? `${provider.name}'s Profile` : t('services')}
          </Link>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('requestService')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Booking service with <span className="font-semibold text-gray-900">{provider?.name || 'Service Provider'}</span>
              {provider?.startingPrice && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Starts at ₹{provider.startingPrice}
                </span>
              )}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 m-6 mb-0 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Customer Details: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Service Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('service')} *
              </label>
              <select
                name="serviceCategory"
                value={form.serviceCategory || primaryService}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
              >
                {provider?.services?.map((slug) => {
                  const cat = SERVICE_CATEGORIES.find((c) => c.slug === slug);
                  return (
                    <option key={slug} value={slug}>
                      {cat?.emoji} {t(cat?.key || slug)}
                    </option>
                  );
                }) || (
                  <option value={primaryService}>
                    {t(SERVICE_CATEGORIES.find((c) => c.slug === primaryService)?.key || primaryService)}
                  </option>
                )}
              </select>
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('problemDescription')} *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                required
                placeholder={t('problemPlaceholder')}
                className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('preferredDate')} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('preferredTime')} *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 10:00 AM"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('yourLocation')} *
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4682B4] hover:text-[#3b6f9a]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{detectingLocation ? 'Detecting...' : 'Use My GPS'}</span>
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder={provider?.location ? `e.g. Near ${provider.location}` : t('locationPlaceholder')}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                />
              </div>
            </div>

            {/* Budget & Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('estimatedBudget')} (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₹</span>
                  <input
                    type="number"
                    name="estimatedBudget"
                    value={form.estimatedBudget}
                    onChange={handleChange}
                    placeholder={provider?.startingPrice ? `Starts at ${provider.startingPrice}` : 'e.g. 500'}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('optionalImage')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <ImagePlus className="w-4 h-4 text-gray-400" />
                    <span>{imagePreview ? 'Change Photo' : t('uploadImage')}</span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="hidden"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>{t('sendRequest')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
