import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vitos_backend.settings')
django.setup()

from api.models import Building, User, StudentProfile, StudentTimetable, TimetableClass
from django.contrib.auth.hashers import make_password

# 1. Seed Buildings
buildings_data = [
    {'name': 'Technology Tower', 'code': 'TT', 'lat': 12.97061, 'lng': 79.15951, 'total_floors': 7, 'rooms_count': 140},
    {'name': 'Silver Jubilee Tower', 'code': 'SJT', 'lat': 12.97095, 'lng': 79.16390, 'total_floors': 8, 'rooms_count': 180},
    {'name': 'Pearl Research Park', 'code': 'PRP', 'lat': 12.97125, 'lng': 79.16628, 'total_floors': 8, 'rooms_count': 120},
    {'name': 'Sir M. Visvesvaraya Block', 'code': 'SMV', 'lat': 12.96924, 'lng': 79.15773, 'total_floors': 6, 'rooms_count': 90},
    {'name': 'Main Building (Dr. MGR Block)', 'code': 'MB', 'lat': 12.96925, 'lng': 79.15585, 'total_floors': 4, 'rooms_count': 65},
    {'name': 'Periyar Central Library', 'code': 'LIB', 'lat': 12.96933, 'lng': 79.15685, 'total_floors': 6, 'rooms_count': 24},
    {'name': 'G.D. Naidu Block', 'code': 'GDN', 'lat': 12.96998, 'lng': 79.15484, 'total_floors': 5, 'rooms_count': 80},
    {'name': 'CDMM Building', 'code': 'CDMM', 'lat': 12.96922, 'lng': 79.15498, 'total_floors': 4, 'rooms_count': 45},
    {'name': 'Mahatma Gandhi Block', 'code': 'MGB', 'lat': 12.96870, 'lng': 79.15550, 'total_floors': 5, 'rooms_count': 75},
    {'name': 'Dr. Ambedkar Block (CS Block)', 'code': 'AB', 'lat': 12.96980, 'lng': 79.15620, 'total_floors': 4, 'rooms_count': 50},
    {'name': 'Architecture Block', 'code': 'ARC', 'lat': 12.97020, 'lng': 79.15720, 'total_floors': 3, 'rooms_count': 30},
    {'name': 'Technology Business Incubator', 'code': 'TBI', 'lat': 12.97110, 'lng': 79.16010, 'total_floors': 4, 'rooms_count': 35},
    {'name': 'Anna Auditorium Complex', 'code': 'AA', 'lat': 12.96910, 'lng': 79.15810, 'total_floors': 2, 'rooms_count': 6},
    {'name': 'Kamaraj Memorial Centre', 'code': 'KMC', 'lat': 12.96840, 'lng': 79.15710, 'total_floors': 3, 'rooms_count': 25},
    {'name': 'Food Mall & Dining Complex', 'code': 'FM', 'lat': 12.96980, 'lng': 79.16050, 'total_floors': 3, 'rooms_count': 18},
    {'name': 'Health & Diagnostic Centre', 'code': 'HDC', 'lat': 12.97050, 'lng': 79.15850, 'total_floors': 2, 'rooms_count': 15},
    {'name': "Men's Hostel B Block", 'code': 'MH-B', 'lat': 12.97454, 'lng': 79.15741, 'total_floors': 6, 'rooms_count': 240},
    {'name': "Men's Hostel D Block", 'code': 'MH-D', 'lat': 12.97410, 'lng': 79.15820, 'total_floors': 7, 'rooms_count': 280},
    {'name': "Men's Hostel Q Block", 'code': 'MH-Q', 'lat': 12.97520, 'lng': 79.16010, 'total_floors': 14, 'rooms_count': 450},
    {'name': "Ladies' Hostel A Block", 'code': 'LH-A', 'lat': 12.96832, 'lng': 79.15821, 'total_floors': 6, 'rooms_count': 220},
    {'name': "Ladies' Hostel E Block", 'code': 'LH-E', 'lat': 12.96780, 'lng': 79.15910, 'total_floors': 8, 'rooms_count': 310},
]

print("--- Seeding Buildings ---")
for b in buildings_data:
    obj, created = Building.objects.update_or_create(
        code=b['code'],
        defaults=b
    )
    print(f"Building {obj.code}: {obj.name} ({'Created' if created else 'Updated'})")

print(f"Total Buildings in DB: {Building.objects.count()}")

# 2. Seed Demo Students
students_info = [
    {
        'username': '22BCE1024',
        'email': 'chris.student2022@vitstudent.ac.in',
        'first_name': 'Chris',
        'last_name': 'Evan',
        'full_name': 'Chris',
        'reg_no': '22BCE1024',
        'programme': 'B.Tech Computer Science and Engineering',
        'year_semester': '3rd Year (Semester VI)',
        'courses': [
            {'code': 'IMAT205L', 'title': 'Discrete Mathematics and Graph Theory', 'slot': 'C2+TC2+TCC2', 'venue': 'SJT208', 'faculty': 'SHUBHANGI DWIVEDI - SAS', 'day': 'WED', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 4.0},
            {'code': 'ISTS201P', 'title': 'Qualitative Skills Practice II', 'slot': 'G2+TG2', 'venue': 'SJT124', 'faculty': 'SIXPHRASE (APT) - SSL', 'day': 'TUE', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 1.5},
            {'code': 'BCSE302L', 'title': 'Database Systems', 'slot': 'D2+TD2', 'venue': 'SJT112', 'faculty': 'DR. PRIYA DHARSHINI - SCOPE', 'day': 'THU', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 3.0},
            {'code': 'BCSE303L', 'title': 'Operating Systems', 'slot': 'B2+TB2', 'venue': 'TT412', 'faculty': 'DR. S. MOHAN - SCOPE', 'day': 'TUE', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 3.0},
            {'code': 'BCSE302P', 'title': 'Database Systems Lab', 'slot': 'L31+L32', 'venue': 'SJT-G01', 'faculty': 'DR. PRIYA DHARSHINI - SCOPE', 'day': 'MON', 'start': '02:00 PM', 'end': '03:40 PM', 'credits': 1.5},
            {'code': 'BCSE301L', 'title': 'Software Engineering', 'slot': 'A1+TA1', 'venue': 'TT624', 'faculty': 'DR. R. SELVARAJ - SCOPE', 'day': 'MON', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
            {'code': 'BMAT201L', 'title': 'Complex Variables and Linear Algebra', 'slot': 'C1+TC1', 'venue': 'SJT311', 'faculty': 'DR. P. RAMESH - SAS', 'day': 'WED', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 4.0},
        ]
    },
    {
        'username': '23BCE0512',
        'email': 'rahul.sharma2023@vitstudent.ac.in',
        'first_name': 'Rahul',
        'last_name': 'Sharma',
        'full_name': 'Rahul Sharma',
        'reg_no': '23BCE0512',
        'programme': 'B.Tech Computer Science and Engineering',
        'year_semester': '2nd Year (Semester IV)',
        'courses': [
            {'code': 'BCSE202L', 'title': 'Data Structures and Algorithms', 'slot': 'A1+TA1', 'venue': 'TT624', 'faculty': 'DR. R. SELVARAJ - SCOPE', 'day': 'MON', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
            {'code': 'BEEE102L', 'title': 'Basic Electrical Engineering', 'slot': 'F1+TF1', 'venue': 'SMV102', 'faculty': 'DR. V. SARAVANAN - SELECT', 'day': 'MON', 'start': '09:00 AM', 'end': '09:50 AM', 'credits': 3.0},
            {'code': 'BECE201L', 'title': 'Digital Logic Design', 'slot': 'B1+TB1', 'venue': 'TT521', 'faculty': 'PROF. M. VIJAYALAKSHMI - SENSE', 'day': 'TUE', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
            {'code': 'BCSE202P', 'title': 'Data Structures Lab', 'slot': 'L1+L2', 'venue': 'TT214', 'faculty': 'DR. R. SELVARAJ - SCOPE', 'day': 'MON', 'start': '08:00 AM', 'end': '09:40 AM', 'credits': 1.5},
            {'code': 'BCSE302L', 'title': 'Database Systems', 'slot': 'D2+TD2', 'venue': 'SJT112', 'faculty': 'DR. PRIYA DHARSHINI - SCOPE', 'day': 'THU', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 3.0},
        ]
    },
    {
        'username': '21BCE0199',
        'email': 'ananya.patel2021@vitstudent.ac.in',
        'first_name': 'Ananya',
        'last_name': 'Patel',
        'full_name': 'Ananya Patel',
        'reg_no': '21BCE0199',
        'programme': 'B.Tech Electronics and Communication Engineering',
        'year_semester': '4th Year (Semester VIII)',
        'courses': [
            {'code': 'BECE301L', 'title': 'Microprocessors and Microcontrollers', 'slot': 'D1+TD1', 'venue': 'GDN204', 'faculty': 'DR. T. ARUNACHALAM - SENSE', 'day': 'THU', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
            {'code': 'BECE302L', 'title': 'VLSI System Design', 'slot': 'E1+TE1', 'venue': 'GDN108', 'faculty': 'DR. N. HEMALATHA - SENSE', 'day': 'FRI', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
            {'code': 'IMAT205L', 'title': 'Discrete Mathematics and Graph Theory', 'slot': 'C2+TC2+TCC2', 'venue': 'SJT208', 'faculty': 'SHUBHANGI DWIVEDI - SAS', 'day': 'WED', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 4.0},
            {'code': 'BCSE303L', 'title': 'Operating Systems', 'slot': 'B2+TB2', 'venue': 'TT412', 'faculty': 'DR. S. MOHAN - SCOPE', 'day': 'TUE', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 3.0},
        ]
    }
]

print("\n--- Seeding Demo Students and Active Timetables ---")
for s in students_info:
    u, created = User.objects.get_or_create(
        username=s['username'],
        defaults={
            'email': s['email'],
            'first_name': s['first_name'],
            'last_name': s['last_name'],
            'password': make_password('Student@123'),
        }
    )
    StudentProfile.objects.update_or_create(
        user=u,
        defaults={
            'reg_no': s['reg_no'],
            'full_name': s['full_name'],
            'programme': s['programme'],
            'year_semester': s['year_semester'],
        }
    )
    # Deactivate older timetables
    StudentTimetable.objects.filter(user=u).update(active=False)
    st = StudentTimetable.objects.create(
        user=u,
        semester='Winter 2026',
        academic_year='2025-2026',
        active=True,
        version=1
    )
    for c in s['courses']:
        TimetableClass.objects.create(
            timetable=st,
            course_code=c['code'],
            course_name=c['title'],
            faculty=c['faculty'],
            venue=c['venue'],
            slot_combination=c['slot'],
            day=c['day'],
            start_time=c['start'],
            end_time=c['end'],
            period=1,
            credits=c['credits']
        )
    print(f"Created student timetable for {u.username} ({s['full_name']}) with {len(s['courses'])} courses.")

# Also add timetable for 24MID0205 (Gokul) if present
gokul_user = User.objects.filter(username='24MID0205').first()
if gokul_user:
    StudentTimetable.objects.filter(user=gokul_user).update(active=False)
    st_gokul = StudentTimetable.objects.create(
        user=gokul_user,
        semester='Winter 2026',
        academic_year='2025-2026',
        active=True,
        version=1
    )
    gokul_courses = [
        {'code': 'IMAT205L', 'title': 'Discrete Mathematics and Graph Theory', 'slot': 'C2+TC2+TCC2', 'venue': 'SJT208', 'faculty': 'SHUBHANGI DWIVEDI - SAS', 'day': 'WED', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 4.0},
        {'code': 'BCSE302L', 'title': 'Database Systems', 'slot': 'D2+TD2', 'venue': 'SJT112', 'faculty': 'DR. PRIYA DHARSHINI - SCOPE', 'day': 'THU', 'start': '02:00 PM', 'end': '02:50 PM', 'credits': 3.0},
        {'code': 'BCSE202L', 'title': 'Data Structures and Algorithms', 'slot': 'A1+TA1', 'venue': 'TT624', 'faculty': 'DR. R. SELVARAJ - SCOPE', 'day': 'MON', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
        {'code': 'BECE201L', 'title': 'Digital Logic Design', 'slot': 'B1+TB1', 'venue': 'TT521', 'faculty': 'PROF. M. VIJAYALAKSHMI - SENSE', 'day': 'TUE', 'start': '08:00 AM', 'end': '08:50 AM', 'credits': 3.0},
    ]
    for c in gokul_courses:
        TimetableClass.objects.create(
            timetable=st_gokul,
            course_code=c['code'],
            course_name=c['title'],
            faculty=c['faculty'],
            venue=c['venue'],
            slot_combination=c['slot'],
            day=c['day'],
            start_time=c['start'],
            end_time=c['end'],
            period=1,
            credits=c['credits']
        )
    print(f"Created active timetable for Gokul (24MID0205) with {len(gokul_courses)} courses.")

print("\n--- Seeding Complete Successfully ---")
