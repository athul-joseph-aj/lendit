import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MarketplaceAgreement() {
  const { currentUser, agreementAccepted, agreementLoading, acceptAgreement } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser || agreementLoading || agreementAccepted) return null;

  const handleAccept = async () => {
    try {
      setSaving(true);
      setError('');
      await acceptAgreement();
    } catch (acceptError) {
      console.error('Unable to save marketplace agreement:', acceptError);
      setError('Unable to save your agreement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="marketplace-agreement-title">
        <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="marketplace-agreement-title" className="text-lg font-bold text-gray-900">Important Notice</h2>
            <p className="text-sm text-gray-500 mt-1">Please read and accept before using transaction features.</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>Lendit is a platform that connects buyers, sellers, renters, owners and service providers.</p>
          <p>Transactions and service agreements are made directly between users. Lendit does not guarantee the condition, ownership, quality, safety or legality of any item or service.</p>
          <p>You are responsible for verifying the other party, checking items, agreeing on payment and delivery/return, following applicable laws, and taking appropriate precautions.</p>
          <p>Transactions are carried out at your own risk.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button type="button" onClick={handleAccept} disabled={saving} className="btn btn-primary w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
