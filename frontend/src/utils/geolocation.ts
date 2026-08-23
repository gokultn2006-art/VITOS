export interface LatLng {
  lat: number;
  lng: number;
}

// Haversine distance in meters
export function calculateDistanceMeters(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Calculate walking time in minutes based on average 1.25 m/s speed
export function calculateWalkingMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 75));
}

// Calculate leave-by prediction
export function calculateLeaveByTime(
  classStartTimeStr: string,
  walkingMinutes: number
): { leaveInMinutes: number; leaveByTimeString: string } {
  // Parse time string e.g. "10:00 AM"
  const now = new Date();
  const [time, period] = classStartTimeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const targetDate = new Date();
  targetDate.setHours(hours, minutes, 0, 0);

  // If target date has passed today, assume target is in 15 mins for demo
  if (targetDate.getTime() < now.getTime()) {
    targetDate.setTime(now.getTime() + 20 * 60 * 1000);
  }

  const leaveDate = new Date(targetDate.getTime() - walkingMinutes * 60 * 1000);
  const diffMs = leaveDate.getTime() - now.getTime();
  const leaveInMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

  const leaveByTimeString = leaveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return { leaveInMinutes, leaveByTimeString };
}
