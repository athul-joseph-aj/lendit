// src/pages/services/ProviderRegister.jsx
// Service Provider registration & details editor — 100% stored in Firebase Firestore.
// Zero localStorage used.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  CalendarCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useProviderProfile } from '../../hooks/services/useProviderProfile';
import { uploadImageSafely } from '../../utils/imageUpload';
import { SERVICE_CATEGORIES } from '../Services';

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' },
];

const POPULAR_LOCATIONS = [
  'Kochi',
  'Chengannur',
  'Trivandrum',
  'Kozhikode',
  'Bangalore',
  'Chennai',
];

const WORKING_HOURS_PRESETS = [
  'Full Day (9 AM - 6 PM)',
  'Morning (8 AM - 1 PM)',
  'Evening (2 PM - 8 PM)',
  'Flexible / 24/7',
];

const PRICE_PRESETS = [199, 299, 499, 799];

export default function ProviderRegister() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { provider: existingProfile, loading: profileLoading } = useProviderProfile(currentUser?.uid);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    experience: '3',
    location: '',
    startingPrice: '299',
    workingHours: 'Full Day (9 AM - 6 PM)',
    about: '',
  });

  const [selectedServices, setSelectedServices] = useState(['electrician']);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [isAvailable, setIsAvailable] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedDocId, setSavedDocId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill existing data if provider profile already exists in Firebase
  useEffect(() => {
    if (existingProfile) {
      setForm({
        name: existingProfile.name || '',
        phone: existingProfile.phone || '',
        experience: existingProfile.experience?.toString() || '3',
        location: existingProfile.location || '',
        startingPrice: existingProfile.startingPrice?.toString() || '299',
        workingHours: existingProfile.workingHours || 'Full Day (9 AM - 6 PM)',
        about: existingProfile.about || '',
      });
      if (Array.isArray(existingProfile.services) && existingProfile.services.length > 0) {
        setSelectedServices(existingProfile.services);
      }
      if (Array.isArray(existingProfile.availability) && existingProfile.availability.length > 0) {
        setSelectedDays(existingProfile.availability);
      }
      if (existingProfile.isAvailable !== undefined) {
        setIsAvailable(existingProfile.isAvailable);
      }
      if (existingProfile.profileImage) {
        setExistingImageUrl(existingProfile.profileImage);
        setImagePreview(existingProfile.profileImage);
      }
    }
  }, [existingProfile]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleService = (slug) => {
    setSelectedServices((prev) =>
      prev.includes(slug)
        ? prev.length > 1 ? prev.filter((s) => s !== slug) : prev
        : [...prev, slug]
    );
  };

  const toggleDay = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const applyDayPreset = (presetType) => {
    if (presetType === 'all') {
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    } else if (presetType === 'weekdays') {
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    } else if (presetType === 'weekends') {
      setSelectedDays(['Sat', 'Sun']);
    }
  };

  // Geolocation detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state || 'Local Area';
          setForm((prev) => ({ ...prev, location: city }));
        } catch {
          setForm((prev) => ({ ...prev, location: 'Near My Location' }));
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        setError('Could not access current location. Please type your city/area.');
      },
      { timeout: 8000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError(t('authRequired'));
      return;
    }

    if (!form.name.trim()) {
      setError(t('providerName') || 'Name is required.');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required so clients can contact you.');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one service category.');
      return;
    }
    if (!form.location.trim()) {
      setError('Please enter your service location or city.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // A provider profile belongs to the authenticated Firebase user.
      const providerDocId = currentUser.uid;

      // Safe image upload directly to cloud
      let profileImageUrl = existingImageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImageSafely(
          imageFile,
          `serviceProviders/${providerDocId}/profile_${Date.now()}`
        );
        if (uploadedUrl) profileImageUrl = uploadedUrl;
      }

      const providerData = {
        userId: currentUser.uid,
        name: form.name.trim(),
        phone: form.phone.trim(),
        services: selectedServices,
        experience: Number(form.experience) || 1,
        location: form.location.trim(),
        startingPrice: Number(form.startingPrice) || 299,
        workingHours: form.workingHours,
        about: form.about.trim() || `Experienced service professional in ${form.location.trim()}.`,
        profileImage: profileImageUrl,
        availability: selectedDays,
        isAvailable: isAvailable,
        rating: existingProfile?.rating || 4.9,
        reviewCount: existingProfile?.reviewCount || 1,
        updatedAt: serverTimestamp(),
      };

      if (!existingProfile) {
        providerData.createdAt = serverTimestamp();
      }

      // 100% saved directly in Firebase Firestore — no localStorage
      await setDoc(doc(db, 'serviceProviders', providerDocId), providerData, { merge: true });

      setSavedDocId(providerDocId);
      setSuccess(true);
    } catch (err) {
      console.error('Error saving provider profile to Firebase Firestore:', err);
      setError(err.message || 'Failed to save details. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4682B4]" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/services"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('services')}
          </Link>

          <Link
            to="/services/provider-dashboard"
            className="text-xs font-semibold text-[#4682B4] hover:underline"
          >
            {t('providerDashboard')} →
          </Link>
        </div>

        {/* Success Modal / Banner */}
        {success ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Details Saved in Firebase!
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              Your service provider profile is live in Firebase Firestore. Customers in{' '}
              <span className="font-semibold text-gray-900">{form.location}</span> can discover and book your services.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/services/provider/${savedDocId}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm"
              >
                View Public Profile
              </Link>
              <Link
                to={`/services/provider-dashboard?providerId=${savedDocId}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Edit Details
              </button>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4682B4]/10 text-[#4682B4] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Saved Directly to Firebase • Cloud Database</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {existingProfile ? 'Update Provider Details' : 'Add Service Provider Details'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Add your services, location, and availability schedule in 2 minutes.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 m-6 mb-0 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* 1. Basic Info: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Service Category Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Services You Provide * (Click to choose)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isSelected = selectedServices.includes(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => toggleService(cat.slug)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                          isSelected
                            ? 'border-[#4682B4] bg-[#4682B4]/10 text-[#4682B4] font-semibold ring-1 ring-[#4682B4]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                        }`}
                      >
                        <span className="text-base">{cat.emoji}</span>
                        <span className="truncate">{t(cat.key)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Location (Simple, with chips & GPS detect) */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Service Location / City *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4682B4] hover:text-[#3b6f9a] transition-colors"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                    <span>{detectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                    placeholder="Enter city or area (e.g. Kochi, Chengannur, Bangalore)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                  />
                </div>

                {/* Quick 1-tap City Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-gray-400 mr-1">Quick Select:</span>
                  {POPULAR_LOCATIONS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, location: city }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        form.location === city
                          ? 'bg-[#4682B4] text-white border-[#4682B4]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Availability & Working Schedule (Simple Way) */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                  <div>
                    <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Availability Status
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {isAvailable ? '🟢 Currently accepting new service requests' : '🔴 Temporarily paused'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAvailable ? 'bg-[#4682B4]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Available Days */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Available Days
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => applyDayPreset('all')}
                        className="text-[#4682B4] hover:underline"
                      >
                        All 7 Days
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={() => applyDayPreset('weekdays')}
                        className="text-[#4682B4] hover:underline"
                      >
                        Mon-Fri
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={() => applyDayPreset('weekends')}
                        className="text-[#4682B4] hover:underline"
                      >
                        Sat-Sun
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isChecked = selectedDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                            isChecked
                              ? 'bg-[#4682B4] text-white border-[#4682B4] shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Working Hours / Preferred Shift
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {WORKING_HOURS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, workingHours: preset }))}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                          form.workingHours === preset
                            ? 'bg-[#4682B4]/10 text-[#4682B4] border-[#4682B4] font-semibold'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Starting Price & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Starting Price (₹) *
                  </label>
                  <div className="relative mb-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₹</span>
                    <input
                      type="number"
                      name="startingPrice"
                      value={form.startingPrice}
                      onChange={handleChange}
                      required
                      min="50"
                      step="10"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                    />
                  </div>
                  {/* Quick price chips */}
                  <div className="flex items-center gap-1.5">
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, startingPrice: p.toString() }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          form.startingPrice === p.toString()
                            ? 'bg-[#4682B4] text-white border-[#4682B4]'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Experience (Years)
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      placeholder="e.g. 5"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Photo Upload (Safe & Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Stored safely directly with your profile</p>
                  </div>
                </div>
              </div>

              {/* 7. Short Bio / About */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  About You & Skills (Optional)
                </label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Briefly describe what repairs or services you specialize in..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/20 focus:border-[#4682B4] transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#4682B4] hover:bg-[#3b6f9a] transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Details to Firebase...</span>
                    </>
                  ) : (
                    <span>{existingProfile ? 'Update Details' : 'Save & Publish Service Profile'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
