// src/utils/userSession.js
// Provides persistent guest ID & provider identity when user is not authenticated.

export function getActiveUserId(currentUser) {
  if (currentUser?.uid) {
    return currentUser.uid;
  }
  let guestId = localStorage.getItem('lendit_guest_user_id');
  if (!guestId) {
    guestId = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    localStorage.setItem('lendit_guest_user_id', guestId);
  }
  return guestId;
}

export function getProviderId(currentUser) {
  if (currentUser?.uid) {
    return currentUser.uid;
  }
  return localStorage.getItem('lendit_provider_id') || null;
}

export function setProviderId(id) {
  if (id) {
    localStorage.setItem('lendit_provider_id', id);
  } else {
    localStorage.removeItem('lendit_provider_id');
  }
}

export function getCustomerInfo(currentUser) {
  const name = currentUser?.displayName || localStorage.getItem('lendit_customer_name') || '';
  const phone = currentUser?.phoneNumber || localStorage.getItem('lendit_customer_phone') || '';
  return { name, phone };
}

export function saveCustomerInfo(name, phone) {
  if (name) localStorage.setItem('lendit_customer_name', name);
  if (phone) localStorage.setItem('lendit_customer_phone', phone);
}
