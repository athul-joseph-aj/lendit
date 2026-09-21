// src/pages/ItemDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getItemRef, getUserRef, bookingsCol, getBookingContactRef } from '../firebase/collections';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { MapPin, Star, Calendar, ShieldCheck, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Input from '../components/Input';
import { calculateRentalFinancials } from '../utils/rentalFinance';
import TrustScore from '../components/TrustScore';

export default function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preference, setPreference] = useState('pickup'); // 'pickup' or 'delivery'
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docSnap = await getDoc(getItemRef(itemId));
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() };
          setItem(itemData);
          setSelectedImage(0);
          setOwnerName(itemData.ownerId || t('owner'));

          if (itemData.ownerId) {
            try {
              const ownerSnap = await getDoc(getUserRef(itemData.ownerId));
              if (ownerSnap.exists()) {
                const ownerData = ownerSnap.data();
                setOwnerProfile(ownerData);
                setOwnerName(ownerData.name || ownerData.displayName || itemData.ownerId);
              }
            } catch {
              // Owner profile data is optional for the customer view.
            }
          }
        } else {
          setError(t('itemNotFound'));
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        setError(t('firebaseError'));
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId, t]);

  // Calculate rental duration
  let diffDays = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end >= start) {
      const diffTime = Math.abs(end - start);
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Same day = 1 day
    }
  }

  const rentalCost = item ? diffDays * item.price : 0;
  const totalAmount = item ? rentalCost + item.securityDeposit : 0;

  const handleBook = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError(t('authRequired'));
      return;
    }

    if (!phone.trim()) {
      setError('Please provide your phone number so the owner can contact you after accepting.');
      return;
    }

    if (!startDate || !endDate) {
      setError(t('missingDates'));
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError(t('invalidDateRange'));
      return;
    }
    if (diffDays <= 0) {
      setError(t('invalidRentalDuration'));
      return;
    }

    try {
      setBookingLoading(true);
      setError('');
      const financials = calculateRentalFinancials({
        rentalCost,
        securityDeposit: item.securityDeposit,
      });
      
      const bookingRef = await addDoc(bookingsCol, {
        itemId: item.id,
        itemName: item.name,
        itemLocation: item.location || '',
        renterId: currentUser.uid,
        renterName: currentUser.displayName || currentUser.email || '',
        renterEmail: currentUser.email || '',
        ownerId: item.ownerId,
        startDate: start,
        endDate: end,
        durationDays: diffDays,
        pickupOption: preference,
        ...financials,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      await setDoc(getBookingContactRef(bookingRef.id), {
        renterId: currentUser.uid,
        renterPhone: phone.trim(),
        createdAt: serverTimestamp(),
      });
      
      setSuccess(true);
    } catch (err) {
      console.error("Error booking item:", err);
      setError(t('requestError'));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (error && !item) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!item) return null;

  return (
    <div className="container-main py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Images & Details */}
        <div className="flex-1 space-y-8">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video md:aspect-[16/9] w-full relative">
            {item.images?.length > 0 ? (
              <img src={item.images[selectedImage] || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {t('noImage')}
              </div>
            )}
            {!item.availability && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-lg tracking-wide uppercase">
                  {t('currentlyUnavailable')}
                </span>
              </div>
            )}
            </div>
            {item.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}
                    aria-label={`${t('image')} ${index + 1}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {item.category}
              </span>
              <div className="flex items-center text-sm font-semibold text-gray-900">
                <Star className="w-4 h-4 text-amber-400 mr-1 fill-amber-400" />
                {item.rating}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {item.name}
            </h1>
            
            <div className="flex items-center text-gray-500 mb-8 pb-8 border-b border-gray-200">
              <MapPin className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
              <span>{item.location}</span>
            </div>

            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('description')}</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('ownedBy')}</p>
                <p className="font-semibold text-gray-900">{ownerName || t('owner')}</p>
                {ownerProfile && (
                  <TrustScore
                    rating={ownerProfile.rating}
                    trustScore={ownerProfile.trustScore}
                    reviewCount={ownerProfile.reviewCount}
                    compact
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:w-[400px]">
          <Card className="sticky top-24">
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{item.price}</span>
              <span className="text-gray-500 ml-2">/ {item.priceUnit === 'day' ? t('perDay') : item.priceUnit}</span>
            </div>

            {success ? (
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('rentalRequestSent')}</h3>
                <p className="text-sm text-gray-500 mb-5">{t('ownerWillReview')}</p>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" className="w-full" onClick={() => navigate('/activity')}>
                    {t('viewMyRentals')}
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => navigate('/rent')}>
                    {t('continueBrowsing')}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label={t('startDate')}
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Input 
                    label={t('endDate')}
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('pickupPreference')}
                  </label>
                  <select 
                    className="input w-full"
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                  >
                    <option value="pickup">{t('pickup')}</option>
                    <option value="delivery">{t('delivery')}</option>
                  </select>
                </div>

                <Input
                  label={t('phone')}
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number for the owner after acceptance"
                />
                <p className="text-xs text-gray-500 -mt-3">Your phone number stays private until the owner accepts this request.</p>
                
                {/* Detailed Rental Calculator */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('rentalDuration')}</span>
                    <span className="font-medium text-gray-900">[-] {diffDays} {t('days')} [+]</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('rentalCost')}</span>
                    <span className="font-medium text-gray-900">₹{rentalCost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('securityDeposit')}</span>
                    <span className="font-medium text-gray-900">₹{item.securityDeposit}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">{t('total')}</span>
                    <span className="font-bold text-gray-900 text-lg">₹{totalAmount}</span>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full mt-4" 
                  size="lg"
                  isLoading={bookingLoading}
                  disabled={!item.availability}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('requestToRent')}
                </Button>
                
              </form>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
