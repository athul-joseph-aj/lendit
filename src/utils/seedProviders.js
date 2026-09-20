// src/utils/seedProviders.js
// Seeds realistic initial sample service providers if the collection is empty.

import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const SAMPLE_PROVIDERS = [
  {
    id: 'provider_electrician_1',
    name: 'Anil Kumar',
    phone: '9847123456',
    services: ['electrician', 'applianceRepair'],
    experience: 6,
    location: 'Chengannur',
    startingPrice: 249,
    workingHours: 'Full Day (9 AM - 6 PM)',
    about: 'Certified licensed electrician specializing in home wiring, fuse box repairs, inverter installation, and emergency power restoration.',
    profileImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80',
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    isAvailable: true,
    rating: 4.9,
    reviewCount: 28,
  },
  {
    id: 'provider_plumber_1',
    name: 'Suresh Varma',
    phone: '9847234567',
    services: ['plumber'],
    experience: 8,
    location: 'Kochi',
    startingPrice: 299,
    workingHours: 'Full Day (9 AM - 6 PM)',
    about: 'Expert plumber for pipeline leakages, bathroom fittings, water pump motor installation, and drainage line unblocking.',
    profileImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=300&auto=format&fit=crop&q=80',
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    isAvailable: true,
    rating: 4.8,
    reviewCount: 42,
  },
  {
    id: 'provider_ac_1',
    name: 'Mohammed Riyas',
    phone: '9847345678',
    services: ['acRepair', 'applianceRepair'],
    experience: 5,
    location: 'Kochi',
    startingPrice: 499,
    workingHours: 'Flexible / 24/7',
    about: 'Specialized AC technician for split & window AC deep jet cleaning, gas refilling, cooling issues, and general maintenance.',
    profileImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&auto=format&fit=crop&q=80',
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    isAvailable: true,
    rating: 4.95,
    reviewCount: 35,
  },
  {
    id: 'provider_cleaning_1',
    name: 'Priya Shaji',
    phone: '9847456789',
    services: ['cleaning', 'painting'],
    experience: 4,
    location: 'Trivandrum',
    startingPrice: 399,
    workingHours: 'Morning (8 AM - 1 PM)',
    about: 'Deep home cleaning, kitchen & bathroom sanitation, sofa & carpet shampooing with professional eco-friendly cleaning tools.',
    profileImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    availability: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'],
    isAvailable: true,
    rating: 4.7,
    reviewCount: 19,
  },
];

export async function seedDefaultProviders() {
  try {
    for (const provider of SAMPLE_PROVIDERS) {
      const { id, ...data } = provider;
      await setDoc(doc(db, 'serviceProviders', id), {
        ...data,
        userId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    return { success: true, count: SAMPLE_PROVIDERS.length };
  } catch (err) {
    console.error('Error seeding providers:', err);
    return { success: false, error: err.message };
  }
}
