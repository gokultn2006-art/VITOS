from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import StudentProfile, Building, Room, CampusLocation, Timetable, LostItem, DirectoryEntry, Notification

class Command(BaseCommand):
    help = 'Seeds database with multiple realistic student accounts and VIT Vellore campus data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding VIT Vellore CampusOS Multi-User System Data...'))

        # Seed Administrator Account
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@vitstudent.ac.in', 'first_name': 'VIT System', 'last_name': 'Administrator', 'is_staff': True, 'is_superuser': True}
        )
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.email = 'admin@vitstudent.ac.in'
        admin_user.save()

        StudentProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                'full_name': 'VIT System Administrator',
                'reg_no': 'ADMIN001',
                'programme': 'CampusOS Administration',
                'year_semester': 'Staff / Faculty',
                'avatar_url': '/default-avatar.png'
            }
        )

        # Seed Users & Student Profiles
        students_data = [
            {
                'username': '22BCE1024', 'email': 'chris.student2022@vitstudent.ac.in', 'password': 'student123',
                'full_name': 'Chris', 'reg_no': '22BCE1024', 'programme': 'B.Tech Computer Science and Engineering',
                'year_semester': '3rd Year (Semester VI)', 'avatar_url': '/default-avatar.png'
            },
            {
                'username': '23BCE0512', 'email': 'rahul.sharma2023@vitstudent.ac.in', 'password': 'student123',
                'full_name': 'Rahul Sharma', 'reg_no': '23BCE0512', 'programme': 'B.Tech Computer Science and Engineering (Data Science)',
                'year_semester': '2nd Year (Semester IV)', 'avatar_url': '/default-avatar.png'
            },
            {
                'username': '21BCE0199', 'email': 'ananya.patel2021@vitstudent.ac.in', 'password': 'student123',
                'full_name': 'Ananya Patel', 'reg_no': '21BCE0199', 'programme': 'B.Tech Electronics and Communication Engineering',
                'year_semester': '4th Year (Semester VIII)', 'avatar_url': '/default-avatar.png'
            }
        ]

        for s_data in students_data:
            user, created = User.objects.get_or_create(
                username=s_data['username'],
                defaults={'email': s_data['email'], 'first_name': s_data['full_name']}
            )
            user.set_password(s_data['password'])
            user.email = s_data['email']
            user.first_name = s_data['full_name']
            user.save()

            StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'full_name': s_data['full_name'],
                    'reg_no': s_data['reg_no'],
                    'programme': s_data['programme'],
                    'year_semester': s_data['year_semester'],
                    'avatar_url': s_data['avatar_url'],
                    'saved_locations': ['TT', 'LIB', 'MED'],
                    'recent_searches': ['TT-624', 'Periyar Library', 'Medical Centre']
                }
            )

        # Buildings
        b_tt, _ = Building.objects.get_or_create(code='TT', defaults={'name': 'Technology Tower', 'lat': 12.9712, 'lng': 79.1593, 'total_floors': 7, 'rooms_count': 140})
        b_sjt, _ = Building.objects.get_or_create(code='SJT', defaults={'name': 'Silver Jubilee Tower', 'lat': 12.9718, 'lng': 79.1633, 'total_floors': 8, 'rooms_count': 180})
        b_mb, _ = Building.objects.get_or_create(code='MB', defaults={'name': 'Main Building', 'lat': 12.9696, 'lng': 79.1559, 'total_floors': 4, 'rooms_count': 65})

        # Rooms
        Room.objects.get_or_create(room_number='TT-624', building=b_tt, defaults={'floor': 6, 'capacity': 70, 'availability_status': 'available', 'available_until': '12:00 PM', 'facilities': ['Projector', 'AC', 'Smart Board'], 'current_course': 'Free Slot'})
        Room.objects.get_or_create(room_number='SJT-302', building=b_sjt, defaults={'floor': 3, 'capacity': 60, 'availability_status': 'available', 'available_until': '01:30 PM', 'facilities': ['Projector', 'LAN Outlets'], 'current_course': 'Free Slot'})

        # Campus Locations
        CampusLocation.objects.get_or_create(code='TT', defaults={'name': 'Technology Tower (TT)', 'category': 'academic', 'lat': 12.9712, 'lng': 79.1593, 'description': 'Flagship academic building housing CSE & ECE classrooms and labs.', 'building_name': 'Technology Tower', 'opening_hours': '08:00 AM - 07:30 PM', 'is_saved': True})
        CampusLocation.objects.get_or_create(code='SJT', defaults={'name': 'Silver Jubilee Tower (SJT)', 'category': 'academic', 'lat': 12.9718, 'lng': 79.1633, 'description': 'Modern SCOPE academic block with computer labs.', 'building_name': 'Silver Jubilee Tower', 'opening_hours': '08:00 AM - 08:00 PM'})
        CampusLocation.objects.get_or_create(code='MED', defaults={'name': 'VIT Health & Medical Centre', 'category': 'service', 'lat': 12.9680, 'lng': 79.1550, 'description': '24/7 medical facility with resident doctors.', 'building_name': 'Medical Centre', 'opening_hours': 'Open 24/7', 'is_saved': True})

        # Seed Timetables
        chris_user = User.objects.get(username='22BCE1024')
        rahul_user = User.objects.get(username='23BCE0512')

        Timetable.objects.get_or_create(
            student=chris_user, course_code='CSE3001', day='Friday', slot='C1',
            defaults={
                'start_time': '10:00 AM', 'end_time': '10:50 AM', 'course_name': 'Software Engineering',
                'faculty': 'Dr. R. Selvaraj', 'room_number': 'TT-624', 'building_code': 'TT', 'building_name': 'Technology Tower',
                'session_type': 'theory', 'walking_time_minutes': 8, 'is_next': True
            }
        )

        Timetable.objects.get_or_create(
            student=rahul_user, course_code='CSE2001', day='Friday', slot='A1',
            defaults={
                'start_time': '08:00 AM', 'end_time': '08:50 AM', 'course_name': 'Data Structures & Algorithms',
                'faculty': 'Prof. K. Meenakshi', 'room_number': 'SJT-302', 'building_code': 'SJT', 'building_name': 'Silver Jubilee Tower',
                'session_type': 'theory', 'walking_time_minutes': 5, 'is_next': True
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with multi-user VIT records!'))
