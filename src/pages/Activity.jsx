// src/pages/Activity.jsx
import { useState, useEffect } from 'react';
import { Package, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { bookingsCol } from '../firebase/collections';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';

export default function Activity() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const q = query(bookingsCol, where('renterId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const fetchedBookings = [];
        for (const bookingDoc of snapshot.docs) {
          const bookingData = bookingDoc.data();
          
          // Fetch associated item details for name and image
          let itemData = null;
          try {
            const itemSnap = await getDoc(doc(db, 'items', bookingData.itemId));
            if (itemSnap.exists()) {
              itemData = itemSnap.data();
            }
          } catch (e) {
            console.error("Could not fetch item for booking", e);
          }

          fetchedBookings.push({
            id: bookingDoc.id,
            ...bookingData,
            item: itemData
          });
        }
        
        // Sort by date (newest first)
        fetchedBookings.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setBookings(fetchedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: t('statusPending'), color: 'badge-pending', icon: Clock };
      case 'accepted':
        return { label: t('statusAccepted'), color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle };
      case 'active':
        return { label: t('statusActive'), color: 'badge-active', icon: CheckCircle };
      case 'completed':
        return { label: t('statusDone'), color: 'badge-done', icon: CheckCircle };
      case 'rejected':
        return { label: t('statusRejected'), color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'cancelled':
        return { label: t('statusCanceled'), color: 'badge-canceled', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: Package };
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    // Handle Firestore Timestamp or standard Date
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return d.toLocaleDateString();
  };

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
        {t('myBookings')}
      </h1>
      
      {loading ? (
        <Loading />
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map(booking => {
            const statusConfig = getStatusConfig(booking.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={booking.id} padding="p-0" className="overflow-hidden flex flex-col">
                <div className="h-32 bg-gray-100 relative overflow-hidden">
                  {booking.item?.images?.[0] ? (
                    <img 
                      src={booking.item.images[0]} 
                      alt={booking.item.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${statusConfig.color} flex items-center shadow-sm`}>
                      <StatusIcon className="w-3.5 h-3.5 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">
                    {booking.item?.name || 'Unknown Item'}
                  </h3>
                  
                  <div className="flex flex-col gap-2 mt-auto text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{formatDate(booking.startDate)} &mdash; {formatDate(booking.endDate)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                      <span className="text-gray-500">{t('totalAmount')}</span>
                      <span className="font-bold text-gray-900">₹{booking.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState 
            icon={Package}
            titleKey="emptyState"
            descriptionKey="activityPlaceholder"
            className="max-w-md w-full"
          />
        </div>
      )}
    </div>
  );
}
