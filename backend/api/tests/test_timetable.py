from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
import json

from api.services.ffcs_slot_service import FFCSSlotParser, TimetableConflictService
from api.models import Timetable

class FFCSSlotParserTest(TestCase):
    def test_single_theory_slot(self):
        slots = FFCSSlotParser.parse_combination("A1")
        self.assertTrue(len(slots) >= 1)
        a1_mon = [s for s in slots if s.day == 'MON']
        self.assertEqual(len(a1_mon), 1)
        self.assertEqual(a1_mon[0].period, 1)

    def test_theory_tutorial_combination(self):
        slots = FFCSSlotParser.parse_combination("A1+TA1")
        days = {s.day for s in slots}
        self.assertIn("MON", days)
        self.assertIn("FRI", days)

    def test_theory_tutorial_extra_combination(self):
        slots = FFCSSlotParser.parse_combination("C2+TC2+TCC2")
        days = {s.day for s in slots}
        self.assertIn("WED", days)
        self.assertIn("TUE", days)
        self.assertIn("THU", days)

    def test_lab_pair(self):
        slots = FFCSSlotParser.parse_combination("L19+L20")
        self.assertEqual(len(slots), 2)
        self.assertEqual(slots[0].day, "THU")
        self.assertEqual(slots[0].period, 1)
        self.assertEqual(slots[1].day, "THU")
        self.assertEqual(slots[1].period, 2)

    def test_unknown_slot(self):
        with self.assertRaises(ValueError) as cm:
            FFCSSlotParser.parse_combination("INVALID_SLOT")
        self.assertIn("Unknown FFCS slot", str(cm.exception))

    def test_duplicate_slot_in_combination(self):
        with self.assertRaises(ValueError) as cm:
            FFCSSlotParser.parse_combination("A1+A1")
        self.assertIn("Duplicate slot", str(cm.exception))

class TimetableConflictServiceTest(TestCase):
    def test_two_non_conflicting_courses(self):
        existing = [{"id": 1, "course_code": "CSE2001", "slot_combination": "A1+TA1"}]
        has_conflict, err = TimetableConflictService.detect_conflicts(existing, "B2+TB2")
        self.assertFalse(has_conflict)
        self.assertIsNone(err)

    def test_two_conflicting_courses(self):
        existing = [{"id": 1, "course_code": "CSE2001", "slot_combination": "A1+TA1"}]
        has_conflict, err = TimetableConflictService.detect_conflicts(existing, "A1")
        self.assertTrue(has_conflict)
        self.assertIn("clash detected", err.lower())

    def test_editing_course(self):
        existing = [
            {"id": 1, "course_code": "CSE2001", "slot_combination": "A1+TA1"},
            {"id": 2, "course_code": "ECE2004", "slot_combination": "B2"}
        ]
        # Edit course 1 slot to B2 -> should clash with course 2
        has_conflict, err = TimetableConflictService.detect_conflicts(existing, "B2", exclude_course_id=1)
        self.assertTrue(has_conflict)

        # Edit course 1 slot to C2 -> should succeed without clash
        has_conflict, err = TimetableConflictService.detect_conflicts(existing, "C2", exclude_course_id=1)
        self.assertFalse(has_conflict)

    def test_deleting_course(self):
        existing = [{"id": 1, "course_code": "CSE2001", "slot_combination": "A1+TA1"}]
        # Delete course 1 (empty list) -> adding A1 should succeed
        has_conflict, err = TimetableConflictService.detect_conflicts([], "A1")
        self.assertFalse(has_conflict)

class TimetableApiTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="22BCE1024", password="password123")

    def test_json_export(self):
        Timetable.objects.create(
            student=self.user, course_code="IMAT205L", course_name="Discrete Math",
            faculty="SHUBHANGI", room_number="SJT208", slot="C2", day="WED", start_time="14:00"
        )
        response = self.client.get(reverse('timetable-export'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["version"], 1)
        self.assertTrue(len(data["courses"]) >= 1)

    def test_json_import_success(self):
        payload = {
            "version": 1,
            "courses": [
                {
                    "courseCode": "IMAT205L",
                    "courseTitle": "Discrete Mathematics and Graph Theory",
                    "faculty": "SHUBHANGI DWIVEDI",
                    "venue": "SJT208",
                    "credits": 4.0,
                    "slotCombination": "C2+TC2+TCC2",
                    "courseType": "Theory Only"
                },
                {
                    "courseCode": "ISWE406P",
                    "courseTitle": "Agile DevOps Lab",
                    "faculty": "SWETA BHATTACHARYA",
                    "venue": "SJT218",
                    "credits": 1.0,
                    "slotCombination": "L19+L20",
                    "courseType": "Lab Only"
                }
            ]
        }
        response = self.client.post(
            reverse('timetable-import'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [200, 201])

    def test_malformed_json_import(self):
        response = self.client.post(
            reverse('timetable-import'),
            data=json.dumps({"invalidKey": "badData"}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_import_unknown_slot(self):
        payload = {
            "version": 1,
            "courses": [
                {
                    "courseCode": "BAD101",
                    "courseTitle": "Bad Slot Course",
                    "slotCombination": "INVALID_SLOT"
                }
            ]
        }
        response = self.client.post(
            reverse('timetable-import'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("invalid slot combination", response.json()["error"].lower())
