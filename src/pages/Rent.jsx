// src/pages/Rent.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, PackageOpen, Star, Calendar, Package, CheckCircle2 } from 'lucide-react';
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const MOCK_ITEMS = [
  {
    ownerId: 'mock_owner_1',
    name: 'Canon EOS 90D DSLR Camera',
    category: 'Cameras',
    description: 'Professional DSLR camera with 32.5MP sensor. Includes 18-55mm and 55-250mm lenses, 2 batteries, charger, and 128GB SD card. Perfect for events, portraits and wildlife.',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'],
    price: 750,
    priceUnit: 'day',
    securityDeposit: 5000,
    location: 'Kochi, Kerala',
    availability: true,
    rating: 4.8,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_2',
    name: 'Dell XPS 15 Laptop',
    category: 'Laptops',
    description: 'High-performance Dell XPS 15 with Intel Core i7, 16GB RAM, 512GB SSD, and NVIDIA GeForce GTX 1650. Ideal for design work, presentations, and coding.',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=800'],
    price: 600,
    priceUnit: 'day',
    securityDeposit: 8000,
    location: 'Trivandrum, Kerala',
    availability: true,
    rating: 4.7,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_3',
    name: 'Epson Full HD Projector',
    category: 'Event Equipment',
    description: '4000-lumen Full HD projector with HDMI, USB, and VGA inputs. Perfect for college events, presentations, movie nights, and weddings.',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800'],
    price: 500,
    priceUnit: 'day',
    securityDeposit: 3000,
    location: 'Calicut, Kerala',
    availability: true,
    rating: 4.9,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_4',
    name: 'Bosch Professional Power Drill',
    category: 'Tools',
    description: 'Heavy-duty 20V cordless impact drill for concrete, wood, and metal. Includes a full set of 25 drill bits, two batteries, and a fast charger.',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800'],
    price: 200,
    priceUnit: 'day',
    securityDeposit: 1000,
    location: 'Thrissur, Kerala',
    availability: true,
    rating: 4.5,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_5',
    name: 'Coleman 6-Person Camping Tent',
    category: 'Household',
    description: 'Spacious 6-person dome tent with weather-resistant rainfly and ground cloth. Easy 20-minute setup. Great for weekend treks and outdoor events.',
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800'],
    price: 350,
    priceUnit: 'day',
    securityDeposit: 1500,
    location: 'Munnar, Kerala',
    availability: true,
    rating: 4.6,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_6',
    name: 'JBL PartyBox 310 Speaker',
    category: 'Event Equipment',
    description: 'Powerful 240W RMS portable speaker with dynamic light show, splash-proof design, and 18-hour playtime. Turn any space into a party.',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800'],
    price: 800,
    priceUnit: 'day',
    securityDeposit: 4000,
    location: 'Kottayam, Kerala',
    availability: true,
    rating: 4.9,
    createdAt: new Date(),
  },
  {
    ownerId: 'mock_owner_7',
    name: 'Swift Dzire — Self Drive Car',
    category: 'Vehicles',
    description: 'Well-maintained 2022 Maruti Swift Dzire with AC, Bluetooth, and GPS. Petrol, clean interior. Fuel not included. Valid driving licence required.',
    images: ['https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800'],
    price: 1200,
    priceUnit: 'day',
    securityDeposit: 5000,
    location: 'Ernakulam, Kerala',
    availability: false,   // intentionally unavailable for demo
    rating: 4.4,
    createdAt: new Date(),
  },
];

// ─── RENTAL REQUEST MODAL ─────────────────────────────────────────────────────
function RentalRequestModal({ isOpen, onClose, item }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

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
    if (!startDate || !endDate) { setError('Please select start and end dates.'); return; }
    const s = new Date(startDate);
    const e2 = new Date(endDate);
    if (e2 < s) { setError('End date cannot be before start date.'); return; }
    if (diffDays <= 0) { setError('Please select a valid rental period.'); return; }

    try {
      setLoading(true);
      setError('');
      await addDoc(bookingsCol, {
        itemId: item.id,
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
      setError('Could not send request. Please try again.');
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
    'Electronics', 'Cameras', 'Laptops', 'Tools',
    'Event Equipment', 'Vehicles', 'Household', 'Other',
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
      setError('Start date and end date are required.');
      return;
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    
    if (isNaN(startObj) || isNaN(endObj)) {
      setError('Please enter valid dates.');
      return;
    }

    if (endObj < startObj) {
      setError('Please select a valid date range.');
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
      setError('Could not submit request. Please try again.');
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
            placeholder="e.g. Projector, Camera, Tent..."
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              className="input w-full"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder="Describe what you need and any specific requirements..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Input
            label={t('preferredLocation')}
            placeholder="e.g. Chengannur, Kochi..."
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
            placeholder="e.g. ₹500/day"
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
  const [sortBy, setSortBy] = useState('rating');

  // Modals
  const [rentalModalItem, setRentalModalItem] = useState(null);
  const [itemRequestModalOpen, setItemRequestModalOpen] = useState(false);

  const categories = [
    t('electronicsCategory'),
    t('camerasCategory'),
    t('laptopsCategory'),
    t('toolsCategory'),
    t('eventEquipmentCategory'),
    t('vehiclesCategory'),
    t('householdCategory'),
  ];

  const fetchItems = async () => {
    const demoItems = MOCK_ITEMS.map((item, index) => ({ id: `demo-item-${index + 1}`, ...item }));

    // Render the local catalog immediately in demo mode while Firestore loads.
    if (DEMO_MODE) {
      setItems(demoItems);
      setLoading(false);
    }

    try {
      if (!DEMO_MODE) setLoading(true);
      const snapshot = await getDocs(query(itemsCol));
      const fetchedItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Keep the rental experience usable while the Firestore collection is
      // empty during demo mode. These items can still be requested normally.
      setItems(fetchedItems.length > 0
        ? fetchedItems
        : demoItems);
    } catch (err) {
      console.error('Error fetching items:', err);
      // A Firestore read can fail when demo security rules are not configured.
      // Show the local catalog instead of leaving the rental page blank.
      setItems(demoItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      for (const item of MOCK_ITEMS) {
        await addDoc(itemsCol, item);
      }
      await fetchItems();
    } catch (err) {
      console.error('Error seeding data:', err);
      setLoading(false);
    }
  };

  const handleRequestToRent = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setRentalModalItem(item);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedCategory('');
    setAvailableOnly(false);
    setSortBy('rating');
  };

  const processedItems = items
    .filter((item) => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = item.location?.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesAvailability = availableOnly ? item.availability === true : true;
      return matchesSearch && matchesLocation && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const isFiltered = searchQuery || locationQuery || selectedCategory || availableOnly;

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('exploreRentals')}</h1>
        <Button onClick={handleSeedData} variant="secondary" size="sm">
          Seed Mock Data
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="mb-8" padding="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'
                }`}
              >
                {cat}
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
            <Card key={item.id} hover padding="p-0" className="h-full flex flex-col overflow-hidden group">
              {/* Image */}
              <Link to={`/rent/${item.id}`} className="block h-48 w-full bg-gray-100 relative overflow-hidden">
                {item.images?.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <PackageOpen className="w-12 h-12" />
                  </div>
                )}
                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center text-xs font-semibold text-gray-900 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" />
                  {item.rating}
                </div>
                {/* Unavailable overlay */}
                {!item.availability && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow">
                      {t('currentlyUnavailable')}
                    </span>
                  </div>
                )}
              </Link>

              {/* Card body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                  {item.category}
                </div>
                <Link to={`/rent/${item.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">{item.name}</h3>
                </Link>
                <div className="flex items-center text-sm text-gray-500 mt-auto mb-3">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-baseline mb-4">
                  <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/ {item.priceUnit === 'day' ? t('perDay') : item.priceUnit}</span>
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <Link to={`/rent/${item.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      {t('viewDetails')}
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!item.availability}
                    onClick={(e) => item.availability && handleRequestToRent(e, item)}
                  >
                    {item.availability ? t('requestToRent') : t('currentlyUnavailable')}
                  </Button>
                </div>
              </div>
            </Card>
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
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
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
