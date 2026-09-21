import {
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { itemsCol, bookingsCol } from '../firebase/collections';

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export async function getOwnerItemIds(ownerId) {
  const snapshot = await getDocs(query(itemsCol, where('ownerId', '==', ownerId)));
  return snapshot.docs.map((itemDoc) => itemDoc.id);
}

function matchesOwner(data, ownerId, ownerItemIds) {
  return data.ownerId === ownerId || ownerItemIds.has(data.itemId);
}

export function filterOwnerBookings(bookingMap, ownerId, ownerItemIds, statuses = null) {
  return [...bookingMap.values()]
    .filter(({ data }) => matchesOwner(data, ownerId, ownerItemIds))
    .filter(({ data }) => !statuses || statuses.includes(data.status))
    .map(({ id, data }) => ({ id, ...data }));
}

export async function getOwnerBookings(ownerId, statuses = null) {
  const itemIds = await getOwnerItemIds(ownerId);
  const ownerItemIds = new Set(itemIds);
  const bookingMap = new Map();

  const directSnapshot = await getDocs(query(bookingsCol, where('ownerId', '==', ownerId)));
  directSnapshot.docs.forEach((bookingDoc) => {
    bookingMap.set(bookingDoc.id, { id: bookingDoc.id, data: bookingDoc.data() });
  });

  await Promise.all(chunk(itemIds, 30).map(async (itemIdChunk) => {
    const snapshot = await getDocs(query(bookingsCol, where('itemId', 'in', itemIdChunk)));
    snapshot.docs.forEach((bookingDoc) => {
      bookingMap.set(bookingDoc.id, { id: bookingDoc.id, data: bookingDoc.data() });
    });
  }));

  return filterOwnerBookings(bookingMap, ownerId, ownerItemIds, statuses);
}

export function subscribeToOwnerBookings(ownerId, statuses, onChange, onError) {
  const bookingMap = new Map();
  const unsubscribers = [];
  const sourceIds = new Map();
  let ownerItemIds = new Set();
  let disposed = false;

  const publish = () => {
    if (!disposed) onChange(filterOwnerBookings(bookingMap, ownerId, ownerItemIds, statuses));
  };

  const subscribe = (bookingQuery, sourceKey) => {
    unsubscribers.push(onSnapshot(
      bookingQuery,
      (snapshot) => {
        const previousIds = sourceIds.get(sourceKey) || new Set();
        const currentIds = new Set(snapshot.docs.map((bookingDoc) => bookingDoc.id));
        sourceIds.set(sourceKey, currentIds);
        previousIds.forEach((bookingId) => {
          const stillPresent = [...sourceIds.values()].some((ids) => ids.has(bookingId));
          if (!stillPresent) bookingMap.delete(bookingId);
        });
        snapshot.docs.forEach((bookingDoc) => {
          bookingMap.set(bookingDoc.id, { id: bookingDoc.id, data: bookingDoc.data() });
        });
        publish();
      },
      onError
    ));
  };

  const start = async () => {
    try {
      ownerItemIds = new Set(await getOwnerItemIds(ownerId));
      subscribe(query(bookingsCol, where('ownerId', '==', ownerId)), 'owner');
      for (const [index, itemIdChunk] of chunk([...ownerItemIds], 30).entries()) {
        subscribe(query(bookingsCol, where('itemId', 'in', itemIdChunk)), `items-${index}`);
      }
      publish();
    } catch (error) {
      onError(error);
    }
  };

  void start();

  return () => {
    disposed = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
