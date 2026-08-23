from dataclasses import dataclass
from typing import List, Dict, Set, Tuple, Optional

@dataclass(frozen=True)
class FFCSSlot:
    slot: str
    day: str  # 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
    period: int  # 1 to 13
    session_type: str  # 'theory' or 'lab'

    def cell_key(self) -> str:
        return f"{self.day}-{self.period}"


# Canonical VIT Slot Mapping Registry
SLOTS_REGISTRY: Dict[str, List[FFCSSlot]] = {}

def _add_slot(slot: str, day: str, period: int, session_type: str = 'theory'):
    code = slot.upper()
    if code not in SLOTS_REGISTRY:
        SLOTS_REGISTRY[code] = []
    SLOTS_REGISTRY[code].append(FFCSSlot(slot=code, day=day, period=period, session_type=session_type))

# Theory Slots
# MON
_add_slot("A1", "MON", 1)
_add_slot("F1", "MON", 2)
_add_slot("D1", "MON", 3)
_add_slot("TB1", "MON", 4)
_add_slot("TG1", "MON", 5)
_add_slot("A2", "MON", 7)
_add_slot("F2", "MON", 8)
_add_slot("D2", "MON", 9)
_add_slot("TB2", "MON", 10)
_add_slot("TG2", "MON", 11)
_add_slot("V3", "MON", 13)

# TUE
_add_slot("B1", "TUE", 1)
_add_slot("G1", "TUE", 2)
_add_slot("E1", "TUE", 3)
_add_slot("TC1", "TUE", 4)
_add_slot("TAA1", "TUE", 5)
_add_slot("B2", "TUE", 7)
_add_slot("G2", "TUE", 8)
_add_slot("E2", "TUE", 9)
_add_slot("TC2", "TUE", 10)
_add_slot("TAA2", "TUE", 11)
_add_slot("V4", "TUE", 13)

# WED
_add_slot("C1", "WED", 1)
_add_slot("A1", "WED", 2)
_add_slot("F1", "WED", 3)
_add_slot("TD1", "WED", 4)
# Note: Wednesday Period 5 and Period 6 (11:40 AM - 01:20 PM) are reserved for EXTRAMURAL activities.
_add_slot("C2", "WED", 7)
_add_slot("A2", "WED", 8)
_add_slot("F2", "WED", 9)
_add_slot("TD2", "WED", 10)
_add_slot("TBB2", "WED", 11)
_add_slot("V5", "WED", 13)

# THU
_add_slot("D1", "THU", 1)
_add_slot("B1", "THU", 2)
_add_slot("G1", "THU", 3)
_add_slot("TE1", "THU", 4)
_add_slot("TCC1", "THU", 5)
_add_slot("D2", "THU", 7)
_add_slot("B2", "THU", 8)
_add_slot("G2", "THU", 9)
_add_slot("TE2", "THU", 10)
_add_slot("TCC2", "THU", 11)
_add_slot("V6", "THU", 13)

# FRI
_add_slot("E1", "FRI", 1)
_add_slot("C1", "FRI", 2)
_add_slot("TA1", "FRI", 3)
_add_slot("TF1", "FRI", 4)
_add_slot("TDD1", "FRI", 5)
_add_slot("E2", "FRI", 7)
_add_slot("C2", "FRI", 8)
_add_slot("TA2", "FRI", 9)
_add_slot("TF2", "FRI", 10)
_add_slot("TDD2", "FRI", 11)
_add_slot("V7", "FRI", 13)

# Lab Slots L1 to L60 (MON to FRI) - Excluding L17 and L18 (Wednesday Extramural reserved)
for i in range(1, 7):
    _add_slot(f"L{i}", "MON", i, 'lab')
for i in range(31, 37):
    _add_slot(f"L{i}", "MON", i - 31 + 7, 'lab')

for i in range(7, 13):
    _add_slot(f"L{i}", "TUE", i - 6, 'lab')
for i in range(37, 43):
    _add_slot(f"L{i}", "TUE", i - 37 + 7, 'lab')

# WED: L13..L16 (Periods 1..4). L17 and L18 are reserved for Extramural activities.
for i in range(13, 17):
    _add_slot(f"L{i}", "WED", i - 12, 'lab')
for i in range(43, 49):
    _add_slot(f"L{i}", "WED", i - 43 + 7, 'lab')

for i in range(19, 25):
    _add_slot(f"L{i}", "THU", i - 18, 'lab')
for i in range(49, 55):
    _add_slot(f"L{i}", "THU", i - 49 + 7, 'lab')

for i in range(25, 31):
    _add_slot(f"L{i}", "FRI", i - 24, 'lab')
for i in range(55, 61):
    _add_slot(f"L{i}", "FRI", i - 55 + 7, 'lab')


class FFCSSlotParser:
    @staticmethod
    def resolve_token(token: str) -> List[FFCSSlot]:
        code = token.strip().upper()
        if code in ("L17", "L18"):
            raise ValueError(f"Slot {code} is reserved for Wednesday Extramural activities (11:40 AM - 01:20 PM). No course can be added during this slot.")
        if code not in SLOTS_REGISTRY:
            raise ValueError(f"Unknown FFCS slot: {code}")
        return SLOTS_REGISTRY[code]

    @staticmethod
    def parse_combination(combination_str: str) -> List[FFCSSlot]:
        if not combination_str or not combination_str.strip():
            return []

        tokens = [t.strip().upper() for t in combination_str.split('+') if t.strip()]
        if len(tokens) != len(set(tokens)):
            seen = set()
            duplicates = [t for t in tokens if t in seen or seen.add(t)]
            raise ValueError(f"Duplicate slot code found in combination: {duplicates[0]}")

        resolved_slots: List[FFCSSlot] = []
        for token in tokens:
            resolved_slots.extend(FFCSSlotParser.resolve_token(token))
        return resolved_slots


class TimetableConflictService:
    @staticmethod
    def map_occupied_cells(timetable_entries: List[Dict]) -> Dict[str, Dict]:
        cell_map: Dict[str, Dict] = {}
        for entry in timetable_entries:
            slot_comb = entry.get('slot_combination') or entry.get('slot') or ''
            try:
                slots = FFCSSlotParser.parse_combination(slot_comb)
                for slot in slots:
                    key = slot.cell_key()
                    cell_map[key] = entry
            except ValueError:
                continue
        return cell_map

    @staticmethod
    def detect_conflicts(existing_entries: List[Dict], new_slot_combination: str, exclude_course_id: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        filtered_entries = [
            e for e in existing_entries if exclude_course_id is None or e.get('id') != exclude_course_id
        ]
        occupied_map = TimetableConflictService.map_occupied_cells(filtered_entries)

        try:
            new_slots = FFCSSlotParser.parse_combination(new_slot_combination)
        except ValueError as err:
            return True, str(err)

        for slot in new_slots:
            key = slot.cell_key()
            if key in ('WED-5', 'WED-6'):
                return True, "Cannot add course: Wednesday 11:40 AM to 01:20 PM (L17/L18) is reserved for Extramural activities."
            if key in occupied_map:
                conflicting = occupied_map[key]
                return True, f"Timetable clash detected on {slot.day} period {slot.period} ({slot.slot}) with course {conflicting.get('course_code')} ({conflicting.get('course_name')})"

        return False, None
