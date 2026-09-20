// src/pages/Rent.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, PackageOpen, Star } from 'lucide-react';
import { getDocs, query, where, addDoc } from 'firebase/firestore';
import { itemsCol } from '../firebase/collections';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

// MOCK DATA for testing
const MOCK_ITEMS = [
  {
    ownerId: "mock_owner_1",
    name: "Sony Alpha A7III Camera with Lens",
    category: "Cameras",
    description: "Professional full-frame mirrorless camera. Includes 28-70mm lens, 2 batteries, and a 64GB SD card. Perfect for weddings, events, or travel photography.",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"],
    price: 45,
    priceUnit: "day",
    securityDeposit: 200,
    location: "Kochi, Kerala",
    availability: true,
    rating: 4.8,
    createdAt: new Date()
  },
  {
    ownerId: "mock_owner_2",
    name: "Bosch Professional Power Drill",
    category: "Tools",
    description: "Heavy-duty impact drill for concrete and wood. Includes a complete set of drill bits.",
    images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800"],
    price: 15,
    priceUnit: "day",
    securityDeposit: 50,
    location: "Trivandrum, Kerala",
    availability: true,
    rating: 4.5,
    createdAt: new Date()
  },
  {
    ownerId: "mock_owner_3",
    name: "JBL PartyBox 310 Speaker",
    category: "Event Equipment",
    description: "Massive sound and dazzling lights. Portable party speaker with 240W RMS powerful sound and 18 hours of battery life.",
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800"],
    price: 25,
    priceUnit: "day",
    securityDeposit: 100,
    location: "Calicut, Kerala",
    availability: true,
    rating: 4.9,
    createdAt: new Date()
  }
];

export default function Rent() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    t('electronicsCategory'),
    t('camerasCategory'),
    t('laptopsCategory'),
    t('toolsCategory'),
    t('eventEquipmentCategory'),
    t('vehiclesCategory'),
    t('householdCategory')
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = query(itemsCol, where('availability', '==', true));
      const snapshot = await getDocs(q);
      
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Temporary function to seed database if empty
  const handleSeedData = async () => {
    try {
      setLoading(true);
      for (const item of MOCK_ITEMS) {
        await addDoc(itemsCol, item);
      }
      await fetchItems();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container-main py-8 md:py-12 flex-1 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t('exploreRentals')}
        </h1>
        
        {/* DEV ONLY: Seed Button */}
        {items.length === 0 && !loading && (
          <Button onClick={handleSeedData} variant="secondary" size="sm">
            Seed Mock Data
          </Button>
        )}
      </div>
      
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <Input 
            placeholder={t('searchItems')} 
            icon={Search} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 hide-scrollbar gap-2">
          <button 
            onClick={() => setSelectedCategory('')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((cat, i) => (
            <button 
              key={i}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Loading />
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Link key={item.id} to={`/rent/${item.id}`} className="group">
              <Card hover padding="p-0" className="h-full flex flex-col overflow-hidden">
                <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
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
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center text-xs font-semibold text-gray-900 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" />
                    {item.rating}
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">
                    {item.category}
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4 mt-auto">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-baseline">
                    <span className="text-lg font-bold text-gray-900">${item.price}</span>
                    <span className="text-sm text-gray-500 ml-1">/ {item.priceUnit === 'day' ? t('perDay') : item.priceUnit}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState 
            icon={PackageOpen}
            titleKey="emptyState"
            descriptionKey="searchItems"
          />
        </div>
      )}
    </div>
  );
}
