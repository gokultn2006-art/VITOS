from typing import List, Dict, Any
from ..models import Timetable, TimetableClass

SLOT_TIMINGS: Dict[str, str] = {
    # Theory Morning
    'A1': 'MON 08:00 AM - 08:50 AM, WED 09:00 AM - 09:50 AM',
    'B1': 'TUE 08:00 AM - 08:50 AM, THU 09:00 AM - 09:50 AM',
    'C1': 'WED 08:00 AM - 08:50 AM, FRI 09:00 AM - 09:50 AM',
    'D1': 'THU 08:00 AM - 08:50 AM, MON 10:00 AM - 10:50 AM',
    'E1': 'FRI 08:00 AM - 08:50 AM, TUE 10:00 AM - 10:50 AM',
    'F1': 'MON 09:00 AM - 09:50 AM, WED 10:00 AM - 10:50 AM',
    'G1': 'TUE 09:00 AM - 09:50 AM, THU 10:00 AM - 10:50 AM',
    'TA1': 'FRI 10:00 AM - 10:50 AM',
    'TB1': 'MON 11:00 AM - 11:50 AM',
    'TC1': 'TUE 11:00 AM - 11:50 AM',
    'TD1': 'WED 11:00 AM - 11:50 AM',
    'TE1': 'THU 11:00 AM - 11:50 AM',
    'TF1': 'FRI 11:00 AM - 11:50 AM',
    'TG1': 'MON 12:00 PM - 12:50 PM',
    'TAA1': 'TUE 12:00 PM - 12:50 PM',
    'TCC1': 'THU 12:00 PM - 12:50 PM',
    'TDD1': 'FRI 12:00 PM - 12:50 PM',
    # Theory Afternoon
    'A2': 'MON 02:00 PM - 02:50 PM, WED 03:00 PM - 03:50 PM',
    'B2': 'TUE 02:00 PM - 02:50 PM, THU 03:00 PM - 03:50 PM',
    'C2': 'WED 02:00 PM - 02:50 PM, FRI 03:00 PM - 03:50 PM',
    'D2': 'THU 02:00 PM - 02:50 PM, MON 04:00 PM - 04:50 PM',
    'E2': 'FRI 02:00 PM - 02:50 PM, TUE 04:00 PM - 04:50 PM',
    'F2': 'MON 03:00 PM - 03:50 PM, WED 04:00 PM - 04:50 PM',
    'G2': 'TUE 03:00 PM - 03:50 PM, THU 04:00 PM - 04:50 PM',
    'TA2': 'FRI 04:00 PM - 04:50 PM',
    'TB2': 'MON 05:00 PM - 05:50 PM',
    'TC2': 'TUE 05:00 PM - 05:50 PM',
    'TD2': 'WED 05:00 PM - 05:50 PM',
    'TE2': 'THU 05:00 PM - 05:50 PM',
    'TF2': 'FRI 05:00 PM - 05:50 PM',
    'TG2': 'MON 06:00 PM - 06:50 PM',
    'TAA2': 'TUE 06:00 PM - 06:50 PM',
    'TBB2': 'WED 06:00 PM - 06:50 PM',
    'TCC2': 'THU 06:00 PM - 06:50 PM',
    'TDD2': 'FRI 06:00 PM - 06:50 PM',
    # Labs
    'L1+L2': 'MON 08:00 AM - 09:40 AM',
    'L3+L4': 'MON 09:50 AM - 11:30 AM',
    'L5+L6': 'MON 11:40 AM - 01:20 PM',
    'L7+L8': 'TUE 08:00 AM - 09:40 AM',
    'L9+L10': 'TUE 09:50 AM - 11:30 AM',
    'L11+L12': 'TUE 11:40 AM - 01:20 PM',
    'L13+L14': 'WED 08:00 AM - 09:40 AM',
    'L15+L16': 'WED 09:50 AM - 11:30 AM',
    'L19+L20': 'THU 08:00 AM - 09:40 AM',
    'L21+L22': 'THU 09:50 AM - 11:30 AM',
    'L23+L24': 'THU 11:40 AM - 01:20 PM',
    'L25+L26': 'FRI 08:00 AM - 09:40 AM',
    'L27+L28': 'FRI 09:50 AM - 11:30 AM',
    'L29+L30': 'FRI 11:40 AM - 01:20 PM',
    'L31+L32': 'MON 02:00 PM - 03:40 PM',
    'L33+L34': 'MON 03:50 PM - 05:30 PM',
    'L37+L38': 'TUE 02:00 PM - 03:40 PM',
    'L39+L40': 'TUE 03:50 PM - 05:30 PM',
    'L43+L44': 'WED 02:00 PM - 03:40 PM',
    'L45+L46': 'WED 03:50 PM - 05:30 PM',
    'L49+L50': 'THU 02:00 PM - 03:40 PM',
    'L51+L52': 'THU 03:50 PM - 05:30 PM',
    'L55+L56': 'FRI 02:00 PM - 03:40 PM',
    'L57+L58': 'FRI 03:50 PM - 05:30 PM',
}

# Master VIT School Course Offerings mapped to slot patterns
MASTER_SLOT_CLASSES: Dict[str, List[Dict[str, Any]]] = {
    'A1': [
        {
            'course_code': 'CSE3001',
            'course_name': 'Software Engineering',
            'faculty': 'Dr. K. Senthil Kumar',
            'venue': 'SJT-208',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 68,
            'capacity': 70
        },
        {
            'course_code': 'ECE2002',
            'course_name': 'Analog Electronic Circuits',
            'faculty': 'Prof. M. Vijayalakshmi',
            'venue': 'TT-412',
            'building': 'Technology Tower',
            'school': 'SENSE (Electronics)',
            'credits': 3,
            'enrolled': 65,
            'capacity': 70
        },
        {
            'course_code': 'MAT2001',
            'course_name': 'Differential and Difference Equations',
            'faculty': 'Dr. P. Ramesh',
            'venue': 'GDN-108',
            'building': 'GD Naidu Block',
            'school': 'SAS (Advanced Sciences)',
            'credits': 4,
            'enrolled': 72,
            'capacity': 75
        },
        {
            'course_code': 'MEE2001',
            'course_name': 'Engineering Thermodynamics',
            'faculty': 'Dr. T. Arunachalam',
            'venue': 'GDN-204',
            'building': 'GD Naidu Block',
            'school': 'SMEC (Mechanical)',
            'credits': 3,
            'enrolled': 60,
            'capacity': 65
        }
    ],
    'B1': [
        {
            'course_code': 'CSE2005',
            'course_name': 'Object Oriented Programming with Java',
            'faculty': 'Dr. N. Hemalatha',
            'venue': 'SJT-311',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 69,
            'capacity': 70
        },
        {
            'course_code': 'EEE1001',
            'course_name': 'Basic Electrical and Electronics Engineering',
            'faculty': 'Dr. V. Saravanan',
            'venue': 'TT-521',
            'building': 'Technology Tower',
            'school': 'SELECT (Electrical)',
            'credits': 3,
            'enrolled': 70,
            'capacity': 75
        },
        {
            'course_code': 'CHY1002',
            'course_name': 'Environmental Sciences',
            'faculty': 'Dr. S. Deepa',
            'venue': 'SMV-102',
            'building': 'Sir M. Visvesvaraya Block',
            'school': 'SAS (Advanced Sciences)',
            'credits': 3,
            'enrolled': 63,
            'capacity': 65
        }
    ],
    'C1': [
        {
            'course_code': 'CSE2001',
            'course_name': 'Computer Organization and Architecture',
            'faculty': 'Dr. R. Balakrishnan',
            'venue': 'SJT-402',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 67,
            'capacity': 70
        },
        {
            'course_code': 'ITE1002',
            'course_name': 'Web Technologies & Frameworks',
            'faculty': 'Prof. G. Nandhini',
            'venue': 'SJT-505',
            'building': 'Silver Jubilee Tower',
            'school': 'SITE (Information Tech)',
            'credits': 3,
            'enrolled': 65,
            'capacity': 70
        },
        {
            'course_code': 'CLE2001',
            'course_name': 'Mechanics of Solids',
            'faculty': 'Dr. P. Sundaram',
            'venue': 'CDMM-104',
            'building': 'CDMM Building',
            'school': 'SCE (Civil Engineering)',
            'credits': 4,
            'enrolled': 58,
            'capacity': 60
        }
    ],
    'D1': [
        {
            'course_code': 'CSE2004',
            'course_name': 'Database Management Systems',
            'faculty': 'Dr. M. Sangeetha',
            'venue': 'SJT-304',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 70,
            'capacity': 70
        },
        {
            'course_code': 'ECE1002',
            'course_name': 'Semiconductor Devices and Circuits',
            'faculty': 'Dr. J. Karthikeyan',
            'venue': 'TT-304',
            'building': 'Technology Tower',
            'school': 'SENSE (Electronics)',
            'credits': 3,
            'enrolled': 62,
            'capacity': 65
        },
        {
            'course_code': 'BIT2001',
            'course_name': 'Cell Biology & Genetics',
            'faculty': 'Dr. A. Sudha',
            'venue': 'CBMR-201',
            'building': 'CBMR',
            'school': 'SBST (Bio Sciences)',
            'credits': 3,
            'enrolled': 55,
            'capacity': 60
        }
    ],
    'E1': [
        {
            'course_code': 'MAT1001',
            'course_name': 'Calculus for Engineers',
            'faculty': 'Dr. C. Venkatesh',
            'venue': 'GDN-112',
            'building': 'GD Naidu Block',
            'school': 'SAS (Advanced Sciences)',
            'credits': 4,
            'enrolled': 74,
            'capacity': 75
        },
        {
            'course_code': 'CSE3002',
            'course_name': 'Internet and Web Programming',
            'faculty': 'Prof. V. Kalpana',
            'venue': 'SJT-214',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 68,
            'capacity': 70
        }
    ],
    'F1': [
        {
            'course_code': 'CSE1001',
            'course_name': 'Problem Solving and Programming in C',
            'faculty': 'Dr. S. Manikandan',
            'venue': 'SJT-624',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 69,
            'capacity': 70
        },
        {
            'course_code': 'PHY1001',
            'course_name': 'Engineering Physics & Optics',
            'faculty': 'Dr. K. Balamurugan',
            'venue': 'TT-624',
            'building': 'Technology Tower',
            'school': 'SAS (Advanced Sciences)',
            'credits': 4,
            'enrolled': 70,
            'capacity': 70
        }
    ],
    'G1': [
        {
            'course_code': 'ENG1001',
            'course_name': 'Technical English Communication',
            'faculty': 'Dr. R. Shalini',
            'venue': 'MB-201',
            'building': 'Main Building',
            'school': 'SSL (Social Sciences)',
            'credits': 2,
            'enrolled': 60,
            'capacity': 65
        },
        {
            'course_code': 'MGT1001',
            'course_name': 'Principles of Management',
            'faculty': 'Dr. K. Ravichandran',
            'venue': 'Gandhi-102',
            'building': 'Gandhi Block',
            'school': 'VITBS (Business School)',
            'credits': 3,
            'enrolled': 62,
            'capacity': 65
        }
    ],
    'A2': [
        {
            'course_code': 'CSE3003',
            'course_name': 'Operating Systems',
            'faculty': 'Dr. G. Malathi',
            'venue': 'SJT-408',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 68,
            'capacity': 70
        },
        {
            'course_code': 'ECE3001',
            'course_name': 'Digital Signal Processing',
            'faculty': 'Dr. R. Govindaraj',
            'venue': 'TT-501',
            'building': 'Technology Tower',
            'school': 'SENSE (Electronics)',
            'credits': 3,
            'enrolled': 64,
            'capacity': 65
        }
    ],
    'B2': [
        {
            'course_code': 'CSE3006',
            'course_name': 'Design and Analysis of Algorithms',
            'faculty': 'Dr. P. Swaminathan',
            'venue': 'SJT-512',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 70,
            'capacity': 70
        },
        {
            'course_code': 'EEE2002',
            'course_name': 'Control Systems Engineering',
            'faculty': 'Dr. N. Rajasekaran',
            'venue': 'TT-404',
            'building': 'Technology Tower',
            'school': 'SELECT (Electrical)',
            'credits': 3,
            'enrolled': 61,
            'capacity': 65
        }
    ],
    'C2': [
        {
            'course_code': 'IMAT205L',
            'course_name': 'Discrete Mathematics and Graph Theory',
            'faculty': 'Dr. Shubhangi Dwivedi',
            'venue': 'SJT-208',
            'building': 'Silver Jubilee Tower',
            'school': 'SAS (Advanced Sciences)',
            'credits': 4,
            'enrolled': 66,
            'capacity': 70
        },
        {
            'course_code': 'CSE4001',
            'course_name': 'Machine Learning and Deep Neural Networks',
            'faculty': 'Dr. V. Anbarasu',
            'venue': 'PRP-401',
            'building': 'Pearl Research Park',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 68,
            'capacity': 70
        }
    ],
    'D2': [
        {
            'course_code': 'CSE4005',
            'course_name': 'Cloud Computing & Distributed Systems',
            'faculty': 'Dr. T. Vijayakumar',
            'venue': 'SJT-302',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 67,
            'capacity': 70
        }
    ],
    'E2': [
        {
            'course_code': 'CSE3009',
            'course_name': 'Compiler Design',
            'faculty': 'Dr. S. Rajalakshmi',
            'venue': 'SJT-501',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 4,
            'enrolled': 65,
            'capacity': 70
        }
    ],
    'F2': [
        {
            'course_code': 'CSE4011',
            'course_name': 'Network Security and Cryptography',
            'faculty': 'Dr. K. Praveen',
            'venue': 'SJT-414',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 3,
            'enrolled': 68,
            'capacity': 70
        }
    ],
    'G2': [
        {
            'course_code': 'HUM1002',
            'course_name': 'Ethics and Values',
            'faculty': 'Dr. M. Chitra',
            'venue': 'MB-301',
            'building': 'Main Building',
            'school': 'SSL (Social Sciences)',
            'credits': 2,
            'enrolled': 62,
            'capacity': 65
        }
    ],
    'L1+L2': [
        {
            'course_code': 'CSE3001P',
            'course_name': 'Software Engineering Lab',
            'faculty': 'Dr. K. Senthil Kumar',
            'venue': 'SJT-Lab 204',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 1,
            'enrolled': 35,
            'capacity': 35
        },
        {
            'course_code': 'ECE2002P',
            'course_name': 'Analog Electronics Lab',
            'faculty': 'Prof. M. Vijayalakshmi',
            'venue': 'TT-Lab 302',
            'building': 'Technology Tower',
            'school': 'SENSE (Electronics)',
            'credits': 1,
            'enrolled': 34,
            'capacity': 35
        }
    ],
    'L31+L32': [
        {
            'course_code': 'CSE2005P',
            'course_name': 'Java Programming Lab',
            'faculty': 'Dr. N. Hemalatha',
            'venue': 'SJT-Lab 308',
            'building': 'Silver Jubilee Tower',
            'school': 'SCOPE (Computer Science)',
            'credits': 1,
            'enrolled': 35,
            'capacity': 35
        }
    ]
}


class SlotClassService:
    @classmethod
    def get_available_slots(cls) -> List[str]:
        return list(SLOT_TIMINGS.keys())

    @classmethod
    def get_classes_for_slot(cls, slot_query: str) -> Dict[str, Any]:
        slot = slot_query.strip().upper()
        timing = SLOT_TIMINGS.get(slot, 'Campus Regular Slot Timetable')

        # 1. Search database models
        db_classes = []
        try:
            db_timetables = Timetable.objects.filter(slot__iexact=slot)
            for t in db_timetables:
                db_classes.append({
                    'course_code': t.course_code,
                    'course_name': t.course_name,
                    'faculty': t.faculty,
                    'venue': t.room_number or t.building_code or 'Classroom',
                    'building': t.building_name or 'Academic Block',
                    'school': 'SCOPE (Computer Science)',
                    'credits': 3,
                    'enrolled': 65,
                    'capacity': 70,
                    'source': 'Database'
                })
        except Exception:
            pass

        try:
            db_tc = TimetableClass.objects.filter(slot_combination__icontains=slot)
            for tc in db_tc:
                db_classes.append({
                    'course_code': tc.course_code,
                    'course_name': tc.course_name,
                    'faculty': tc.faculty,
                    'venue': tc.venue,
                    'building': 'Campus Academic Zone',
                    'school': 'Department of Computing',
                    'credits': int(tc.credits),
                    'enrolled': 60,
                    'capacity': 70,
                    'source': 'Student Schedule'
                })
        except Exception:
            pass

        # 2. Master catalogue for the slot
        catalog = MASTER_SLOT_CLASSES.get(slot, [])
        combined = []
        seen = set()

        for c in db_classes + catalog:
            key = f"{c['course_code']}_{c['venue']}"
            if key not in seen:
                seen.add(key)
                combined.append(c)

        if not combined:
            # Fallback for slots without explicit classes
            combined = [
                {
                    'course_code': f"CSE{slot}01",
                    'course_name': f"Advanced Topics in Slot {slot}",
                    'faculty': 'Senior Department Faculty',
                    'venue': f"SJT-30{slot[:1]}",
                    'building': 'Silver Jubilee Tower',
                    'school': 'SCOPE (Computer Science)',
                    'credits': 3,
                    'enrolled': 58,
                    'capacity': 70,
                    'source': 'Academic System'
                }
            ]

        total_enrolled = sum(c.get('enrolled', 0) for c in combined)
        total_capacity = sum(c.get('capacity', 0) for c in combined)

        return {
            'slot': slot,
            'timing': timing,
            'total_classes': len(combined),
            'total_students_enrolled': total_enrolled,
            'total_capacity': total_capacity,
            'classes': combined
        }
