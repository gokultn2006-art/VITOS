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

// Calculate leave-by prediction based on class start time and walking duration
export function calculateLeaveByTime(
  classStartTimeStr: string,
  walkingMinutes: number
): { leaveInMinutes: number; leaveByTimeString: string } {
  // Parse time string e.g. "08:00 AM" or "02:00 PM"
  const [time, period] = classStartTimeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Calculate departure time by subtracting walking minutes from class start
  const classStartTotalMinutes = hours * 60 + minutes;
  let leaveTotalMinutes = classStartTotalMinutes - walkingMinutes;
  if (leaveTotalMinutes < 0) {
    leaveTotalMinutes += 24 * 60;
  }

  const leaveHour24 = Math.floor(leaveTotalMinutes / 60) % 24;
  const leaveMin = leaveTotalMinutes % 60;

  const leavePeriod = leaveHour24 >= 12 ? 'PM' : 'AM';
  let leaveHour12 = leaveHour24 % 12;
  if (leaveHour12 === 0) leaveHour12 = 12;

  const leaveByTimeString = `${String(leaveHour12).padStart(2, '0')}:${String(leaveMin).padStart(2, '0')} ${leavePeriod}`;

  return { leaveInMinutes: walkingMinutes, leaveByTimeString };
}
