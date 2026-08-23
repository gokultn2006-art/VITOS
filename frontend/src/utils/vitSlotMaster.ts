export interface VitSlotInfo {
  slotCode: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  sessionType: 'theory' | 'lab';
  periodIndex: number; // 0-5 Morning, 6-11 Afternoon
  startTime: string;
  endTime: string;
}

export interface HeaderColumn {
  index: number;
  theoryTime: string;
  labTime: string;
  isLunch?: boolean;
}

export const TABLE_COLUMNS: HeaderColumn[] = [
  { index: 0, theoryTime: '08:00 AM to 08:50 AM', labTime: '08:00 AM to 08:50 AM' },
  { index: 1, theoryTime: '08:55 AM to 09:45 AM', labTime: '08:50 AM to 09:40 AM' },
  { index: 2, theoryTime: '09:50 AM to 10:40 AM', labTime: '09:50 AM to 10:40 AM' },
  { index: 3, theoryTime: '10:45 AM to 11:35 AM', labTime: '10:40 AM to 11:30 AM' },
  { index: 4, theoryTime: '11:40 AM to 12:30 PM', labTime: '11:40 AM to 12:30 PM' },
  { index: 5, theoryTime: '', labTime: '12:30 PM to 01:20 PM' },
  { index: 6, theoryTime: 'LUNCH', labTime: 'LUNCH', isLunch: true },
  { index: 7, theoryTime: '02:00 PM to 02:50 PM', labTime: '02:00 PM to 02:50 PM' },
  { index: 8, theoryTime: '02:55 PM to 03:45 PM', labTime: '02:50 PM to 03:40 PM' },
  { index: 9, theoryTime: '03:50 PM to 04:40 PM', labTime: '03:50 PM to 04:40 PM' },
  { index: 10, theoryTime: '04:45 PM to 05:35 PM', labTime: '04:40 PM to 05:30 PM' },
  { index: 11, theoryTime: '05:40 PM to 06:30 PM', labTime: '05:40 PM to 06:30 PM' },
  { index: 12, theoryTime: '', labTime: '06:30 PM to 07:20 PM' },
];

export const DAYS_5 = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const;

export const DEFAULT_SLOT_LABEL: Record<string, string[]> = {
  MON: ['A1/L1', 'F1/L2', 'D1/L3', 'TB1/L4', 'TG1/L5', 'L6', 'A2/L31', 'F2/L32', 'D2/L33', 'TB2/L34', 'TG2/L35', 'L36'],
  TUE: ['B1/L7', 'G1/L8', 'E1/L9', 'TC1/L10', 'TAA1/L11', 'L12', 'B2/L37', 'G2/L38', 'E2/L39', 'TC2/L40', 'TAA2/L41', 'L42'],
  WED: ['C1/L13', 'A1/L14', 'F1/L15', 'TD1/L16', 'Extramural', 'Extramural', 'C2/L43', 'A2/L44', 'F2/L45', 'TD2/L46', 'TBB2/L47', 'L48'],
  THU: ['D1/L19', 'B1/L20', 'G1/L21', 'TE1/L22', 'TCC1/L23', 'L24', 'D2/L49', 'B2/L50', 'G2/L51', 'TE2/L52', 'TCC2/L53', 'L54'],
  FRI: ['E1/L25', 'C1/L26', 'TA1/L27', 'TF1/L28', 'TDD1/L29', 'L30', 'E2/L55', 'C2/L56', 'TA2/L57', 'TF2/L58', 'TDD2/L59', 'L60'],
};

export const VIT_SLOT_REGISTRY: Record<string, VitSlotInfo[]> = {
  // Morning Theory Slots
  'A1': [
    { slotCode: 'A1', day: 'MON', sessionType: 'theory', periodIndex: 0, startTime: '08:00 AM', endTime: '08:50 AM' },
    { slotCode: 'A1', day: 'WED', sessionType: 'theory', periodIndex: 1, startTime: '08:55 AM', endTime: '09:45 AM' },
  ],
  'B1': [
    { slotCode: 'B1', day: 'TUE', sessionType: 'theory', periodIndex: 0, startTime: '08:00 AM', endTime: '08:50 AM' },
    { slotCode: 'B1', day: 'THU', sessionType: 'theory', periodIndex: 1, startTime: '08:55 AM', endTime: '09:45 AM' },
  ],
  'C1': [
    { slotCode: 'C1', day: 'WED', sessionType: 'theory', periodIndex: 0, startTime: '08:00 AM', endTime: '08:50 AM' },
    { slotCode: 'C1', day: 'FRI', sessionType: 'theory', periodIndex: 1, startTime: '08:55 AM', endTime: '09:45 AM' },
  ],
  'D1': [
    { slotCode: 'D1', day: 'MON', sessionType: 'theory', periodIndex: 2, startTime: '09:50 AM', endTime: '10:40 AM' },
    { slotCode: 'D1', day: 'THU', sessionType: 'theory', periodIndex: 0, startTime: '08:00 AM', endTime: '08:50 AM' },
  ],
  'E1': [
    { slotCode: 'E1', day: 'TUE', sessionType: 'theory', periodIndex: 2, startTime: '09:50 AM', endTime: '10:40 AM' },
    { slotCode: 'E1', day: 'FRI', sessionType: 'theory', periodIndex: 0, startTime: '08:00 AM', endTime: '08:50 AM' },
  ],
  'F1': [
    { slotCode: 'F1', day: 'MON', sessionType: 'theory', periodIndex: 1, startTime: '08:55 AM', endTime: '09:45 AM' },
    { slotCode: 'F1', day: 'WED', sessionType: 'theory', periodIndex: 2, startTime: '09:50 AM', endTime: '10:40 AM' },
  ],
  'G1': [
    { slotCode: 'G1', day: 'TUE', sessionType: 'theory', periodIndex: 1, startTime: '08:55 AM', endTime: '09:45 AM' },
    { slotCode: 'G1', day: 'THU', sessionType: 'theory', periodIndex: 2, startTime: '09:50 AM', endTime: '10:40 AM' },
  ],

  // Afternoon Theory Slots
  'A2': [
    { slotCode: 'A2', day: 'MON', sessionType: 'theory', periodIndex: 6, startTime: '02:00 PM', endTime: '02:50 PM' },
    { slotCode: 'A2', day: 'WED', sessionType: 'theory', periodIndex: 7, startTime: '02:55 PM', endTime: '03:45 PM' },
  ],
  'B2': [
    { slotCode: 'B2', day: 'TUE', sessionType: 'theory', periodIndex: 6, startTime: '02:00 PM', endTime: '02:50 PM' },
    { slotCode: 'B2', day: 'THU', sessionType: 'theory', periodIndex: 7, startTime: '02:55 PM', endTime: '03:45 PM' },
  ],
  'C2': [
    { slotCode: 'C2', day: 'WED', sessionType: 'theory', periodIndex: 6, startTime: '02:00 PM', endTime: '02:50 PM' },
    { slotCode: 'C2', day: 'FRI', sessionType: 'theory', periodIndex: 7, startTime: '02:55 PM', endTime: '03:45 PM' },
  ],
  'D2': [
    { slotCode: 'D2', day: 'THU', sessionType: 'theory', periodIndex: 6, startTime: '02:00 PM', endTime: '02:50 PM' },
    { slotCode: 'D2', day: 'MON', sessionType: 'theory', periodIndex: 8, startTime: '03:50 PM', endTime: '04:40 PM' },
  ],
  'E2': [
    { slotCode: 'E2', day: 'FRI', sessionType: 'theory', periodIndex: 6, startTime: '02:00 PM', endTime: '02:50 PM' },
    { slotCode: 'E2', day: 'TUE', sessionType: 'theory', periodIndex: 8, startTime: '03:50 PM', endTime: '04:40 PM' },
  ],
  'F2': [
    { slotCode: 'F2', day: 'MON', sessionType: 'theory', periodIndex: 7, startTime: '02:55 PM', endTime: '03:45 PM' },
    { slotCode: 'F2', day: 'WED', sessionType: 'theory', periodIndex: 8, startTime: '03:50 PM', endTime: '04:40 PM' },
  ],
  'G2': [
    { slotCode: 'G2', day: 'TUE', sessionType: 'theory', periodIndex: 7, startTime: '02:55 PM', endTime: '03:45 PM' },
    { slotCode: 'G2', day: 'THU', sessionType: 'theory', periodIndex: 8, startTime: '03:50 PM', endTime: '04:40 PM' },
  ],

  // Tutorial Slots
  'TA1': [{ slotCode: 'TA1', day: 'FRI', sessionType: 'theory', periodIndex: 2, startTime: '09:50 AM', endTime: '10:40 AM' }],
  'TB1': [{ slotCode: 'TB1', day: 'MON', sessionType: 'theory', periodIndex: 3, startTime: '10:45 AM', endTime: '11:35 AM' }],
  'TC1': [{ slotCode: 'TC1', day: 'TUE', sessionType: 'theory', periodIndex: 3, startTime: '10:45 AM', endTime: '11:35 AM' }],
  'TD1': [{ slotCode: 'TD1', day: 'WED', sessionType: 'theory', periodIndex: 3, startTime: '10:45 AM', endTime: '11:35 AM' }],
  'TE1': [{ slotCode: 'TE1', day: 'THU', sessionType: 'theory', periodIndex: 3, startTime: '10:45 AM', endTime: '11:35 AM' }],
  'TF1': [{ slotCode: 'TF1', day: 'FRI', sessionType: 'theory', periodIndex: 3, startTime: '10:45 AM', endTime: '11:35 AM' }],
  'TG1': [{ slotCode: 'TG1', day: 'MON', sessionType: 'theory', periodIndex: 4, startTime: '11:40 AM', endTime: '12:30 PM' }],

  'TA2': [{ slotCode: 'TA2', day: 'FRI', sessionType: 'theory', periodIndex: 8, startTime: '03:50 PM', endTime: '04:40 PM' }],
  'TB2': [{ slotCode: 'TB2', day: 'MON', sessionType: 'theory', periodIndex: 9, startTime: '04:45 PM', endTime: '05:35 PM' }],
  'TC2': [{ slotCode: 'TC2', day: 'TUE', sessionType: 'theory', periodIndex: 9, startTime: '04:45 PM', endTime: '05:35 PM' }],
  'TD2': [{ slotCode: 'TD2', day: 'WED', sessionType: 'theory', periodIndex: 9, startTime: '04:45 PM', endTime: '05:35 PM' }],
  'TE2': [{ slotCode: 'TE2', day: 'THU', sessionType: 'theory', periodIndex: 9, startTime: '04:45 PM', endTime: '05:35 PM' }],
  'TF2': [{ slotCode: 'TF2', day: 'FRI', sessionType: 'theory', periodIndex: 9, startTime: '04:45 PM', endTime: '05:35 PM' }],
  'TG2': [{ slotCode: 'TG2', day: 'MON', sessionType: 'theory', periodIndex: 10, startTime: '05:40 PM', endTime: '06:30 PM' }],

  'TAA1': [{ slotCode: 'TAA1', day: 'TUE', sessionType: 'theory', periodIndex: 4, startTime: '11:40 AM', endTime: '12:30 PM' }],
  'TCC1': [{ slotCode: 'TCC1', day: 'THU', sessionType: 'theory', periodIndex: 4, startTime: '11:40 AM', endTime: '12:30 PM' }],
  'TDD1': [{ slotCode: 'TDD1', day: 'FRI', sessionType: 'theory', periodIndex: 4, startTime: '11:40 AM', endTime: '12:30 PM' }],

  'TAA2': [{ slotCode: 'TAA2', day: 'TUE', sessionType: 'theory', periodIndex: 10, startTime: '05:40 PM', endTime: '06:30 PM' }],
  'TBB2': [{ slotCode: 'TBB2', day: 'WED', sessionType: 'theory', periodIndex: 10, startTime: '05:40 PM', endTime: '06:30 PM' }],
  'TCC2': [{ slotCode: 'TCC2', day: 'THU', sessionType: 'theory', periodIndex: 10, startTime: '05:40 PM', endTime: '06:30 PM' }],
  'TDD2': [{ slotCode: 'TDD2', day: 'FRI', sessionType: 'theory', periodIndex: 10, startTime: '05:40 PM', endTime: '06:30 PM' }],
};

// Register Lab Slots (L1..L60) - EXCLUDING L17 and L18 (Wednesday Extramural reserved)
const labDaysList: VitSlotInfo['day'][] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
labDaysList.forEach((day, dIdx) => {
  // Morning Labs L1..L30
  for (let i = 0; i < 6; i++) {
    const lNum = dIdx * 6 + i + 1;
    if (lNum === 17 || lNum === 18) {
      // Extramural slots - No course can map to L17 or L18!
      continue;
    }
    const code = `L${lNum}`;
    VIT_SLOT_REGISTRY[code] = [
      { slotCode: code, day, sessionType: 'lab', periodIndex: i, startTime: TABLE_COLUMNS[i].labTime.split(' to ')[0], endTime: TABLE_COLUMNS[i].labTime.split(' to ')[1] }
    ];
  }

  // Afternoon Labs L31..L60
  for (let i = 0; i < 6; i++) {
    const lNum = 30 + dIdx * 6 + i + 1;
    const code = `L${lNum}`;
    const pIdx = i + 6; // 6 to 11
    VIT_SLOT_REGISTRY[code] = [
      { slotCode: code, day, sessionType: 'lab', periodIndex: pIdx, startTime: TABLE_COLUMNS[pIdx > 5 ? pIdx + 1 : pIdx].labTime.split(' to ')[0], endTime: TABLE_COLUMNS[pIdx > 5 ? pIdx + 1 : pIdx].labTime.split(' to ')[1] }
    ];
  }
});

export function lookupVitSlot(slotCode: string): VitSlotInfo[] {
  const code = slotCode.trim().toUpperCase();
  return VIT_SLOT_REGISTRY[code] || [];
}
