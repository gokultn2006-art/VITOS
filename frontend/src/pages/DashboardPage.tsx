import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, MapPin, Bot, DoorOpen, Navigation2, Clock,
  Activity, BookOpen, Printer, CreditCard, Sparkles,
  ArrowRight, Footprints, AlertCircle, Calendar,
  ChevronRight, LocateFixed, Radio, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsList, campusLocations } from '../data/mockData';
import { calculateDistanceMeters, calculateWalkingMinutes, calculateLeaveByTime } from '../utils/geolocation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { NotificationCard } from '../components/NotificationCard';
import { parseVitCourseRegistrationText } from '../utils/vitParser';
import { lookupVitSlot } from '../utils/vitSlotMaster';
import type { VitSlotInfo } from '../utils/vitSlotMaster';
import { DEFAULT_VIT_REGISTRATION_DATA } from '../data/mockData';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ScheduledClass {
  courseCode: string;
  courseName: string;
  courseType: 'theory' | 'lab';
  faculty: string;
  venue: string;
  slotCode: string;
  slotInfo: VitSlotInfo;
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  dayLabel: string;
  statusType: 'ongoing' | 'today' | 'upcoming';
  minutesUntilStart: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const DAY_FULL: Record<string, string> = {
  MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY',
  THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY', SUN: 'SUNDAY',
};

function parseTimeToMinutes(timeStr: string): number {
  const t = timeStr.trim().toUpperCase();
  try {
    if (t.includes('AM') || t.includes('PM')) {
      const [timePart, period] = t.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  } catch { return 8 * 60; }
}



function resolveVenueLocation(venue: string) {
  const code = (venue || 'SJT').substring(0, 3).toUpperCase();
  return campusLocations.find((l) => l.code === code) || campusLocations[0];
}

/** Build flat list of all class occurrences from localStorage-parsed courses */
function buildAllOccurrences(regNo: string): ScheduledClass[] {
  const storageKey = `vitos_timetable_${regNo}`;
  let rawText = '';
  try {
    rawText = localStorage.getItem(storageKey) || DEFAULT_VIT_REGISTRATION_DATA;
  } catch { rawText = DEFAULT_VIT_REGISTRATION_DATA; }

  const parsed = parseVitCourseRegistrationText(rawText);
  const all: ScheduledClass[] = [];

  parsed.forEach((course) => {
    course.rawSlots.forEach((slotCode) => {
      const slotInfos = lookupVitSlot(slotCode);
      slotInfos.forEach((si) => {
        all.push({
          courseCode: course.courseCode,
          courseName: course.courseName,
          courseType: course.courseType,
          faculty: course.faculty,
          venue: course.venue,
          slotCode: si.slotCode,
          slotInfo: si,
          startMinutes: parseTimeToMinutes(si.startTime),
          endMinutes: parseTimeToMinutes(si.endTime),
          dayLabel: '',
          statusType: 'upcoming',
          minutesUntilStart: 0,
        });
      });
    });
  });

  return all;
}

/** Given all occurrences + current JS Date, return [currentClass, nextClass] */
function computeSchedule(all: ScheduledClass[], now: Date): {
  current: ScheduledClass | null;
  next: ScheduledClass | null;
  todayDate: string;
  todayDayCode: string;
} {
  const todayJsDay = now.getDay(); // 0=Sun, 1=Mon, ...
  const todayDayCode = DAY_CODES[todayJsDay];
  const todayDate = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const nowMins = now.getHours() * 60 + now.getMinutes();

  // filter today's classes
  const todayClasses = all.filter((c) => c.slotInfo.day === todayDayCode);

  // currently ONGOING
  const current = todayClasses.find((c) => c.startMinutes <= nowMins && nowMins <= c.endMinutes) || null;

  // upcoming TODAY (start strictly > now)
  const laterToday = todayClasses
    .filter((c) => c.startMinutes > nowMins)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let next: ScheduledClass | null = null;

  if (laterToday.length > 0) {
    const cls = { ...laterToday[0] };
    cls.statusType = 'today';
    cls.dayLabel = 'Later Today';
    cls.minutesUntilStart = cls.startMinutes - nowMins;
    next = cls;
  } else {
    // look ahead up to 6 days
    for (let offset = 1; offset <= 6; offset++) {
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + offset);
      const futureDay = DAY_CODES[futureDate.getDay()];
      const futureDayClasses = all
        .filter((c) => c.slotInfo.day === futureDay)
        .sort((a, b) => a.startMinutes - b.startMinutes);

      if (futureDayClasses.length > 0) {
        const cls = { ...futureDayClasses[0] };
        cls.statusType = 'upcoming';
        cls.dayLabel = offset === 1 ? 'Tomorrow' : DAY_FULL[futureDay] || futureDay;
        cls.minutesUntilStart = offset * 1440 + cls.startMinutes - nowMins;
        next = cls;
        break;
      }
    }
  }

  return { current, next, todayDate, todayDayCode };
}

// ─── ClassCard sub-component ───────────────────────────────────────────────────
function ClassCard({
  cls, badge, borderColor, userLat, userLng, onNavigate,
}: {
  cls: ScheduledClass;
  badge: React.ReactNode;
  borderColor: string;
  userLat: number;
  userLng: number;
  onNavigate: (venue: string) => void;
}) {
  const loc = resolveVenueLocation(cls.venue);
  const distM = calculateDistanceMeters({ lat: userLat, lng: userLng }, { lat: loc.lat, lng: loc.lng });
  const walkMin = calculateWalkingMinutes(distM);
  const leaveInfo = calculateLeaveByTime(cls.slotInfo.startTime, walkMin);

  return (
    <div className={`rounded-2xl border-2 ${borderColor} p-4 space-y-3 transition-all`}>
      {/* top row: badge + day */}
      <div className="flex items-center justify-between">
        {badge}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{cls.dayLabel ? `${cls.dayLabel} · ` : ''}{DAY_FULL[cls.slotInfo.day] || cls.slotInfo.day}</span>
        </div>
      </div>

      {/* course info */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-mono font-bold mb-0.5 ${cls.courseType === 'lab' ? 'text-[#005F73]' : 'text-[#329d9c]'}`}>
            {cls.courseCode}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${cls.courseType === 'lab' ? 'bg-[#005F73]/10' : 'bg-[#329d9c]/10'}`}>
              {cls.courseType.toUpperCase()}
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 leading-snug truncate" title={cls.courseName}>
            {cls.courseName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Faculty: <span className="text-slate-700 font-semibold">{cls.faculty}</span>
          </p>
        </div>

        <div className="shrink-0 text-right sm:border-l sm:border-slate-100 sm:pl-4 space-y-1">
          <div className="text-xs font-mono font-bold text-slate-700">
            {cls.slotInfo.startTime} – {cls.slotInfo.endTime}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#005F73]/10 text-[#005F73] text-[11px] font-extrabold">
            <MapPin className="w-3 h-3" />
            {cls.venue}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {distM} m · {walkMin} min walk
          </div>
        </div>
      </div>

      {/* departure + navigate */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
        <div className="flex items-center gap-1.5 text-xs text-amber-800">
          <Footprints className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>Leave by </strong>
            <span className="font-mono font-bold">{leaveInfo.leaveByTimeString}</span>
            <span className="text-amber-600/80 ml-1">({walkMin} min walk)</span>
          </span>
        </div>
        <button
          onClick={() => onNavigate(cls.venue)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#005F73] hover:bg-[#0A9396] text-white text-[11px] font-bold transition-colors"
        >
          <Navigation2 className="w-3 h-3" />
          Go
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [greeting, setGreeting] = useState('Good morning');
  const [now, setNow] = useState(new Date());
  const [currentClass, setCurrentClass] = useState<ScheduledClass | null>(null);
  const [nextClass, setNextClass] = useState<ScheduledClass | null>(null);
  const [todayDate, setTodayDate] = useState('');
  const [todayDayCode, setTodayDayCode] = useState('');
  const [hasTimetable, setHasTimetable] = useState(true);

  // GPS
  const [userLat, setUserLat] = useState(12.9718);
  const [userLng, setUserLng] = useState(79.1633);
  const [locationName, setLocationName] = useState('VIT Campus');
  const [locatingGPS, setLocatingGPS] = useState(false);

  // ── greeting ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h >= 5 && h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  // ── live clock: tick every 30 s ────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(tick);
  }, []);

  // ── GPS watch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocatingGPS(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationName('Your Location');
        setLocatingGPS(false);
      },
      () => setLocatingGPS(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── compute schedule whenever clock ticks or user changes ──────────────────
  const computeAndSet = useCallback(() => {
    const regNo = user?.regNo || '22BCE1024';
    const all = buildAllOccurrences(regNo);

    if (all.length === 0) {
      setHasTimetable(false);
      setCurrentClass(null);
      setNextClass(null);
      setTodayDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
      setTodayDayCode(DAY_CODES[new Date().getDay()]);
      return;
    }

    setHasTimetable(true);
    const { current, next, todayDate: td, todayDayCode: tdc } = computeSchedule(all, now);
    setCurrentClass(current);
    setNextClass(next);
    setTodayDate(td);
    setTodayDayCode(tdc);
  }, [user?.regNo, now]);

  useEffect(() => { computeAndSet(); }, [computeAndSet]);

  // ── quick services ─────────────────────────────────────────────────────────
  const quickServices = [
    { name: 'Medical Centre',  code: 'MED',      icon: Activity,   bg: 'bg-emerald-50 text-emerald-700', lat: 12.9705, lng: 79.1622 },
    { name: 'Central Library', code: 'LIB',      icon: BookOpen,   bg: 'bg-blue-50 text-blue-700',       lat: 12.9712, lng: 79.1625 },
    { name: 'Printing Centre', code: 'PRINT_TT', icon: Printer,    bg: 'bg-purple-50 text-purple-700',   lat: 12.9720, lng: 79.1638 },
    { name: 'ATMs & Bank',     code: 'ATM_MB',   icon: CreditCard, bg: 'bg-amber-50 text-amber-700',     lat: 12.9715, lng: 79.1630 },
  ];

  const handleNavigate = (venue: string) =>
    navigate(`/map?destination=${encodeURIComponent(venue)}`);

  const hasAnyClass = currentClass !== null || nextClass !== null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Greeting Banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Compass className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          {/* meta pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-teal-100">
              <Sparkles className="w-3.5 h-3.5 text-[#94D2BD]" />
              <span>{user?.regNo || '22BCE1024'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-teal-200">
              <Calendar className="w-3 h-3" />
              <span>{todayDate}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-teal-200">
              <Clock className="w-3 h-3" />
              <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {greeting}, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-xs md:text-sm text-teal-100/90 mt-1 leading-relaxed">
            {user?.program || 'B.Tech Computer Science and Engineering'} ({user?.year || '3rd Year'})
          </p>

          {/* GPS pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-teal-300/80">
            {locatingGPS
              ? <><LocateFixed className="w-3 h-3 animate-pulse" /> Getting your location...</>
              : <><MapPin className="w-3 h-3" /> {locationName}</>
            }
          </div>

          {/* quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            {[
              { label: 'Campus Map',   icon: MapPin,       path: '/map' },
              { label: 'Navigate',     icon: Navigation2,  path: '/map?myLocation=true' },
              { label: 'AI Assistant', icon: Bot,          path: '/assistant' },
              { label: 'Classrooms',   icon: DoorOpen,     path: '/classrooms' },
            ].map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-all text-left"
              >
                <a.icon className="w-4 h-4 text-[#94D2BD]" />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Schedule Card */}
        <Card className="lg:col-span-2 border border-slate-200/80 p-5">
          {/* header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#005F73]" />
              <span className="text-xs font-bold text-[#005F73] uppercase tracking-wider">Today's Schedule</span>
              {todayDayCode && (
                <span className="px-2 py-0.5 rounded-md bg-[#005F73]/10 text-[#005F73] text-[10px] font-bold">
                  {todayDayCode}
                </span>
              )}
            </div>
            <button
              onClick={computeAndSet}
              className="text-[11px] text-slate-400 hover:text-[#005F73] transition-colors flex items-center gap-1"
              title="Refresh schedule"
            >
              <Radio className="w-3.5 h-3.5" /> Live
            </button>
          </div>

          {/* no timetable imported */}
          {!hasTimetable ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No timetable found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Import your VTOP registration slip in the Timetable page to start seeing your schedule here.
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/timetable')}>
                Import Timetable
              </Button>
            </div>
          ) : !hasAnyClass ? (
            /* timetable exists but no classes today or upcoming */
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">All done for today! 🎉</p>
              <p className="text-xs text-slate-400 mt-1">No more classes scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">

              {/* ── LIVE NOW ──────────────────────────────────────────────── */}
              {currentClass && (
                <ClassCard
                  cls={currentClass}
                  badge={
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      LIVE NOW
                    </span>
                  }
                  borderColor="border-emerald-300 bg-emerald-50/40"
                  userLat={userLat}
                  userLng={userLng}
                  onNavigate={handleNavigate}
                />
              )}

              {/* divider */}
              {currentClass && nextClass && (
                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Up Next</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}

              {/* ── NEXT CLASS ────────────────────────────────────────────── */}
              {nextClass && (
                <ClassCard
                  cls={nextClass}
                  badge={
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#005F73]/10 text-[#005F73] text-[11px] font-extrabold">
                      <ChevronRight className="w-3 h-3" />
                      {nextClass.dayLabel?.toUpperCase() || 'UPCOMING'}
                    </span>
                  }
                  borderColor="border-slate-200 bg-white"
                  userLat={userLat}
                  userLng={userLng}
                  onNavigate={handleNavigate}
                />
              )}
            </div>
          )}
        </Card>

        {/* Quick Campus Services */}
        <Card className="border border-slate-200/80 p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#005F73]" />
            Campus Quick Services
          </h3>
          <div className="space-y-2.5">
            {quickServices.map((srv) => {
              const IconComp = srv.icon;
              const distM = calculateDistanceMeters(
                { lat: userLat, lng: userLng },
                { lat: srv.lat, lng: srv.lng }
              );
              const walkMin = calculateWalkingMinutes(distM);
              return (
                <div
                  key={srv.code}
                  onClick={() => navigate(`/map?select=${srv.code}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#329d9c]/40 hover:shadow-sm transition-all cursor-pointer bg-white group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${srv.bg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#005F73] transition-colors">
                        {srv.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{distM} m · {walkMin} min</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#005F73] group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <Card className="border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#005F73]" />
            <h3 className="text-sm font-bold text-slate-800">Recent Campus &amp; Timetable Notifications</h3>
          </div>
          <span className="text-xs text-slate-400">Auto-generated from active timetable</span>
        </div>
        <div className="space-y-3">
          {notificationsList.map((notif) => (
            <NotificationCard key={notif.id} notification={notif} />
          ))}
        </div>
      </Card>
    </div>
  );
};
