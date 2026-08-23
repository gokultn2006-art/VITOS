export interface VitSlotDef {
  code: string;
  name: string;
  type: 'theory' | 'lab';
  startTime: string;
  endTime: string;
  dayPattern?: string[];
}

export const VIT_THEORY_SLOTS: { time: string; slots: string[]; isLunch?: boolean }[] = [
  { time: '08:00 AM - 08:50 AM', slots: ['A1', 'F1'] },
  { time: '09:00 AM - 09:50 AM', slots: ['B1', 'G1'] },
  { time: '10:00 AM - 10:50 AM', slots: ['C1', 'A2'] },
  { time: '11:00 AM - 11:50 AM', slots: ['D1', 'B2'] },
  { time: '12:00 PM - 12:50 PM', slots: ['E1', 'C2'] },
  { time: '01:00 PM - 01:50 PM', slots: ['LUNCH BREAK'], isLunch: true },
  { time: '02:00 PM - 02:50 PM', slots: ['A2', 'F2'] },
  { time: '03:00 PM - 03:50 PM', slots: ['B2', 'G2'] },
  { time: '04:00 PM - 04:50 PM', slots: ['C2', 'A1'] },
  { time: '05:00 PM - 05:50 PM', slots: ['D2', 'B1'] },
  { time: '06:00 PM - 06:50 PM', slots: ['E2', 'C1'] },
  { time: '07:01 PM - 07:50 PM', slots: ['V1', 'V2'] },
];

export const VIT_LAB_SLOTS: { time: string; slots: string[]; isLunch?: boolean }[] = [
  { time: '08:00 AM - 09:40 AM', slots: ['L1+L2', 'L31+L32'] },
  { time: '09:51 AM - 11:30 AM', slots: ['L3+L4', 'L33+L34'] },
  { time: '11:40 AM - 01:20 PM', slots: ['L5+L6', 'L35+L36'] },
  { time: '01:20 PM - 02:00 PM', slots: ['LUNCH BREAK'], isLunch: true },
  { time: '02:00 PM - 03:40 PM', slots: ['L31+L32', 'L1+L2'] },
  { time: '03:51 PM - 05:30 PM', slots: ['L33+L34', 'L3+L4'] },
  { time: '05:40 PM - 07:20 PM', slots: ['L35+L36', 'L5+L6'] },
];

export interface TimetableEntryItem {
  id: string;
  day: string;
  slot: string;
  sessionType: 'theory' | 'lab';
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  faculty: string;
  roomNumber: string;
  buildingCode: string;
  buildingName: string;
  walkingTimeMinutes: number;
  isNext?: boolean;
}

export interface TimetableClash {
  day: string;
  time: string;
  courseA: TimetableEntryItem;
  courseB: TimetableEntryItem;
}

export function detectTimetableClashes(entries: TimetableEntryItem[]): TimetableClash[] {
  const clashes: TimetableClash[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];

      if (a.day === b.day) {
        // Check time overlap
        if (a.startTime === b.startTime || a.slot === b.slot) {
          clashes.push({
            day: a.day,
            time: `${a.startTime} - ${a.endTime}`,
            courseA: a,
            courseB: b,
          });
        }
      }
    }
  }

  return clashes;
}
