import { useEffect, useState } from 'react';
import { addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { AlertCircle, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { problemReportsCol } from '../firebase/collections';
import { useAuth } from '../context/AuthContext';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import Modal from './Modal';
import Button from './Button';

const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;
const ISSUE_TYPES = [
  'Item damaged',
  'Item not received',
  'Wrong item',
  'Service not completed',
  'Poor/incomplete service',
  'Payment-related issue',
  'Other',
];

function toDate(value) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getProblemEventDate(transaction, transactionType) {
  const candidates = transactionType === 'service'
    ? [transaction.completedAt, transaction.serviceCompletedAt, transaction.updatedAt]
    : transaction.status === 'completed'
      ? [transaction.completedAt, transaction.returnedAt, transaction.updatedAt, transaction.endDate]
      : [transaction.startDate];
  return candidates.map(toDate).find(Boolean) || null;
}

export function canReportProblem(transaction, transactionType) {
  const eventDate = getProblemEventDate(transaction, transactionType);
  if (!eventDate) return false;
  const age = Date.now() - eventDate.getTime();
  return age >= 0 && age <= REPORT_WINDOW_MS;
}

function toDateTimeLocal(date) {
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ProblemReportModal({ isOpen, onClose, transaction, transactionType = 'rental' }) {
  const { currentUser } = useAuth();
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const eventDate = getProblemEventDate(transaction || {}, transactionType);
    setIssueType(ISSUE_TYPES[0]);
    setDescription('');
    setAdditionalDetails('');
    setOccurredAt(toDateTimeLocal(eventDate || new Date()));
    setPhotoFile(null);
    setPhotoPreview('');
    setSubmitting(false);
    setError('');
    setSuccess(false);
  }, [isOpen, transaction, transactionType]);

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be 10 MB or smaller.');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser || !transaction?.id) return setError('Please sign in before reporting a problem.');
    if (!canReportProblem(transaction, transactionType)) {
      setError('Problem reporting is available only within 24 hours of the transaction.');
      return;
    }
    if (!description.trim()) {
      setError('Describe the problem before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await uploadImageToCloudinary(photoFile);
      }

      await addDoc(problemReportsCol, {
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || '',
        reporterEmail: currentUser.email || '',
        transactionId: transaction.id,
        transactionType,
        relatedItemId: transactionType === 'rental' ? transaction.itemId || null : null,
        relatedServiceId: transactionType === 'service' ? transaction.providerId || null : null,
        issueType,
        description: description.trim(),
        additionalDetails: additionalDetails.trim(),
        occurredAt: occurredAt ? Timestamp.fromDate(new Date(occurredAt)) : serverTimestamp(),
        photoUrl,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (submitError) {
      console.error('Unable to submit problem report:', submitError);
      setError(submitError.message || 'Unable to submit the problem report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise a Problem" maxWidth="max-w-lg">
      {success ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">Problem reported successfully.</h3>
          <Button type="button" className="mt-5" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!canReportProblem(transaction || {}, transactionType) && (
            <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              Problem reporting is available only within 24 hours of the transaction.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Problem type</label>
            <select className="input w-full" value={issueType} onChange={(event) => setIssueType(event.target.value)}>
              {ISSUE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe the problem</label>
            <textarea className="input w-full resize-none" rows={4} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the problem" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date/time</label>
            <input className="input w-full" type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional evidence/details (optional)</label>
            <textarea className="input w-full resize-none" rows={2} value={additionalDetails} onChange={(event) => setAdditionalDetails(event.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo (optional)</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => document.getElementById('problem-photo-upload')?.click()} className="btn btn-secondary btn-sm">
                <ImagePlus className="w-4 h-4 mr-1" /> Upload photo
              </button>
              <input id="problem-photo-upload" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              {photoPreview && <img src={photoPreview} alt="Evidence preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />}
              {photoPreview && <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }} aria-label="Remove photo"><X className="w-4 h-4 text-gray-500" /></button>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" isLoading={submitting} disabled={!canReportProblem(transaction || {}, transactionType)}>
            Submit Problem
          </Button>
        </form>
      )}
    </Modal>
  );
}
