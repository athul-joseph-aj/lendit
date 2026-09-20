// src/firebase/collections.js
// Firestore collection helpers for the LendIt app.
//
// Usage example:
//   import { COLLECTIONS, getUserRef } from '../firebase/collections';
//   const userSnap = await getDoc(getUserRef(userId));

import { doc, collection } from 'firebase/firestore';
import { db } from './firebase';

// ── Collection name constants ──────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:             'users',
  ITEMS:             'items',
  BOOKINGS:          'bookings',
  ITEM_REQUESTS:     'itemRequests',
  SERVICE_PROVIDERS: 'serviceProviders',
  SERVICE_REQUESTS:  'serviceRequests',
};

// ── Collection references ─────────────────────────────────────────────────
export const usersCol            = collection(db, COLLECTIONS.USERS);
export const itemsCol            = collection(db, COLLECTIONS.ITEMS);
export const bookingsCol         = collection(db, COLLECTIONS.BOOKINGS);
export const itemRequestsCol     = collection(db, COLLECTIONS.ITEM_REQUESTS);
export const serviceProvidersCol = collection(db, COLLECTIONS.SERVICE_PROVIDERS);
export const serviceRequestsCol  = collection(db, COLLECTIONS.SERVICE_REQUESTS);

// ── Document reference helpers ────────────────────────────────────────────
export const getUserRef            = (userId)     => doc(db, COLLECTIONS.USERS,             userId);
export const getItemRef            = (itemId)     => doc(db, COLLECTIONS.ITEMS,             itemId);
export const getBookingRef         = (bookingId)  => doc(db, COLLECTIONS.BOOKINGS,          bookingId);
export const getItemRequestRef     = (requestId)  => doc(db, COLLECTIONS.ITEM_REQUESTS,     requestId);
export const getProviderRef        = (providerId) => doc(db, COLLECTIONS.SERVICE_PROVIDERS, providerId);
export const getServiceRequestRef  = (requestId)  => doc(db, COLLECTIONS.SERVICE_REQUESTS,  requestId);

// ── Data schemas (JSDoc) ───────────────────────────────────────────────────
// These are NOT enforced — they are here as documentation for all developers.

/**
 * @typedef {Object} UserDoc
 * @property {string}   name
 * @property {string}   email
 * @property {string}   [phone]
 * @property {string}   [profileImage]
 * @property {string}   [location]
 * @property {string}   language         - e.g. 'en', 'ml', 'hi', 'ta', 'kn'
 * @property {string[]} roles            - e.g. ['customer'], ['owner', 'customer']
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} ItemDoc
 * @property {string}   ownerId
 * @property {string}   name
 * @property {string}   category
 * @property {string}   description
 * @property {string[]} images
 * @property {number}   price
 * @property {string}   priceUnit        - e.g. 'day', 'hour', 'week'
 * @property {number}   securityDeposit
 * @property {string}   location
 * @property {boolean}  availability
 * @property {number}   rating
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} BookingDoc
 * @property {string}   itemId
 * @property {string}   renterId
 * @property {string}   ownerId
 * @property {import('firebase/firestore').Timestamp} startDate
 * @property {import('firebase/firestore').Timestamp} endDate
 * @property {number}   totalAmount
 * @property {number}   securityDeposit
 * @property {string}   status           - 'pending' | 'active' | 'done' | 'canceled'
 * @property {string}   pickupOption     - 'pickup' | 'delivery'
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} ItemRequestDoc
 * @property {string}   requesterId
 * @property {string}   itemName
 * @property {string}   category
 * @property {string}   description
 * @property {string}   location
 * @property {import('firebase/firestore').Timestamp} startDate
 * @property {import('firebase/firestore').Timestamp} endDate
 * @property {string}   [budget]
 * @property {string}   status           - 'open' | 'fulfilled' | 'cancelled'
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} ServiceProviderDoc
 * @property {string}   userId
 * @property {string[]} services
 * @property {number}   experience       - years
 * @property {string}   location
 * @property {number}   price
 * @property {number}   rating
 * @property {boolean}  availability
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} ServiceRequestDoc
 * @property {string}   customerId
 * @property {string}   providerId
 * @property {string}   serviceCategory
 * @property {string}   description
 * @property {import('firebase/firestore').Timestamp} date
 * @property {string}   time
 * @property {string}   location
 * @property {string}   [image]
 * @property {number}   estimatedBudget
 * @property {string}   status           - 'pending' | 'accepted' | 'done' | 'canceled'
 * @property {import('firebase/firestore').Timestamp} createdAt
 */
