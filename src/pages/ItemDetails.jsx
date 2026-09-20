// src/pages/ItemDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getItemRef, bookingsCol } from '../firebase/collections';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docSnap = await getDoc(getItemRef(itemId));
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Item not found');
        }
      } catch (err) {
        console.error("Error fetching item:", err);
        setError('Error loading item details');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError('End date must be after start date');
      return;
    }

    // Rough calculation of days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // At least 1 day
    const totalAmount = (diffDays * item.price) + item.securityDeposit;

    try {
      setBookingLoading(true);
      setError('');
      
      await addDoc(bookingsCol, {
        itemId: item.id,
        renterId: currentUser.uid,
        ownerId: item.ownerId,
        startDate: start,
        endDate: end,
        totalAmount,
        securityDeposit: item.securityDeposit,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/activity'), 2000);
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
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video md:aspect-[16/9] w-full">
            {item.images && item.images.length > 0 ? (
              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
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
              <span className="text-3xl font-bold text-gray-900">${item.price}</span>
              <span className="text-gray-500 ml-2">/ {item.priceUnit === 'day' ? t('perDay') : item.priceUnit}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
              <ShieldCheck className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              <span>{t('securityDeposit')}: <strong>${item.securityDeposit}</strong> (Refundable)</span>
            </div>

            {success ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium border border-green-200">
                {t('bookingRequested')}
                <p className="text-sm font-normal mt-1 opacity-80">Redirecting to activity...</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
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
                
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full mt-4" 
                  size="lg"
                  isLoading={bookingLoading}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('requestToBook')}
                </Button>
                
                {!currentUser && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    You will be asked to log in first.
                  </p>
                )}
              </form>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
