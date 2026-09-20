// src/pages/ItemDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getItemRef, bookingsCol } from '../firebase/collections';
import { DEMO_USER_ID } from '../config/demo';
import { useAuth } from '../context/AuthContext';
import { MOCK_ITEMS } from './Rent';
import { useTranslation } from '../hooks/useTranslation';
import { MapPin, Star, Calendar, ShieldCheck, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Input from '../components/Input';

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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preference, setPreference] = useState('pickup'); // 'pickup' or 'delivery'

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docSnap = await getDoc(getItemRef(itemId));
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          const demoIndex = Number(itemId?.replace('demo-item-', '')) - 1;
          const demoItem = Number.isInteger(demoIndex) ? MOCK_ITEMS[demoIndex] : null;

          if (demoItem) {
            setItem({ id: itemId, ...demoItem });
          } else {
            setError('Item not found');
          }
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        const demoIndex = Number(itemId?.replace('demo-item-', '')) - 1;
        const demoItem = Number.isInteger(demoIndex) ? MOCK_ITEMS[demoIndex] : null;

        if (demoItem) {
          setItem({ id: itemId, ...demoItem });
        } else {
          setError('Error loading item details');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

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

    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError('End date cannot be before start date');
      return;
    }
    if (diffDays <= 0) {
      setError('Rental duration must be valid');
      return;
    }

    try {
      setBookingLoading(true);
      setError('');
      
      await addDoc(bookingsCol, {
        itemId: item.id,
        renterId: currentUser?.uid || DEMO_USER_ID,
        ownerId: item.ownerId,
        startDate: start,
        endDate: end,
        durationDays: diffDays,
        preference,
        rentalCost,
        totalAmount,
        securityDeposit: item.securityDeposit,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
    } catch (err) {
      console.error("Error booking item:", err);
      setError('Could not process booking request');
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
          {/* Main Image */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video md:aspect-[16/9] w-full relative">
            {item.images && item.images.length > 0 ? (
              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            {!item.availability && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-lg tracking-wide uppercase">
                  Currently Unavailable
                </span>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Owned by</p>
                <p className="font-semibold text-gray-900">Verified User</p>
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
