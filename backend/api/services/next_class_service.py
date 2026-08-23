from datetime import datetime, timedelta, time
from typing import Dict, Any, Optional
from api.models import StudentTimetable, TimetableClass

DAY_MAP = {
    0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'
}

DAY_FULL_NAMES = {
    'MON': 'MONDAY', 'TUE': 'TUESDAY', 'WED': 'WEDNESDAY',
    'THU': 'THURSDAY', 'FRI': 'FRIDAY', 'SAT': 'SATURDAY', 'SUN': 'SUNDAY'
}

DAY_SHORT = {
    'MON': 'Mon', 'TUE': 'Tue', 'WED': 'Wed',
    'THU': 'Thu', 'FRI': 'Fri', 'SAT': 'Sat', 'SUN': 'Sun'
}

def parse_time_str(t_str: str) -> time:
    """Parses '08:00 AM', '14:00', or '08:00' into a datetime.time object."""
    t_str = t_str.strip().upper()
    try:
        if 'AM' in t_str or 'PM' in t_str:
            dt = datetime.strptime(t_str, '%I:%M %p')
            return dt.time()
        parts = t_str.split(':')
        return time(int(parts[0]), int(parts[1]))
    except Exception:
        return time(8, 0)

def _build_class_info(cls, minutes_until: int, status_type: str, day_label: str = '') -> Dict[str, Any]:
    """Build a standardised class info dict."""
    return {
        "courseCode": cls.course_code,
        "courseName": cls.course_name,
        "faculty": cls.faculty,
        "venue": cls.venue,
        "day": DAY_FULL_NAMES.get(cls.day, cls.day),
        "dayShort": DAY_SHORT.get(cls.day, cls.day),
        "startTime": cls.start_time,
        "endTime": cls.end_time,
        "minutesUntilStart": minutes_until,
        "slot": cls.slot_combination,
        "statusType": status_type,   # 'ongoing', 'today', 'upcoming'
        "dayLabel": day_label,       # 'Today', 'Tomorrow', 'Wednesday', etc.
        "statusText": (
            f"Ongoing until {cls.end_time}" if status_type == 'ongoing'
            else f"Starts in {minutes_until} min" if status_type == 'today'
            else f"Next class {day_label} at {cls.start_time}"
        )
    }


class NextClassService:
    @staticmethod
    def get_next_class(user, current_datetime: Optional[datetime] = None) -> Dict[str, Any]:
        if current_datetime is None:
            current_datetime = datetime.now()

        active_timetable = StudentTimetable.objects.filter(user=user, active=True).first()
        if not active_timetable:
            return {
                "message": "No active timetable found. Import your VTOP registration slip.",
                "hasUpcoming": False,
                "currentClass": None,
                "nextClass": None,
                "todayDate": current_datetime.strftime('%A, %d %B %Y'),
                "todayDayCode": DAY_MAP.get(current_datetime.weekday(), 'MON'),
            }

        classes = TimetableClass.objects.filter(timetable=active_timetable)
        if not classes.exists():
            return {
                "message": "No classes found in your timetable.",
                "hasUpcoming": False,
                "currentClass": None,
                "nextClass": None,
                "todayDate": current_datetime.strftime('%A, %d %B %Y'),
                "todayDayCode": DAY_MAP.get(current_datetime.weekday(), 'MON'),
            }

        current_day_idx = current_datetime.weekday()
        current_day_code = DAY_MAP.get(current_day_idx, 'MON')
        current_time = current_datetime.time()

        today_classes = list(classes.filter(day=current_day_code))

        # ── 1. Find CURRENTLY ONGOING class ─────────────────────────────────
        current_class_info = None
        for cls in today_classes:
            start_t = parse_time_str(cls.start_time)
            end_t = parse_time_str(cls.end_time)
            if start_t <= current_time <= end_t:
                current_class_info = _build_class_info(cls, 0, 'ongoing', 'Today')
                break

        # ── 2. Find NEXT upcoming class (starts strictly after now) ──────────
        upcoming_today = []
        for cls in today_classes:
            start_t = parse_time_str(cls.start_time)
            if start_t > current_time:
                dt_start = datetime.combine(current_datetime.date(), start_t)
                minutes_until = int((dt_start - current_datetime).total_seconds() / 60)
                upcoming_today.append((start_t, cls, minutes_until))

        next_class_info = None

        if upcoming_today:
            upcoming_today.sort(key=lambda x: x[0])
            _, best, minutes = upcoming_today[0]
            next_class_info = _build_class_info(best, minutes, 'today', 'Today')
        else:
            # Look ahead up to 6 days
            for offset in range(1, 7):
                next_date = current_datetime + timedelta(days=offset)
                next_day_code = DAY_MAP.get(next_date.weekday(), 'MON')
                next_day_classes = list(classes.filter(day=next_day_code))

                if next_day_classes:
                    parsed_list = [(parse_time_str(c.start_time), c) for c in next_day_classes]
                    parsed_list.sort(key=lambda x: x[0])
                    _, best = parsed_list[0]

                    if offset == 1:
                        day_label = 'Tomorrow'
                    else:
                        day_label = DAY_FULL_NAMES.get(next_day_code, next_day_code).capitalize()

                    next_class_info = _build_class_info(best, offset * 1440, 'upcoming', day_label)
                    break

        has_upcoming = current_class_info is not None or next_class_info is not None

        # ── 3. Determine primary display class (for backward compatibility) ──
        primary = current_class_info or next_class_info or {}

        return {
            "hasUpcoming": has_upcoming,
            "currentClass": current_class_info,
            "nextClass": next_class_info,
            "todayDate": current_datetime.strftime('%A, %d %B %Y'),
            "todayDayCode": current_day_code,
            # Legacy top-level fields kept for backward compatibility
            "courseCode": primary.get("courseCode", ""),
            "courseName": primary.get("courseName", ""),
            "faculty": primary.get("faculty", ""),
            "venue": primary.get("venue", ""),
            "day": primary.get("day", ""),
            "startTime": primary.get("startTime", ""),
            "endTime": primary.get("endTime", ""),
            "minutesUntilStart": primary.get("minutesUntilStart", 0),
            "slot": primary.get("slot", ""),
            "statusText": primary.get("statusText", ""),
        }
