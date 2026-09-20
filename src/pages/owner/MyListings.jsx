// src/pages/owner/MyListings.jsx
// Route: /owner/listings
// Shows all items belonging to the current owner with View/Edit/Delete/Toggle actions.

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Tag,
  Eye,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  PackageSearch,
} from 'lucide-react';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';

const CATEGORIES = [
  'Electronics','Cameras','Laptops','Tools','Event Equipment','Vehicles','Household','Other',
];
const PRICE_UNITS = ['hour', 'day', 'week'];

function StatusBadge({ available }) {
  return available ? (
    <span className="badge bg-green-50 text-green-700 border border-green-200">Available</span>
  ) : (
    <span className="badge bg-gray-100 text-gray-500 border border-gray-200">Unavailable</span>
  );
}

export default function MyListings() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [viewItem, setViewItem]     = useState(null);
  const [editItem, setEditItem]     = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // ── Real-time listener ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'items'),
      where('ownerId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort newest first
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setListings(docs);
      setLoading(false);
    }, (err) => {
      console.error('MyListings error:', err);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // ── Toggle availability ──────────────────────────────────
  const toggleAvailability = async (item) => {
    try {
      await updateDoc(doc(db, 'items', item.id), { availability: !item.availability });
      showToast(t('listingUpdated'));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'items', deleteItem.id));
      setDeleteItem(null);
      showToast(t('listingDeleted'));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Edit save ────────────────────────────────────────────
  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      name:            item.name,
      category:        item.category,
      description:     item.description || '',
      price:           item.price,
      priceUnit:       item.priceUnit,
      securityDeposit: item.securityDeposit || 0,
      location:        item.location,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'items', editItem.id), {
        ...editForm,
        price:           parseFloat(editForm.price),
        securityDeposit: parseFloat(editForm.securityDeposit) || 0,
        updatedAt:       serverTimestamp(),
      });
      setEditItem(null);
      showToast(t('listingUpdated'));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const priceUnitLabel = (unit) =>
    unit === 'hour' ? t('perHour') : unit === 'week' ? t('perWeek') : t('perDay');

  if (loading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('myListings')}</h1>
        <Link to="/list-item" className="btn btn-primary btn-md gap-2">
          <PlusCircle className="w-4 h-4" />
          {t('addItem')}
        </Link>
      </div>

      {/* Empty */}
      {listings.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <PackageSearch className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold mb-1">{t('noListings')}</p>
          <Link to="/list-item" className="btn btn-primary btn-md mt-4 gap-2">
            <PlusCircle className="w-4 h-4" />
            {t('addItem')}
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item) => (
          <div key={item.id} className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 group">
            {/* Image */}
            <div className="aspect-video bg-gray-100 overflow-hidden">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PackageSearch className="w-10 h-10 text-gray-300" />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <StatusBadge available={item.availability} />
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Tag className="w-3 h-3" />
                {item.category}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin className="w-3 h-3" />
                {item.location}
              </div>

              <p className="text-primary font-bold text-lg">
                ₹{item.price?.toLocaleString()}
                <span className="text-xs text-gray-400 font-normal ml-1">{priceUnitLabel(item.priceUnit)}</span>
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setViewItem(item)}
                  className="flex-1 btn btn-ghost btn-sm text-gray-500 hover:text-gray-900"
                  title={t('viewListing')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 btn btn-ghost btn-sm text-blue-500 hover:text-blue-700"
                  title={t('editListing')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleAvailability(item)}
                  className="flex-1 btn btn-ghost btn-sm text-primary hover:text-primary-700"
                  title={t('changeAvailability')}
                >
                  {item.availability
                    ? <ToggleRight className="w-4 h-4 text-primary" />
                    : <ToggleLeft className="w-4 h-4 text-gray-400" />
                  }
                </button>
                <button
                  onClick={() => setDeleteItem(item)}
                  className="flex-1 btn btn-ghost btn-sm text-red-400 hover:text-red-600"
                  title={t('delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── View Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name || ''}
        maxWidth="max-w-lg"
      >
        {viewItem && (
          <div className="space-y-3">
            {viewItem.images?.[0] && (
              <img
                src={viewItem.images[0]}
                alt={viewItem.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-400 text-xs">{t('categories')}</p><p className="font-medium">{viewItem.category}</p></div>
              <div><p className="text-gray-400 text-xs">{t('location')}</p><p className="font-medium">{viewItem.location}</p></div>
              <div><p className="text-gray-400 text-xs">{t('rentalPrice')}</p><p className="font-medium text-primary">₹{viewItem.price} {priceUnitLabel(viewItem.priceUnit)}</p></div>
              <div><p className="text-gray-400 text-xs">{t('securityDeposit')}</p><p className="font-medium">₹{viewItem.securityDeposit || 0}</p></div>
              <div className="col-span-2"><p className="text-gray-400 text-xs">{t('availability')}</p><StatusBadge available={viewItem.availability} /></div>
            </div>
            {viewItem.description && (
              <div><p className="text-gray-400 text-xs mb-1">{t('description')}</p><p className="text-sm text-gray-700">{viewItem.description}</p></div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={t('editListing')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('itemName')}</label>
            <input className="input" value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('categories')}</label>
              <select className="input bg-white" value={editForm.category || ''} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceUnit')}</label>
              <select className="input bg-white" value={editForm.priceUnit || 'day'} onChange={(e) => setEditForm((p) => ({ ...p, priceUnit: e.target.value }))}>
                {PRICE_UNITS.map((u) => <option key={u} value={u}>{t(u)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('rentalPrice')} (₹)</label>
              <input type="number" min="0" step="0.01" className="input" value={editForm.price || ''} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('securityDeposit')} (₹)</label>
              <input type="number" min="0" step="0.01" className="input" value={editForm.securityDeposit || ''} onChange={(e) => setEditForm((p) => ({ ...p, securityDeposit: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
            <input className="input" value={editForm.location || ''} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea rows={3} className="input resize-none" value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditItem(null)} className="btn btn-secondary btn-md flex-1">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-md flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────── */}
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title={t('delete')}
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-gray-600 mb-6">{t('deleteConfirm')}</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteItem(null)} className="btn btn-secondary btn-md flex-1">{t('cancel')}</button>
          <button onClick={confirmDelete} disabled={deleting} className="btn btn-danger btn-md flex-1">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('delete')}
          </button>
        </div>
      </Modal>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg animate-slide-up z-50 flex items-center gap-2">
          {toast}
          <button onClick={() => setToast('')}><X className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}
