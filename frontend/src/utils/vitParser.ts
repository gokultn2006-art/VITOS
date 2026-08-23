import { lookupVitSlot } from './vitSlotMaster';

export interface ParsedCourseItem {
  courseCode: string;
  courseName: string;
  courseType: 'theory' | 'lab';
  rawSlots: string[];
  slotString: string;
  venue: string;
  faculty: string;
}

export interface GridCellCourse {
  courseCode: string;
  courseName: string;
  slotCode: string;
  venue: string;
  faculty: string;
  courseType: 'theory' | 'lab';
}

export interface GridCell {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  periodIndex: number; // 0 to 11
  courses: GridCellCourse[];
  hasClash?: boolean;
}

export function parseVitCourseRegistrationText(rawText: string): ParsedCourseItem[] {
  const courses: ParsedCourseItem[] = [];
  if (!rawText || !rawText.trim()) return courses;

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentCode = '';
  let currentTitle = '';
  let currentSlots: string[] = [];
  let currentSlotStr = '';
  let currentVenue = '';
  let currentFaculty = '';

  const finalizeCurrentCourse = () => {
    if (currentCode && currentSlotStr && currentSlotStr !== 'NIL' && currentSlots.length > 0) {
      // Ignore courses with NIL or Extramural (L17/L18) or invalid slots
      const validSlots = currentSlots.filter(s => s !== 'NIL' && s !== 'L17' && s !== 'L18' && lookupVitSlot(s).length > 0);
      if (validSlots.length > 0) {
        // Determine type: starts with 'L' -> lab, else theory
        const isLab = validSlots[0].startsWith('L');
        courses.push({
          courseCode: currentCode,
          courseName: currentTitle || currentCode,
          courseType: isLab ? 'lab' : 'theory',
          rawSlots: validSlots,
          slotString: validSlots.join('+'),
          venue: currentVenue || 'SJT Block',
          faculty: currentFaculty || 'VIT Faculty'
        });
      }
    }
    currentCode = '';
    currentTitle = '';
    currentSlots = [];
    currentSlotStr = '';
    currentVenue = '';
    currentFaculty = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check course header line e.g. "IMAT205L - Discrete Mathematics and Graph Theory"
    const headerMatch = line.match(/^([A-Z0-9]{5,9})\s*-\s*(.+)$/i);
    if (headerMatch) {
      finalizeCurrentCourse();
      currentCode = headerMatch[1].toUpperCase();
      currentTitle = headerMatch[2].trim();
      continue;
    }

    // Check slot line e.g. "C2+TC2+TCC2 -", "L19+L20 -", "L11+L12 - SJT218", "C2+TC2+TCC2 - SJT208"
    const slotMatch = line.match(/^([A-Z0-9\+]+)\s*-\s*(.*)$/i);
    if (slotMatch) {
      const slotCandidate = slotMatch[1].trim().toUpperCase();
      if (slotCandidate !== 'NIL' && (slotCandidate.includes('+') || lookupVitSlot(slotCandidate).length > 0)) {
        currentSlotStr = slotCandidate;
        currentSlots = slotCandidate.split('+').map(s => s.trim()).filter(Boolean);

        if (slotMatch[2] && slotMatch[2].trim() && slotMatch[2].trim() !== '-') {
          currentVenue = slotMatch[2].trim();
        }
      }
    }

    // Check standalone venue line e.g. "SJT208", "SJT124", "SJT205", "SJT218", "SJT223", "SJT121", "SJT204"
    if (!currentVenue && line.match(/^[A-Z]{2,4}[0-9]{3}$/i) && line.toUpperCase() !== currentCode) {
      currentVenue = line.toUpperCase();
    }

    // Check faculty line e.g. "SHUBHANGI DWIVEDI -"
    const facultyMatch = line.match(/^([A-Z\s\.]+)\s*-\s*$/);
    if (facultyMatch && !currentFaculty) {
      const facName = facultyMatch[1].trim();
      if (facName.length > 3 && !facName.includes('Semester') && !facName.includes('General')) {
        currentFaculty = facName;
      }
    }
  }

  finalizeCurrentCourse();

  return courses;
}

export function convertCoursesToGridMap(parsedCourses: ParsedCourseItem[]): Map<string, GridCell> {
  const gridMap = new Map<string, GridCell>();
  const getCellKey = (day: string, periodIdx: number) => `${day}_${periodIdx}`;

  parsedCourses.forEach((c) => {
    c.rawSlots.forEach((slotCode) => {
      const mappedSlots = lookupVitSlot(slotCode);

      mappedSlots.forEach((slotInfo) => {
        const key = getCellKey(slotInfo.day, slotInfo.periodIndex);

        if (!gridMap.has(key)) {
          gridMap.set(key, {
            day: slotInfo.day as any,
            periodIndex: slotInfo.periodIndex,
            courses: [],
          });
        }

        const cell = gridMap.get(key)!;
        cell.courses.push({
          courseCode: c.courseCode,
          courseName: c.courseName,
          slotCode: slotInfo.slotCode,
          venue: c.venue,
          faculty: c.faculty,
          courseType: c.courseType,
        });

        if (cell.courses.length > 1) {
          cell.hasClash = true;
        }
      });
    });
  });

  return gridMap;
}
