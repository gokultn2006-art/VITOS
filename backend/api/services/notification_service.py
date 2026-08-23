from datetime import datetime, date
from typing import List
from api.models import Notification, StudentTimetable, TimetableClass

DAY_MAP = {0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'}

class NotificationService:
    @staticmethod
    def generate_timetable_notifications(user) -> List[Notification]:
        active_timetable = StudentTimetable.objects.filter(user=user, active=True).first()
        if not active_timetable:
            return list(Notification.objects.filter(user=user))

        today = date.today()
        today_code = DAY_MAP.get(today.weekday(), 'MON')
        classes = TimetableClass.objects.filter(timetable=active_timetable, day=today_code)

        created_notifications = []

        for cls in classes:
            # Generate 3 distinct notification types per class occurrence
            # 1. Upcoming class notification
            occ_id_1 = f"{user.id}_{cls.id}_{today.isoformat()}_UPCOMING"
            if not Notification.objects.filter(occurrence_identifier=occ_id_1).exists():
                notif = Notification.objects.create(
                    user=user,
                    title=f"Upcoming Class: {cls.course_code}",
                    message=f"Next class: {cls.course_name} at {cls.start_time} in {cls.venue}.",
                    timestamp=datetime.now().strftime('%Y-%m-%d %H:%M'),
                    type="class_upcoming",
                    is_read=False,
                    occurrence_identifier=occ_id_1
                )
                created_notifications.append(notif)

            # 2. Location reminder notification
            occ_id_2 = f"{user.id}_{cls.id}_{today.isoformat()}_LOCATION"
            if not Notification.objects.filter(occurrence_identifier=occ_id_2).exists():
                notif = Notification.objects.create(
                    user=user,
                    title=f"Class Venue Reminder",
                    message=f"{cls.course_code} ({cls.course_name}) will be held in room {cls.venue} under faculty {cls.faculty}.",
                    timestamp=datetime.now().strftime('%Y-%m-%d %H:%M'),
                    type="location_reminder",
                    is_read=False,
                    occurrence_identifier=occ_id_2
                )
                created_notifications.append(notif)

        return list(Notification.objects.filter(user=user).order_by('-id'))
