// src/pages/Rent.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, PackageOpen, Calendar, Package, CheckCircle2 } from 'lucide-react';
import { getDocs, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { itemsCol, bookingsCol, itemRequestsCol } from '../firebase/collections';
import { DEMO_MODE, DEMO_USER_ID } from '../config/demo';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import RentalItemCard from '../components/RentalItemCard';

// ─── RENTAL REQUEST MODAL ─────────────────────────────────────────────────────
function RentalRequestModal({ isOpen, onClose, item }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupOption, setPickupOption] = useState('pickup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  let diffDays = 0;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e >= s) diffDays = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) || 1;
  }

  const rentalCost = item ? diffDays * item.price : 0;
  const securityDeposit = item ? item.securityDeposit : 0;
  const totalAmount = rentalCost + securityDeposit;

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setPickupOption('pickup');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser && !DEMO_MODE) { setError(t('authRequired')); return; }
    if (!startDate || !endDate) { setError(t('missingDates')); return; }
    const s = new Date(startDate);
    const e2 = new Date(endDate);
    if (e2 < s) { setError(t('invalidDateRange')); return; }
    if (diffDays <= 0) { setError(t('invalidRentalDuration')); return; }

    try {
      setLoading(true);
      setError('');
      await addDoc(bookingsCol, {
        itemId: item.id,
        itemName: item.name,
        itemLocation: item.location || '',
        renterId: currentUser?.uid || DEMO_USER_ID,
        ownerId: item.ownerId,
        startDate: s,
        endDate: e2,
        durationDays: diffDays,
        pickupOption,
        rentalCost,
        securityDeposit,
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(t('requestError'));
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('requestToRent')} maxWidth="max-w-lg">
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('rentalRequestSent')}</h3>
          <p className="text-gray-500 mb-6">{t('ownerWillReview')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => { handleClose(); navigate('/activity'); }}
            >
              {t('viewMyRentals')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              {t('continueBrowsing')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item summary */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <PackageOpen className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">{item.category}</p>
              <p className="font-semibold text-gray-900 truncate">{item.name}</p>
              <p className="text-sm text-gray-500">
                ₹{item.price} <span className="text-gray-400">{t('perDay')}</span>
              </p>
            </div>
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('startDate')}
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
            <Input
              label={t('endDate')}
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
            />
          </div>

          {/* Pickup option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('pickupOption')}</label>
            <select
              className="input w-full"
              value={pickupOption}
              onChange={(e) => setPickupOption(e.target.value)}
            >
              <option value="pickup">{t('pickup')}</option>
              <option value="delivery">{t('delivery')}</option>
            </select>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('rentalDuration')}</span>
              <span className="font-medium text-gray-900">{diffDays} {t('days')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('rentalPrice')}</span>
              <span className="font-medium text-gray-900">₹{item.price} / {t('perDay')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('rentalCost')}</span>
              <span className="font-medium text-gray-900">₹{rentalCost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('securityDeposit')}</span>
              <span className="font-medium text-gray-900">₹{securityDeposit}</span>
            </div>
            <div className="border-t border-gray-200 pt-2.5 flex justify-between">
              <span className="font-bold text-gray-900">{t('total')}</span>
              <span className="font-bold text-gray-900 text-lg">₹{totalAmount}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
            <Calendar className="w-5 h-5" />
            {t('sendRentalRequest')}
          </Button>
        </form>
      )}
    </Modal>
  );
}

// ─── REQUEST AN ITEM MODAL ────────────────────────────────────────────────────
function RequestItemModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const categories = [
    { value: 'Electronics', label: t('electronicsCategory') },
    { value: 'Cameras', label: t('camerasCategory') },
    { value: 'Laptops', label: t('laptopsCategory') },
    { value: 'Tools', label: t('toolsCategory') },
    { value: 'Event Equipment', label: t('eventEquipmentCategory') },
    { value: 'Vehicles', label: t('vehiclesCategory') },
    { value: 'Household', label: t('householdCategory') },
    { value: 'Other', label: t('otherCategory') },
  ];

  const handleClose = () => {
    setItemName(''); setCategory(''); setDescription('');
    setLocation(''); setStartDate(''); setEndDate('');
    setBudget(''); setError(''); setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError(t('missingDates'));
      return;
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (isNaN(startObj) || isNaN(endObj)) {
      setError(t('invalidDateRange'));
      return;
    }

    if (endObj < startObj) {
      setError(t('invalidDateRange'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await addDoc(itemRequestsCol, {
        requesterId: currentUser?.uid || DEMO_USER_ID,
        itemName,
        category,
        description,
        location,
        startDate: startObj,
        endDate: endObj,
        budget: budget || null,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      console.error('Firestore error:', err);
      setError(t('requestError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('requestAnItem')} maxWidth="max-w-lg">
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('itemRequestSubmitted')}</h3>
          <p className="text-gray-500 mb-6">{t('itemRequestDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1" onClick={() => { handleClose(); navigate('/activity'); }}>
              {t('viewMyRentals')}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              {t('continueBrowsing')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('itemName')}
            placeholder={t('itemRequestPlaceholder')}
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('category')}</label>
            <select
              className="input w-full"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>
                  {categoryOption.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('description')}</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Input
            label={t('preferredLocation')}
            placeholder={t('locationPlaceholder')}
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={MapPin}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('neededFrom')}
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
            <Input
              label={t('neededUntil')}
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
            />
          </div>

          <Input
            label={t('budget')}
            placeholder={t('budgetPlaceholder')}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
            {t('submitItemRequest')}
          </Button>
        </form>
      )}
    </Modal>
  );
}

// ─── MAIN RENT PAGE ───────────────────────────────────────────────────────────
export default function Rent() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  // Modals
  const [rentalModalItem, setRentalModalItem] = useState(null);
  const [itemRequestModalOpen, setItemRequestModalOpen] = useState(false);

  const categories = [
    { value: 'Electronics', label: t('electronicsCategory') },
    { value: 'Cameras', label: t('camerasCategory') },
    { value: 'Laptops', label: t('laptopsCategory') },
    { value: 'Tools', label: t('toolsCategory') },
    { value: 'Event Equipment', label: t('eventEquipmentCategory') },
    { value: 'Vehicles', label: t('vehiclesCategory') },
    { value: 'Household', label: t('householdCategory') },
    { value: 'Other', label: t('otherCategory') },
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(itemsCol));
      setItems(snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() })));
    } catch (err) {
      console.error('Error fetching items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedCategory('');
    setAvailableOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('rating');
  };

  const processedItems = items
    .filter((item) => {
      const searchableText = `${item.name || ''} ${item.category || ''} ${item.location || ''}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      const matchesLocation = item.location?.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesAvailability = availableOnly ? item.availability === true : true;
      const matchesMinPrice = minPrice === '' || Number(item.price) >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || Number(item.price) <= Number(maxPrice);
      return matchesSearch && matchesLocation && matchesCategory && matchesAvailability && matchesMinPrice && matchesMaxPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const isFiltered = searchQuery || locationQuery || selectedCategory || availableOnly || minPrice || maxPrice;

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('exploreRentals')}</h1>
      </div>

      {/* Search & Filters */}
      <Card className="mb-8" padding="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder={t('searchItems')}
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Input
            placeholder={t('locationFilter')}
            icon={MapPin}
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label={t('price')}
              type="number"
              min="0"
              placeholder={t('minPrice')}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              label=""
              type="number"
              min="0"
              placeholder={t('maxPrice')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="rating">{t('highestRated')}</option>
            <option value="price_asc">{t('priceLowHigh')}</option>
            <option value="price_desc">{t('priceHighLow')}</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 hide-scrollbar gap-2 flex-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === '' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'
              }`}
            >
              {t('allCategories')}
            </button>
            {categories.map((categoryOption) => (
              <button
                key={categoryOption.value}
                onClick={() => setSelectedCategory(categoryOption.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === categoryOption.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'
                }`}
              >
                {categoryOption.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">{t('availableOnly')}</span>
          </label>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : processedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {processedItems.map((item) => (
            <RentalItemCard
              key={item.id}
              item={item}
              categoryLabel={categories.find((categoryOption) => categoryOption.value === item.category)?.label}
            />
          ))}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
          {/* Nothing Found */}
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <PackageOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('nothingFound')}</h2>
            <p className="text-gray-500 mb-5">{t('nothingFoundDesc')}</p>
            {isFiltered && (
              <Button variant="secondary" onClick={clearFilters}>
                {t('clearFilters')}
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="w-full max-w-sm flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('or')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Request an Item */}
          <Card className="w-full max-w-md text-center" padding="p-8">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('cantFindWhatYouNeed')}</h3>
            <p className="text-gray-500 text-sm mb-5">{t('communityDesc')}</p>
            <Button
              variant="primary"
              size="lg"
              className="whitespace-nowrap auto-cols-max"
              onClick={() => {
                setItemRequestModalOpen(true);
              }}
            >
              {t('requestAnItem')}
            </Button>
          </Card>
        </div>
      )}

      {/* "Request an Item" CTA — always shown when items exist */}
      {!loading && processedItems.length > 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 mb-1">{t('cantFindWhatYouNeed')}</p>
            <p className="text-sm text-gray-500">{t('communityDesc')}</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="whitespace-nowrap"
            onClick={() => {
              setItemRequestModalOpen(true);
            }}
          >
            {t('requestAnItem')}
          </Button>
        </div>
      )}

      {/* Modals */}
      <RentalRequestModal
        isOpen={!!rentalModalItem}
        onClose={() => setRentalModalItem(null)}
        item={rentalModalItem}
      />
      <RequestItemModal
        isOpen={itemRequestModalOpen}
        onClose={() => setItemRequestModalOpen(false)}
      />
    </div>
  );
}
