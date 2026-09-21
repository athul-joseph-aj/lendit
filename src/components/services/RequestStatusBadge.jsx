// src/components/services/RequestStatusBadge.jsx
// Maps a service request status to a styled badge.

import { useTranslation } from '../../hooks/useTranslation';

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  accepted:  'bg-blue-50 text-blue-700 border border-blue-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const STATUS_KEYS = {
  pending:   'statusPending',
  accepted:  'statusAccepted',
  rejected:  'statusRejected',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

/**
 * @param {'pending'|'accepted'|'rejected'|'completed'|'cancelled'} status
 */
export default function RequestStatusBadge({ status }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const key   = STATUS_KEYS[status]   ?? 'statusPending';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {t(key)}
    </span>
  );
}
