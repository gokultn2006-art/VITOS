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

        # Buildings (Verified OpenStreetMap Campus Coordinates)
        b_tt, _ = Building.objects.update_or_create(code='TT', defaults={'name': 'Technology Tower', 'lat': 12.97061, 'lng': 79.15951, 'total_floors': 7, 'rooms_count': 140})
        b_sjt, _ = Building.objects.update_or_create(code='SJT', defaults={'name': 'Silver Jubilee Tower', 'lat': 12.97095, 'lng': 79.16390, 'total_floors': 8, 'rooms_count': 180})
        b_mb, _ = Building.objects.update_or_create(code='MB', defaults={'name': 'Main Building', 'lat': 12.96925, 'lng': 79.15585, 'total_floors': 4, 'rooms_count': 65})

        # Rooms
        Room.objects.get_or_create(room_number='TT-624', building=b_tt, defaults={'floor': 6, 'capacity': 70, 'availability_status': 'available', 'available_until': '12:00 PM', 'facilities': ['Projector', 'AC', 'Smart Board'], 'current_course': 'Free Slot'})
        Room.objects.get_or_create(room_number='SJT-302', building=b_sjt, defaults={'floor': 3, 'capacity': 60, 'availability_status': 'available', 'available_until': '01:30 PM', 'facilities': ['Projector', 'LAN Outlets'], 'current_course': 'Free Slot'})

        # Campus Locations
        CampusLocation.objects.update_or_create(code='TT', defaults={'name': 'Technology Tower (TT)', 'category': 'academic', 'lat': 12.97061, 'lng': 79.15951, 'description': 'Flagship academic building housing CSE & ECE classrooms and labs.', 'building_name': 'Technology Tower', 'opening_hours': '08:00 AM - 07:30 PM', 'is_saved': True})
        CampusLocation.objects.update_or_create(code='SJT', defaults={'name': 'Silver Jubilee Tower (SJT)', 'category': 'academic', 'lat': 12.97095, 'lng': 79.16390, 'description': 'Modern SCOPE academic block with computer labs.', 'building_name': 'Silver Jubilee Tower', 'opening_hours': '08:00 AM - 08:00 PM'})
        CampusLocation.objects.update_or_create(code='MED', defaults={'name': 'VIT Health & Medical Centre', 'category': 'service', 'lat': 12.96953, 'lng': 79.15465, 'description': '24/7 medical facility with resident doctors in AL Mudaliar Block.', 'building_name': 'Medical Centre', 'opening_hours': 'Open 24/7', 'is_saved': True})

        # Automatically seed full VIT Vellore Campus Directory (152+ verified locations & buildings)
        try:
            from django.core.management import call_command
            call_command('seed_vit_directory')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not seed directory: {e}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with multi-user VIT records!'))
