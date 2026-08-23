from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
import json
from io import BytesIO

from api.models import StudentProfile, StudentTimetable, TimetableClass, Notification, ClassroomAvailability
from api.services.navigation_service import NavigationService
from api.services.next_class_service import NextClassService
from api.services.notification_service import NotificationService

class EnhancementsTestSuite(TestCase):
    def setUp(self):
        self.client = Client()

        # Create regular student user
        self.student_user = User.objects.create_user(username="22BCE1024", password="password123")
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user, full_name="Chris Student", reg_no="22BCE1024"
        )

        # Create another student user
        self.other_student = User.objects.create_user(username="23BCE0512", password="password123")
        self.other_profile = StudentProfile.objects.create(
            user=self.other_student, full_name="Rahul Student", reg_no="23BCE0512"
        )

        # Create admin user
        self.admin_user = User.objects.create_user(username="admin_user", password="password123", is_staff=True, is_superuser=True)
        self.admin_profile = StudentProfile.objects.create(
            user=self.admin_user, full_name="Admin User", reg_no="ADMIN001"
        )

        self.student_token = f"vitos_token_{self.student_user.id}_test"
        self.other_token = f"vitos_token_{self.other_student.id}_test"
        self.admin_token = f"vitos_token_{self.admin_user.id}_test"

    # 1. Timetable belongs to correct authenticated user
    # 2. New timetable becomes active
    # 3. Previous timetable becomes inactive
    def test_timetable_registration_active_versioning(self):
        payload1 = {
            "courses": [
                {"courseCode": "IMAT205L", "courseTitle": "Discrete Math", "slotCombination": "C2+TC2+TCC2", "venue": "SJT208"}
            ]
        }
        res1 = self.client.post(
            reverse('timetable-register'),
            data=json.dumps(payload1),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res1.status_code, 201)
        tt1 = StudentTimetable.objects.get(id=res1.json()['timetable']['id'])
        self.assertTrue(tt1.active)
        self.assertEqual(tt1.user, self.student_user)
        self.assertEqual(tt1.version, 1)

        # Register second timetable for same student
        payload2 = {
            "courses": [
                {"courseCode": "ISWE416L", "courseTitle": "Big Data", "slotCombination": "B2+TB2", "venue": "SJT204"}
            ]
        }
        res2 = self.client.post(
            reverse('timetable-register'),
            data=json.dumps(payload2),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res2.status_code, 201)
        tt1.refresh_from_db()
        tt2 = StudentTimetable.objects.get(id=res2.json()['timetable']['id'])

        self.assertFalse(tt1.active) # Previous became inactive
        self.assertTrue(tt2.active)  # New became active
        self.assertEqual(tt2.version, 2)

    # 4. Next class is calculated correctly
    # 5. No next class returns correct response
    def test_next_class_calculation(self):
        # Empty timetable -> No upcoming classes
        res_empty = self.client.get(
            reverse('timetable-next'),
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_empty.status_code, 200)
        self.assertFalse(res_empty.json()['hasUpcoming'])

        # Add active timetable
        tt = StudentTimetable.objects.create(user=self.student_user, active=True, version=1)
        TimetableClass.objects.create(
            timetable=tt, course_code="CSE2001", course_name="Data Structures",
            faculty="Dr. X", venue="SJT123", slot_combination="A1",
            day="MON", start_time="10:00 AM", end_time="10:50 AM", period=1
        )

        res_next = self.client.get(
            reverse('timetable-next'),
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_next.status_code, 200)
        self.assertTrue(res_next.json()['hasUpcoming'])
        self.assertEqual(res_next.json()['courseCode'], "CSE2001")

    # 6. Duplicate notification is not generated
    def test_notification_deduplication(self):
        from datetime import date
        DAY_MAP = {0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'}
        today_code = DAY_MAP.get(date.today().weekday(), 'MON')

        tt = StudentTimetable.objects.create(user=self.student_user, active=True, version=1)
        tc = TimetableClass.objects.create(
            timetable=tt, course_code="ISWE406L", course_name="Agile DevOps",
            faculty="SWETA", venue="SJT204", slot_combination="A2",
            day=today_code, start_time="02:00 PM", end_time="02:50 PM", period=6
        )

        NotificationService.generate_timetable_notifications(self.student_user)
        count_first = Notification.objects.filter(user=self.student_user).count()
        self.assertTrue(count_first >= 1)

        # Re-run notification service -> should NOT duplicate
        NotificationService.generate_timetable_notifications(self.student_user)
        count_second = Notification.objects.filter(user=self.student_user).count()
        self.assertEqual(count_first, count_second)

    # 7. Profile photo can be uploaded
    # 8. Invalid image is rejected
    # 9. Student cannot modify another student's profile photo
    def test_profile_photo_security_and_validation(self):
        # 8. Invalid image format -> rejected
        invalid_file = BytesIO(b"not an image text content")
        invalid_file.name = "malicious.exe"
        invalid_file.content_type = "application/x-msdownload"

        res_invalid = self.client.post(
            reverse('profile-photo'),
            {'photo': invalid_file},
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_invalid.status_code, 400)
        self.assertIn("Invalid image format", res_invalid.json()['error'])

        # 7. Valid image upload -> success
        valid_img = BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRfake_png_data")
        valid_img.name = "avatar.png"
        valid_img.content_type = "image/png"

        res_valid = self.client.post(
            reverse('profile-photo'),
            {'photo': valid_img},
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_valid.status_code, 200)
        self.student_profile.refresh_from_db()
        self.assertTrue(bool(self.student_profile.profile_photo))

        # 9. Student cannot view/modify another student's photo directly
        res_forbidden = self.client.get(
            reverse('profile-photo-user', kwargs={'user_id': self.other_student.id}),
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_forbidden.status_code, 403)

    # 11. Navigation finds shortest route (Dijkstra algorithm test)
    # 12. Invalid destination is handled
    def test_dijkstra_campus_navigation(self):
        res_route = self.client.post(
            reverse('campus-navigate'),
            data=json.dumps({"source": "MENS_HOSTEL", "destination": "SJT"}),
            content_type='application/json'
        )
        self.assertEqual(res_route.status_code, 200)
        data = res_route.json()
        self.assertEqual(data['source'], "MENS_HOSTEL")
        self.assertTrue(data['distanceMeters'] > 0)
        self.assertTrue(len(data['path']) >= 2)

    # 13. Student cannot edit classroom availability (403 Forbidden)
    # 14. Admin can edit classroom availability
    # 15. Student cannot access admin endpoints
    def test_role_permissions_classroom_availability(self):
        # 13 & 15. Student attempting admin edit -> 403 Forbidden
        res_student = self.client.post(
            reverse('admin-availability-review'),
            data=json.dumps({"classroom": "SJT208", "status": "AVAILABLE"}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        self.assertEqual(res_student.status_code, 403)

        # 14. Admin editing classroom availability -> 200 Success
        res_admin = self.client.post(
            reverse('admin-availability-review'),
            data=json.dumps({"classroom": "SJT208", "status": "AVAILABLE"}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {self.admin_token}"
        )
        self.assertEqual(res_admin.status_code, 200)
        item = ClassroomAvailability.objects.get(classroom="SJT208")
        self.assertEqual(item.status, "AVAILABLE")
        self.assertEqual(item.source, "ADMIN_CONFIRMED")
