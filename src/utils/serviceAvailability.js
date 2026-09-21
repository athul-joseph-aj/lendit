const DAY_IDS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_RANGES = {
  'Full Day (9 AM - 6 PM)': [9 * 60, 18 * 60],
  'Morning (8 AM - 1 PM)': [8 * 60, 13 * 60],
  'Evening (2 PM - 8 PM)': [14 * 60, 20 * 60],
};

export function parseTimeToMinutes(value) {
  const text = String(value || '').trim().toUpperCase();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3];
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
  }
  if (hours > 23) return null;
  return hours * 60 + minutes;
}

export function formatTimeLabel(value) {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return String(value || '').trim();
  const hours24 = Math.floor(minutes / 60);
  const hours12 = hours24 % 12 || 12;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  return `${hours12}:${String(minutes % 60).padStart(2, '0')} ${meridiem}`;
}

export function toTimeInputValue(value) {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return '';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function isProviderAvailableAt(provider, date, time) {
  if (!provider?.isAvailable) return false;
  if (!date) return false;

  const requestedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(requestedDate.getTime())) return false;

  const availableDays = Array.isArray(provider.availability) ? provider.availability : [];
  const requestedDay = DAY_IDS[requestedDate.getDay()];
  if (availableDays.length > 0 && !availableDays.includes(requestedDay)) return false;

  if (provider.workingHours === 'Flexible / 24/7') return true;
  const range = TIME_RANGES[provider.workingHours] || TIME_RANGES['Full Day (9 AM - 6 PM)'];
  const requestedMinutes = parseTimeToMinutes(time);
  if (requestedMinutes == null) return true;
  return requestedMinutes >= range[0] && requestedMinutes <= range[1];
}
