// Shared rental accounting rules.

export const PLATFORM_FEE_RATE = 0.05;
export const PLATFORM_FEE_DUE_DAYS = 1;

export function calculatePlatformFee(totalAmount) {
  return Math.round((Number(totalAmount) || 0) * PLATFORM_FEE_RATE * 100) / 100;
}

export function getPlatformFeeDueDate(booking = {}) {
  if (booking.platformFeeDueAt) {
    const explicitDate = booking.platformFeeDueAt.toDate
      ? booking.platformFeeDueAt.toDate()
      : new Date(booking.platformFeeDueAt);
    if (!Number.isNaN(explicitDate.getTime())) return explicitDate;
  }

  const completedAt = booking.completedAt || booking.createdAt;
  if (!completedAt) return null;

  const baseDate = completedAt.toDate ? completedAt.toDate() : new Date(completedAt);
  if (Number.isNaN(baseDate.getTime())) return null;

  return new Date(baseDate.getTime() + PLATFORM_FEE_DUE_DAYS * 24 * 60 * 60 * 1000);
}

export function isPlatformFeePaid(booking = {}) {
  return booking.platformFeePaid === true || booking.platformFeePaymentStatus === 'paid';
}

export function isPlatformFeeExpired(booking = {}, now = new Date()) {
  const dueDate = getPlatformFeeDueDate(booking);
  return !isPlatformFeePaid(booking) && dueDate ? dueDate.getTime() < now.getTime() : false;
}

export function calculateRentalFinancials({ rentalCost = 0, securityDeposit = 0 } = {}) {
  const normalizedRentalCost = Number(rentalCost) || 0;
  const normalizedSecurityDeposit = Number(securityDeposit) || 0;
  const totalAmount = normalizedRentalCost + normalizedSecurityDeposit;
  const platformFee = calculatePlatformFee(totalAmount);

  return {
    rentalCost: normalizedRentalCost,
    securityDeposit: normalizedSecurityDeposit,
    totalAmount,
    platformFee,
    ownerPayout: Math.round((totalAmount - platformFee) * 100) / 100,
    platformFeeRate: PLATFORM_FEE_RATE,
  };
}
