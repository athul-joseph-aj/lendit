import { useState } from 'react';
import { Check, Clock3, Loader2, TriangleAlert } from 'lucide-react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
  getPlatformFeeDueDate,
  isPlatformFeeExpired,
  isPlatformFeePaid,
} from '../utils/rentalFinance';

function formatDueDate(date) {
  if (!date) return 'Due after completion';
  return `Due ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export default function PlatformFeePayment({
  bookingId,
  amount,
  booking = {},
  onPaid,
}) {
  const [paid, setPaid] = useState(isPlatformFeePaid(booking));
  const [paying, setPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const expired = isPlatformFeeExpired(booking);
  const dueDate = getPlatformFeeDueDate(booking);

  const payPlatformFee = async () => {
    if (!bookingId || paid || paying) return;

    setPaying(true);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        platformFeePaid: true,
        platformFeePaymentStatus: 'paid',
        platformFeePaidAt: serverTimestamp(),
      });
      setPaid(true);
      setShowSuccess(true);
      onPaid?.(bookingId);
      window.setTimeout(() => setShowSuccess(false), 1800);
    } catch (error) {
      console.error('Platform fee payment error:', error);
    } finally {
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Platform fee</p>
          <p className="text-lg font-bold text-emerald-800">₹{Number(amount || 0).toLocaleString()}</p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-semibold text-emerald-700 ${showSuccess ? 'payment-success-pop' : ''}`}>
          <span className="payment-success-ring flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="payment-success-check h-5 w-5" strokeWidth={3} />
          </span>
          Paid
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${expired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div>
        <p className={`text-xs font-medium uppercase tracking-wide ${expired ? 'text-red-700' : 'text-amber-700'}`}>Platform fee</p>
        <p className={`text-lg font-bold ${expired ? 'text-red-800' : 'text-amber-800'}`}>₹{Number(amount || 0).toLocaleString()}</p>
        <p className={`mt-0.5 flex items-center gap-1 text-xs ${expired ? 'text-red-600' : 'text-amber-700'}`}>
          {expired ? <TriangleAlert className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          {expired ? 'Payment expired — pay now' : formatDueDate(dueDate)}
        </p>
      </div>
      <button
        type="button"
        onClick={payPlatformFee}
        disabled={paying}
        className="btn btn-md bg-gray-900 text-white hover:bg-gray-800"
      >
        {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay'}
      </button>
    </div>
  );
}
