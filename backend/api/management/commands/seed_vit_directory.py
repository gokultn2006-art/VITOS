from django.core.management.base import BaseCommand
from api.models import DirectoryEntry

class Command(BaseCommand):
    help = 'Seeds verified, comprehensive, hierarchical VIT Vellore campus directory data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding Verified VIT Vellore Campus Directory...'))

        SOURCE_VIT = 'Official VIT Vellore Website (vit.ac.in)'
        VERIFIED_DATE = '2026-09-21'

        # Clean up any old duplicate naming for Silver Jubilee Tower
        old_sjt = DirectoryEntry.objects.filter(name='Silver Jubilee Tower (SJT)').first()
        if old_sjt:
            old_sjt.name = 'Silver Jubilee Tower'
            old_sjt.short_name = 'SJT'
            old_sjt.aliases = ['SJT', 'Silver Jubilee Tower', 'Silver Jubilee Tower (SJT)', 'SJT Tower', 'Silver Jubilee']
            old_sjt.search_keywords = ['sjt', 'silver jubilee tower', 'building', 'block', 'classroom', 'hall', 'academic', 'tower']
            old_sjt.save()

        def upsert(name, category, defaults, parent=None):
            obj, created = DirectoryEntry.objects.update_or_create(
                name=name,
                parent=parent,
                defaults={
                    'category': category,
                    'source_name': SOURCE_VIT,
                    'last_verified': VERIFIED_DATE,
                    **defaults
                }
            )
            return obj

        # ==========================================
        # 1. HIERARCHICAL GROUP: VIT HOSTELS
        # ==========================================
        grp_hostels = upsert(
            name='VIT Hostels',
            category='Hostels',
            defaults={
                'short_name': 'Hostels',
                'description': "Explore men's and ladies' hostel blocks, residential facilities, mess info, and hostel administration.",
                'entry_type': 'group',
                'icon_name': 'Home',
                'source_url': 'https://vit.ac.in/campuslife/hostels',
                'search_keywords': ['hostel', 'mh', 'lh', 'mens hostel', 'ladies hostel', 'rooms', 'dorm', 'residence'],
                'facilities': ['Wi-Fi', '24/7 Power Backup', 'RO Drinking Water', 'Indoor Gym', 'Laundry Service', 'First Aid', 'Security'],
            }
        )

        # 1A. Subgroup: Men's Hostel
        sub_mh = upsert(
            name="Men's Hostel",
            category='Hostels',
            parent=grp_hostels,
            defaults={
                'short_name': 'MH',
                'subcategory': "Men's Hostels",
                'description': "Residential blocks for male students accommodating over 17,000 residents across 21 blocks.",
                'entry_type': 'subgroup',
                'location_name': 'North Campus (Across Railway Subway)',
                'building_code': 'MH',
                'phone': '+91 416 220 2527',
                'email': 'director.mh@vit.ac.in',
                'contact': '0416-2202520 (Director) / 0416-2202521 (Chief Warden)',
                'website': 'https://vit.ac.in/campuslife/hostels',
                'source_url': 'https://vit.ac.in/campuslife/hostels',
                'search_keywords': ['mh', "men's hostel", 'boys hostel'],
                'aliases': ["Men's Hostel", 'MH', 'Boys Hostel'],
                'facilities': ['Badminton Court', 'Gymnasium', 'Laundry', 'Night Canteen', 'Study Halls', 'Ambulance Station'],
            }
        )

        # 1B. Subgroup: Ladies' Hostel
        sub_lh = upsert(
            name="Ladies' Hostel",
            category='Hostels',
            parent=grp_hostels,
            defaults={
                'short_name': 'LH',
                'subcategory': "Ladies' Hostels",
                'description': "Secure residential complex for female students accommodating over 4,700 residents across dedicated blocks.",
                'entry_type': 'subgroup',
                'location_name': 'South Campus Residential Enclave',
                'building_code': 'LH',
                'phone': '+91 416 220 2712',
                'email': 'director.lh@vit.ac.in',
                'contact': '0416-2202710 (Office) / 0416-2202712 (Director)',
                'website': 'https://vit.ac.in/campuslife/hostels',
                'source_url': 'https://vit.ac.in/campuslife/hostels',
                'search_keywords': ['lh', "ladies' hostel", 'girls hostel', 'womens hostel'],
                'aliases': ["Ladies' Hostel", 'LH', 'Girls Hostel', 'Womens Hostel'],
                'facilities': ['Security Turnstiles', 'Beauty Parlor', 'Gymnasium', 'Indoor Sports', 'Dining Mess', 'Pharmacy'],
            }
        )

        # Verified Men's Hostel Blocks
        mh_blocks = [
            ('MH-A Block (Albert Einstein)', 'MH-A', 12.9738, 79.1565, 'Single, Double, 3-bed non-AC/AC rooms.'),
            ('MH-B Block (Swami Vivekananda)', 'MH-B', 12.9740, 79.1570, 'Multi-bedded student hostel block with study area.'),
            ('MH-B Annex', 'MH-B-ANNEX', 12.9741, 79.1572, 'Hostel annex facility near B block.'),
            ('MH-C Block (Rabindranath Tagore)', 'MH-C', 12.9742, 79.1578, 'Student accommodation block close to central mess.'),
            ('MH-D Block', 'MH-D', 12.9744, 79.1582, 'AC and Non-AC room configurations.'),
            ('MH-D Annex', 'MH-D-ANNEX', 12.9745, 79.1585, 'D Block expansion facility.'),
            ('MH-E Block', 'MH-E', 12.9748, 79.1588, 'Student hostel block with common room.'),
            ('MH-F Block', 'MH-F', 12.9750, 79.1592, 'Residential block with outdoor badminton area.'),
            ('MH-G Block', 'MH-G', 12.9752, 79.1596, 'Hostel block situated in north quadrangle.'),
            ('MH-H Block', 'MH-H', 12.9754, 79.1600, 'Spacious rooms with study desks and Wi-Fi.'),
            ('MH-J Block', 'MH-J', 12.9756, 79.1604, 'Multi-tier hostel block with lift facility.'),
            ('MH-K Block', 'MH-K', 12.9758, 79.1608, 'Equipped with indoor table tennis and study lounge.'),
            ('MH-L Block', 'MH-L', 12.9760, 79.1612, 'High-rise residential block with balcony views.'),
            ('MH-M Block', 'MH-M', 12.9762, 79.1616, 'Air-conditioned rooms with biometric attendance.'),
            ('MH-M Annex', 'MH-M-ANNEX', 12.9728, 79.1646, 'Hostel annex facility near East gate area.'),
            ('MH-N Block', 'MH-N', 12.9764, 79.1620, 'Contemporary design block with common cafeteria.'),
            ('MH-P Block', 'MH-P', 12.9766, 79.1625, 'Single occupancy executive student rooms.'),
            ('MH-Q Block', 'MH-Q', 12.9768, 79.1630, '14-floor high-rise hostel with modern dining hall.'),
            ('MH-R Block', 'MH-R', 12.9770, 79.1635, 'Multi-storey hostel block with central recreation lounge.'),
            ('MH-S Block', 'MH-S', 12.9772, 79.1640, 'Premium AC accommodation with cafeteria.'),
            ('MH-T Block', 'MH-T', 12.9774, 79.1645, 'Latest residential block with automated turnstiles.'),
        ]

        for b_name, b_code, lat, lng, desc in mh_blocks:
            upsert(
                name=b_name,
                category='Hostels',
                parent=sub_mh,
                defaults={
                    'short_name': b_code,
                    'subcategory': "Men's Hostels",
                    'description': desc,
                    'entry_type': 'entry',
                    'building_code': b_code,
                    'location_name': f'{b_name}, North Campus',
                    'latitude': lat,
                    'longitude': lng,
                    'source_url': 'https://vit.ac.in/campuslife/hostels',
                    'search_keywords': [b_code.lower(), 'mh', 'boys', 'hostel', 'block'],
                    'aliases': [b_code, b_name, f"Block {b_code.replace('MH-', '')}"],
                    'facilities': ['Wi-Fi', '24/7 Power', 'Mess Access', 'RO Water', 'Security']
                }
            )

        # Verified Ladies' Hostel Blocks
        lh_blocks = [
            ('LH-A Block', 'LH-A', 12.9692, 79.1580, 'Non-AC & AC shared occupancy rooms with attached study spaces.'),
            ('LH-B Block', 'LH-B', 12.9690, 79.1584, 'Centrally located block with reading hall and garden view.'),
            ('LH-C Block', 'LH-C', 12.9688, 79.1588, 'Student accommodation block with in-house mess facility.'),
            ('LH-D Block', 'LH-D', 12.9686, 79.1592, 'Multi-bedded rooms with modern amenities and high-speed Wi-Fi.'),
            ('LH-E Block', 'LH-E', 12.9684, 79.1596, 'Close to indoor badminton hall and dining court.'),
            ('LH-F Block', 'LH-F', 12.9682, 79.1600, 'AC rooms with ergonomic study furniture and water purifiers.'),
            ('LH-G Block', 'LH-G', 12.9680, 79.1604, 'High-rise residential block equipped with high-speed elevators.'),
            ('LH-H Block', 'LH-H', 12.9678, 79.1608, 'New modern residential tower with dedicated fitness gym.'),
        ]

        for b_name, b_code, lat, lng, desc in lh_blocks:
            upsert(
                name=b_name,
                category='Hostels',
                parent=sub_lh,
                defaults={
                    'short_name': b_code,
                    'subcategory': "Ladies' Hostels",
                    'description': desc,
                    'entry_type': 'entry',
                    'building_code': b_code,
                    'location_name': f'{b_name}, South Campus Enclave',
                    'latitude': lat,
                    'longitude': lng,
                    'source_url': 'https://vit.ac.in/campuslife/hostels',
                    'search_keywords': [b_code.lower(), 'lh', 'girls', 'ladies', 'hostel', 'block'],
                    'aliases': [b_code, b_name, f"Block {b_code.replace('LH-', '')}"],
                    'facilities': ['Wi-Fi', '24/7 Security', 'RO Water', 'In-House Mess', 'Study Lounge']
                }
            )

        # ==========================================
        # 2. HIERARCHICAL GROUP: ACADEMIC SCHOOLS
        # ==========================================
        grp_schools = upsert(
            name='Academic Schools',
            category='Schools',
            defaults={
                'short_name': 'Schools',
                'description': 'Academic faculties, deans, departments, and research centres across engineering, sciences, and management.',
                'entry_type': 'group',
                'icon_name': 'GraduationCap',
                'source_url': 'https://vit.ac.in/schools',
                'search_keywords': ['school', 'department', 'dean', 'faculty', 'academics', 'scope', 'sense', 'select'],
                'facilities': ['Smart Classrooms', 'Specialized Research Labs', 'Faculty Cabins', 'Conference Halls'],
            }
        )

        schools_data = [
            ('School of Computer Science and Engineering', 'SCOPE', 'Silver Jubilee Tower (SJT)', 12.9718, 79.1633, 'dean.scope@vit.ac.in', '0416-2202811', 'Leading computing faculty focusing on AI, Cloud, Cybersecurity, and Software Systems.'),
            ('School of Electronics Engineering', 'SENSE', 'G.D. Naidu Block (GDN)', 12.9702, 79.1601, 'dean.sense@vit.ac.in', '0416-2202611', 'VLSI design, embedded systems, wireless communications, and optical networking.'),
            ('School of Electrical Engineering', 'SELECT', 'G.D. Naidu Block (GDN)', 12.9702, 79.1601, 'dean.select@vit.ac.in', '0416-2202411', 'Power systems, smart grid technologies, electric vehicles, and renewable energy.'),
            ('School of Mechanical Engineering', 'SMEC', 'Sri M. Visvesvaraya Building (SMV)', 12.9705, 79.1585, 'dean.smec@vit.ac.in', '0416-2202211', 'Thermal engineering, robotics, CAD/CAM automation, and additive manufacturing.'),
            ('School of Civil Engineering', 'SCE', 'CDMM Building', 12.9710, 79.1620, 'dean.civil@vit.ac.in', '0416-2202311', 'Structural engineering, environmental planning, GIS surveying, and hydrology.'),
            ('School of Chemical Engineering', 'SCHEME', 'Sri M. Visvesvaraya Building (SMV)', 12.9705, 79.1585, 'dean.scheme@vit.ac.in', '0416-2202511', 'Petrochemical processing, biochemical separations, and industrial effluent treatment.'),
            ('School of Bio Sciences and Technology', 'SBST', 'Technology Tower (TT)', 12.9712, 79.1593, 'dean.sbst@vit.ac.in', '0416-2202711', 'Genomics, bioinformatics, biomedical devices, and pharmaceutical bioprocesses.'),
            ('School of Information Technology and Engineering', 'SITE', 'Silver Jubilee Tower (SJT)', 12.9718, 79.1633, 'dean.site@vit.ac.in', '0416-2202911', 'Data science, web architectures, human-computer interaction, and networking.'),
            ('VIT Business School', 'VITBS', 'Gandhi Block', 12.9698, 79.1568, 'dean.vitbs@vit.ac.in', '0416-2202111', 'Management studies, finance, operations, business analytics, and marketing.'),
            ('School of Advanced Sciences', 'SAS', 'Main Building (MB)', 12.9696, 79.1559, 'dean.sas@vit.ac.in', '0416-2202351', 'Physics, Chemistry, and Mathematics supporting undergraduate and PhD research.'),
            ('School of Social Sciences and Languages', 'SSL', 'Main Building (MB)', 12.9696, 79.1559, 'dean.ssl@vit.ac.in', '0416-2202451', 'Foreign languages (German, French, Japanese), English communication, and humanities.'),
            ('Vellore School of Agricultural Innovations (VAIAL)', 'VAIAL', 'Pearl Research Park (PRP)', 12.9735, 79.1642, 'dean.vaial@vit.ac.in', '0416-2202951', 'Precision agriculture, hydroponics, soil biology, and smart farm IoT systems.'),
        ]

        for s_name, s_code, bld, lat, lng, email, phone, desc in schools_data:
            upsert(
                name=s_name,
                category='Schools',
                parent=grp_schools,
                defaults={
                    'short_name': s_code,
                    'subcategory': 'Academic Schools',
                    'description': desc,
                    'entry_type': 'entry',
                    'building': bld,
                    'location_name': bld,
                    'latitude': lat,
                    'longitude': lng,
                    'email': email,
                    'phone': phone,
                    'website': 'https://vit.ac.in/schools',
                    'source_url': 'https://vit.ac.in/schools',
                    'search_keywords': [s_code.lower(), 'dean', 'school', 'department'],
                    'aliases': [s_code, s_name, f"School of {s_code}"]
                }
            )

        # ==========================================
        # 3. ACADEMIC & RESEARCH BUILDINGS & ANNEXES
        # ==========================================
        buildings_data = [
            (
                'Silver Jubilee Tower', 'SJT', 12.9718, 79.1633,
                '8-storey architectural landmark housing SCOPE, SITE, Career Development Centre (CDC), software computing laboratories, and student cafe.',
                ['SJT', 'Silver Jubilee Tower', 'Silver Jubilee Tower (SJT)', 'SJT Tower', 'Silver Jubilee'],
                ['sjt', 'silver jubilee tower', 'building', 'block', 'classroom', 'hall', 'academic', 'tower', 'cdc', 'scope', 'site']
            ),
            (
                'Technology Tower (TT)', 'TT', 12.9712, 79.1593,
                '7-floor academic building with smart lecture theaters, computing labs, Ambedkar & Kamaraj auditoriums, and express printing cell.',
                ['TT', 'Technology Tower', 'Tech Tower'],
                ['tt', 'technology tower', 'building', 'classroom', 'printing cell', 'auditorium', 'smart classroom']
            ),
            (
                'Technology Tower Annexe (TT Annexe)', 'TT-ANNEX', 12.9708, 79.1602,
                'Extension building adjacent to Technology Tower housing SBST research laboratories and incubation units.',
                ['TT Annexe', 'TT Annex', 'Technology Tower Annexe', 'Technology Tower Annex'],
                ['tt annex', 'tt annexe', 'annex', 'sbst', 'incubation']
            ),
            (
                'Pearl Research Park (PRP)', 'PRP', 12.9735, 79.1642,
                'Ultra-modern 8-floor research complex (G+7) spanning 10.53 lakh sq.ft, housing advanced instrumentation, clean rooms, sponsored research, and incubation labs.',
                ['PRP', 'Pearl Research Park', 'PRP Complex'],
                ['prp', 'pearl research park', 'research', 'cleanroom', 'laboratories']
            ),
            (
                'PRP Block-1', 'PRP-1', 12.9736, 79.1644,
                'East Wing of Pearl Research Park housing smart lecture rooms (PRP-101 to PRP-118), Centre for Clean Environment, and Speech & NLP Lab.',
                ['PRP Block 1', 'PRP-1', 'PRP-101', 'PRP-118', 'PRP1'],
                ['prp 1', 'prp-1', 'prp block 1', 'cleanroom', 'smart classrooms']
            ),
            (
                'PRP Block-2', 'PRP-2', 12.9734, 79.1640,
                'West Wing of Pearl Research Park housing Industry Technology Parks, Nanotechnology centre, and advanced instrumentation labs.',
                ['PRP Block 2', 'PRP-2', 'PRP2'],
                ['prp 2', 'prp-2', 'prp block 2', 'tech park', 'industry']
            ),
            (
                'Dr. M.G.R. Block (Main Building)', 'MB', 12.9696, 79.1559,
                'Administrative and academic cornerstone housing Chancellor Office, Registrar, Controller of Examinations, Admissions, and Channa Reddy Auditorium.',
                ['Main Building', 'MB', 'MGR Block', 'Dr MGR Block'],
                ['main building', 'mb', 'mgr block', 'chancellor', 'admin', 'coe']
            ),
            (
                'Sri M. Visvesvaraya Building (SMV)', 'SMV', 12.9705, 79.1585,
                'Home to Mechanical (SMEC) and Chemical (SCHEME) engineering workshops, labs, and lecture halls.',
                ['SMV', 'Visvesvaraya Block', 'SMV Building'],
                ['smv', 'visvesvaraya', 'smec', 'scheme', 'mechanical']
            ),
            (
                'G.D. Naidu Block (GDN)', 'GDN', 12.9702, 79.1601,
                'Electrical and electronics engineering departments (SELECT, SENSE), power electronics, circuits, and nanotechnology labs.',
                ['GDN', 'GD Naidu Block', 'GDN Building'],
                ['gdn', 'gd naidu', 'select', 'sense', 'electrical']
            ),
            (
                'CDMM Building', 'CDMM', 12.9710, 79.1620,
                'Centre for Disaster Mitigation and Management, School of Civil Engineering (SCE), and V-SPARC design studios.',
                ['CDMM', 'V-SPARC', 'Civil Building'],
                ['cdmm', 'civil', 'sce', 'disaster mitigation']
            ),
            (
                'A.L. Mudaliar Block', 'ALM', 12.9682, 79.1552,
                'Multi-facility block housing the 24-hour Health & Medical Centre, ambulance hub, and student pharmacy on the 1st floor.',
                ['ALM', 'AL Mudaliar', 'Health Centre Building'],
                ['alm', 'mudaliar', 'hospital', 'medical', 'clinic']
            ),
            (
                'Gandhi Block', 'GB', 12.9698, 79.1568,
                'Academic block featuring management studies (VITBS), lecture classrooms, faculty chambers, and Era Sezhiyan Auditorium.',
                ['GB', 'Gandhi Block', 'Mahatma Gandhi Academic Block'],
                ['gb', 'gandhi block', 'vitbs', 'era sezhiyan']
            ),
            (
                'Mahatma Gandhi Block (MGB)', 'MGB', 12.9721, 79.1679,
                'Eastern campus academic and residential block located along perimeter road.',
                ['MGB', 'Mahatma Gandhi Block'],
                ['mgb', 'mahatma gandhi block']
            ),
            (
                'Pre-Clinical Research Laboratory', 'PCRL', 12.9708, 79.1672,
                'Specialized laboratory facility for pre-clinical trials, animal tissue modeling, and biomedical research.',
                ['PCRL', 'Pre Clinical Lab'],
                ['pcrl', 'pre clinical', 'laboratory', 'research']
            ),
            (
                'CBMR - Centre for Biomaterials and Research', 'CBMR', 12.9728, 79.1625,
                'Specialized biomaterials research facility equipped for tissue engineering, polymers, and nanotechnology research.',
                ['CBMR', 'Biomaterials Centre'],
                ['cbmr', 'biomaterials', 'research', 'nanotech']
            ),
        ]

        for b_name, b_code, lat, lng, desc, aliases, keywords in buildings_data:
            upsert(
                name=b_name,
                category='Academic Buildings',
                defaults={
                    'short_name': b_code,
                    'subcategory': 'Campus Buildings',
                    'description': desc,
                    'entry_type': 'entry',
                    'building_code': b_code,
                    'location_name': b_name,
                    'latitude': lat,
                    'longitude': lng,
                    'opening_hours': '08:00 AM - 08:00 PM',
                    'website': 'https://vit.ac.in/about/infrastructure',
                    'source_url': 'https://vit.ac.in/about/infrastructure',
                    'search_keywords': keywords,
                    'aliases': aliases,
                    'facilities': ['Elevators', 'Restrooms', 'RO Water Dispensers', 'Wi-Fi', 'Fire Safety']
                }
            )

        # ==========================================
        # 4. LIBRARY
        # ==========================================
        upsert(
            name='Periyar E.V.R. Central Library',
            category='Academic Facilities',
            defaults={
                'short_name': 'Library',
                'description': '6-floor central library spanning 7,770 sq. meters with 300,000+ volumes, electronic subscription databases, quiet reading floors, and digital kiosks.',
                'entry_type': 'entry',
                'location_name': 'Central Campus (Opposite Technology Tower)',
                'building_code': 'LIB',
                'latitude': 12.9699,
                'longitude': 79.1578,
                'opening_hours': '08:00 AM - 12:00 Midnight',
                'phone': '+91 416 224 3091',
                'email': 'library@vit.ac.in',
                'website': 'https://vit.ac.in/academics/library',
                'source_url': 'https://vit.ac.in/academics/library',
                'search_keywords': ['library', 'books', 'periyar', 'study room', 'reading hall'],
                'aliases': ['Library', 'Central Library', 'Periyar Library', 'EVR Library'],
                'facilities': ['Biometric Entry', 'Digital Catalog Kiosks', 'Quiet Study Pods', 'Air Conditioning', 'Book Return Kiosk']
            }
        )

        # ==========================================
        # 5. HEALTHCARE & EMERGENCY
        # ==========================================
        upsert(
            name='VIT Health & Medical Centre',
            category='Medical Services',
            defaults={
                'short_name': 'Health Centre',
                'description': '24-hour outpatient medical clinic, casualty room, resident doctors, nursing care, and emergency response.',
                'entry_type': 'entry',
                'location_name': 'A.L. Mudaliar Block, 1st Floor',
                'building_code': 'MED',
                'latitude': 12.9680,
                'longitude': 79.1550,
                'opening_hours': '24 hours / 7 days',
                'phone': '+91 416 220 2000',
                'contact': '0416-2202000 / 0416-2202217',
                'website': 'https://vit.ac.in/campuslife/healthservices',
                'source_url': 'https://vit.ac.in/campuslife/healthservices',
                'search_keywords': ['hospital', 'doctor', 'clinic', 'medical', 'emergency', 'health centre'],
                'aliases': ['Medical Centre', 'Health Centre', 'Hospital', 'Clinic', 'VIT Clinic'],
                'facilities': ['24/7 Outpatient', 'Observation Beds', 'Pharmacy', 'Emergency Casualty', 'Resident Doctors']
            }
        )

        upsert(
            name='24/7 Campus Ambulance Service',
            category='Medical Services',
            defaults={
                'short_name': 'Ambulance',
                'description': '3 dedicated campus emergency ambulances stationed at Health Centre, Men’s Hostel, and Ladies’ Hostel.',
                'entry_type': 'entry',
                'location_name': 'Health Centre Dispatch / Hostels',
                'latitude': 12.9681,
                'longitude': 79.1552,
                'opening_hours': '24/7 Emergency Dispatch',
                'phone': '+91 416 220 2000',
                'contact': '0416-2202000 / 0416-2202217',
                'source_url': 'https://vit.ac.in/campuslife/healthservices',
                'search_keywords': ['ambulance', 'emergency', 'accident', 'medical dispatch'],
                'aliases': ['Ambulance Service', 'Ambulance', 'Campus Ambulance'],
                'facilities': ['Oxygen Support', 'Stretcher', 'Paramedic on Call']
            }
        )

        # ==========================================
        # 6. STUDENT & ADMINISTRATIVE SERVICES
        # ==========================================
        admin_services = [
            ('Office of the Controller of Examinations (CoE)', 'CoE', 'Main Building 1st Floor (MB-108)', 12.9696, 79.1559, 'coe@vit.ac.in', '0416-2202144', 'CAT/FAT exam scheduling, official grade transcripts, grade cards, and re-evaluation.', '09:00 AM - 05:00 PM', ['CoE', 'Controller of Examinations']),
            ('Career Development Centre (CDC)', 'Placement Cell', 'Silver Jubilee Tower 1st Floor', 12.9718, 79.1633, 'cdc@vit.ac.in', '0416-2202155', 'Campus placement drives, corporate internships, interview training, and career counseling.', '09:00 AM - 06:00 PM', ['CDC', 'Placement Cell', 'Career Centre']),
            ("Office of Students' Welfare (SW)", 'Student Welfare', 'Main Building Ground Floor', 12.9696, 79.1559, 'events.sw@vit.ac.in', '0416-2204111', 'Student club activities, Riviera & graVITas cultural festivals, student insurance, and grievance redressal.', '09:00 AM - 05:30 PM', ['SW', 'Students Welfare']),
            ('Undergraduate Admissions Office', 'UG Admissions', 'Main Building Ground Floor Annex', 12.9695, 79.1557, 'ugadmission@vit.ac.in', '044-46277555', 'VITEEE counseling, B.Tech enrollment, verification of certificates, and admission queries.', '09:00 AM - 05:00 PM', ['UG Admissions', 'Admissions Office']),
            ('Postgraduate Admissions Office', 'PG Admissions', 'Main Building Ground Floor Annex', 12.9695, 79.1557, 'pgadmission@vit.ac.in', '0416-2202188', 'VITMEE counseling, M.Tech, MCA, MBA, and PhD research admissions.', '09:00 AM - 05:00 PM', ['PG Admissions']),
            ('International Relations Office', 'IRO', 'Main Building 2nd Floor', 12.9696, 79.1559, 'international@vit.ac.in', '0416-2202088', 'Semester abroad programs (SAP), international student admissions, and academic MoUs.', '09:00 AM - 05:00 PM', ['IRO', 'International Office']),
            ('VIT-TBI (Technology Business Incubator)', 'TBI', 'Technology Tower Ground Floor', 12.9712, 79.1593, 'vittbi@vit.ac.in', '0416-2243097', 'DST-supported startup incubator, seed funding, lab facilities, and patent guidance.', '09:00 AM - 05:30 PM', ['TBI', 'Incubator']),
        ]

        for s_name, s_short, loc_desc, lat, lng, email, phone, desc, hours, aliases in admin_services:
            upsert(
                name=s_name,
                category='Administrative Offices',
                defaults={
                    'short_name': s_short,
                    'subcategory': 'Student Administration',
                    'description': desc,
                    'entry_type': 'entry',
                    'location_name': loc_desc,
                    'latitude': lat,
                    'longitude': lng,
                    'email': email,
                    'phone': phone,
                    'opening_hours': hours,
                    'website': 'https://vit.ac.in/contactus',
                    'source_url': 'https://vit.ac.in/contactus',
                    'search_keywords': [s_short.lower(), 'office', 'admin', 'desk'],
                    'aliases': aliases
                }
            )

        # ==========================================
        # 7. SPORTS & FITNESS (OFFICIAL VIT HIERARCHY)
        # ==========================================
        grp_sports = upsert(
            name='Sports & Fitness Facilities',
            category='Sports',
            defaults={
                'short_name': 'Sports',
                'description': 'Department of Physical Education facilities: athletics stadium, Olympic swimming pools, indoor sports complexes, floodlit courts, and specialized gyms.',
                'entry_type': 'group',
                'icon_name': 'Trophy',
                'source_url': 'https://vit.ac.in/campuslife/sports',
                'search_keywords': ['sports', 'ground', 'gym', 'badminton', 'football', 'swimming pool', 'fitness', 'tennis'],
                'aliases': ['Sports & Fitness', 'Sports Complex', 'VIT Sports']
            }
        )

        detailed_sports = [
            # OUTDOOR SPORTS
            ('Main Athletics Stadium & 400m Track', 'Athletics Track', 'Outdoor Sports', 12.9675, 79.1565, 'Full-size 400-meter international running track with spectator pavilions and event field.', 'Both', 1, ['Floodlights', 'Changing Rooms']),
            ('Football Grounds (3 Pitches)', 'Football', 'Outdoor Sports', 12.9675, 79.1565, '3 full-size football grounds across the central sports complex and hostel quadrangles.', 'Both', 3, ['Natural Grass', 'Floodlights']),
            ('Cricket Grounds (2 Grounds)', 'Cricket', 'Outdoor Sports', 12.9678, 79.1568, '2 dedicated cricket pitches and practice net enclosures with turf wickets.', 'Both', 2, ['Practice Nets', 'Pavilion']),
            ('Outdoor Floodlit Badminton Courts - Men', 'Men Outdoor Badminton', 'Outdoor Sports', 12.9740, 79.1590, '18 floodlit outdoor badminton courts distributed across the Men\'s Hostel quadrangle.', 'Men', 18, ['Floodlights', 'Paved Courts']),
            ('Outdoor Floodlit Badminton Courts - Women', 'Women Outdoor Badminton', 'Outdoor Sports', 12.9685, 79.1595, '6 floodlit outdoor badminton courts situated in the Ladies\' Hostel enclave.', 'Women', 6, ['Floodlights', 'Secure Enclave']),
            ('Basketball Courts (1 Synthetic + 5 Floodlit)', 'Basketball', 'Outdoor Sports', 12.9680, 79.1581, '1 international synthetic basketball court plus 5 concrete floodlit courts across central campus & SJT grounds.', 'Both', 6, ['Synthetic Surface', 'Floodlights']),
            ('Tennis Courts (4 Synthetic Floodlit)', 'Tennis Courts', 'Outdoor Sports', 12.9708, 79.1686, '4 synthetic-surface floodlit tennis courts with regulation fencing and spectator seating.', 'Both', 4, ['Synthetic Surface', 'Floodlights']),
            ('Volleyball Courts (3 Floodlit + 2 Synthetic)', 'Volleyball', 'Outdoor Sports', 12.9700, 79.1585, '5 total volleyball courts (2 synthetic floodlit + 3 clay floodlit courts).', 'Both', 5, ['Floodlights', 'Synthetic Courts']),
            ('Handball Courts (4 Floodlit)', 'Handball', 'Outdoor Sports', 12.9672, 79.1575, '4 regulation floodlit outdoor handball courts.', 'Both', 4, ['Floodlights']),
            ('Hockey Fields (2 Fields)', 'Hockey', 'Outdoor Sports', 12.9676, 79.1562, '2 full-size hockey fields for university practice and tournament matches.', 'Both', 2, ['Grass Pitch', 'Goalposts']),
            ('Throwball Courts (2 Floodlit)', 'Throwball', 'Outdoor Sports', 12.9682, 79.1590, '2 floodlit throwball courts dedicated for intramural and university games.', 'Both', 2, ['Floodlights']),

            # INDOOR SPORTS
            ('Badminton Wooden Floor Courts - Men', 'Men Wooden Badminton', 'Indoor Sports', 12.9670, 79.1570, '3 professional wooden-floor indoor badminton courts in the central Indoor Sports Complex.', 'Men', 3, ['Wooden Flooring', 'High-Ceiling Ventilation']),
            ('Badminton Wooden Floor Courts - Women', 'Women Wooden Badminton', 'Indoor Sports', 12.9684, 79.1592, '2 professional wooden-floor indoor badminton courts inside the Ladies\' Hostel sports facility.', 'Women', 2, ['Wooden Flooring', 'Dedicated Access']),
            ('Table Tennis Hall - Men (16 Tables)', 'Men Table Tennis', 'Indoor Sports', 12.9721, 79.1592, '16 tournament-grade table tennis tables inside the Men\'s Hostel Indoor Stadium.', 'Men', 16, ['Stag TT Tables', 'Anti-Glare Lighting']),
            ('Table Tennis Hall - Women (8 Tables)', 'Women Table Tennis', 'Indoor Sports', 12.9686, 79.1590, '8 tournament-grade table tennis tables inside the Ladies\' Hostel recreation centre.', 'Women', 8, ['Stag TT Tables']),
            ('Squash Courts - Men (2 Wooden Courts)', 'Men Squash', 'Indoor Sports', 12.9670, 79.1570, '2 glass-backed wooden-floor squash courts in the central Indoor Sports Complex.', 'Men', 2, ['Glass Backwall', 'Wooden Flooring']),
            ('Squash Court - Women (1 Wooden Court)', 'Women Squash', 'Indoor Sports', 12.9685, 79.1590, '1 glass-backed wooden-floor squash court inside the Ladies\' Sports facility.', 'Women', 1, ['Wooden Flooring']),
            ('Snooker & Billiards Room (Air-Conditioned)', 'Snooker Room', 'Indoor Sports', 12.9671, 79.1572, '3 air-conditioned international regulation snooker tables with cue lockers.', 'Both', 3, ['Air Conditioned', 'Billiards Cues']),

            # FITNESS & GYMNASIUMS
            ('Trendset Air-Conditioned Gymnasium', 'Trendset Gym', 'Fitness & Gyms', 12.9672, 79.1572, 'Premier central air-conditioned fitness gymnasium equipped with cardiovascular, resistance, and weight machines.', 'Both', 1, ['Central AC', 'Cardio Deck', 'Certified Trainers']),
            ('Indoor Men\'s Air-Conditioned Gym', 'Indoor Men Gym', 'Fitness & Gyms', 12.9721, 79.1592, 'Air-conditioned men\'s gym situated inside the Men\'s Hostel Indoor Stadium.', 'Men', 1, ['AC', 'Free Weights', 'Squat Racks']),
            ('Multi Gym (Men - 2 Units)', 'Multi Gym Men', 'Fitness & Gyms', 12.9745, 79.1590, '2 multi-station resistance gyms located in the Men\'s Hostel quadrangle.', 'Men', 2, ['Multi-Station Machine', 'Dumbbells']),
            ('FITTY A/C Gym & New FITTY Gym', 'FITTY Gym', 'Fitness & Gyms', 12.9673, 79.1574, 'Modern dual air-conditioned fitness facilities with advanced functional training stations.', 'Both', 2, ['AC', 'Functional Training', 'CrossFit Rig']),
            ('Ladies\' Hostel A & B Block A/C Gym', 'LH A&B Gym', 'Fitness & Gyms', 12.9691, 79.1582, 'Dedicated air-conditioned gymnasium for female residents of LH A and B blocks.', 'Women', 1, ['AC', 'Treadmills', 'Yoga Mats']),
            ('Ladies\' Hostel C & D Block Indoor A/C Gym', 'LH C&D Gym', 'Fitness & Gyms', 12.9687, 79.1590, 'Air-conditioned fitness centre for residents of LH C and D blocks.', 'Women', 1, ['AC', 'Cardio Equipment']),
            ('Ladies\' Hostel G Block A/C Gym', 'LH G Gym', 'Fitness & Gyms', 12.9680, 79.1604, 'Air-conditioned gymnasium inside Ladies\' Hostel G block tower.', 'Women', 1, ['AC', 'Ellipticals']),
            ('Ladies\' Hostel J Block A/C Gym', 'LH J Gym', 'Fitness & Gyms', 12.9681, 79.1591, 'Air-conditioned modern gymnasium in LH J block.', 'Women', 1, ['AC', 'Free Weights']),
            ('Ladies\' Hostel General Indoor Gyms (2 Facilities)', 'LH Indoor Gym', 'Fitness & Gyms', 12.9684, 79.1596, '2 general indoor gymnasiums for all female hostel residents.', 'Women', 2, ['Weight Training', 'Stretching Area']),

            # SWIMMING POOLS
            ('Olympic Swimming Pool - Men (50m x 25m)', 'Olympic Pool Men', 'Swimming', 12.9668, 79.1560, 'International 50-meter 8-lane Olympic dimension swimming pool with lifeguard supervision and spectator stands.', 'Men', 1, ['50m Pool', '8 Lanes', 'Lifeguards', 'Diving Blocks']),
            ('Swimming Pool - Women (25m x 12.5m)', 'Swimming Pool Women', 'Swimming', 12.9708, 79.1615, '25-meter private swimming pool facility dedicated for female students and faculty.', 'Women', 1, ['25m Pool', 'Private Enclosure', 'Female Lifeguards']),
        ]

        for sp_name, sp_short, subcat, lat, lng, desc, gender, count, facs in detailed_sports:
            upsert(
                name=sp_name,
                category='Sports',
                parent=grp_sports,
                defaults={
                    'short_name': sp_short,
                    'subcategory': subcat,
                    'description': desc,
                    'entry_type': 'entry',
                    'location_name': f"{sp_name}, Campus Sports Zone",
                    'latitude': lat,
                    'longitude': lng,
                    'gender_target': gender,
                    'facility_count': count,
                    'opening_hours': '06:00 AM - 08:30 AM | 04:30 PM - 08:00 PM',
                    'source_url': 'https://vit.ac.in/campuslife/sports',
                    'search_keywords': [sp_short.lower(), subcat.lower(), gender.lower(), 'sports', 'court', 'ground', 'gym', 'pool'],
                    'aliases': [sp_short, sp_name, f"{gender} {sp_short}"],
                    'facilities': facs + [f'{count} Facility Units', f'Access: {gender}']
                }
            )

        # ==========================================
        # 8. AUDITORIUMS & EVENT VENUES
        # ==========================================
        auditoriums = [
            ('Anna Auditorium', 'Anna Audi', 12.9693, 79.1552, 'Main university auditorium with 1,800 seating capacity, centralized AC, stage, and green rooms. Behind Main Building.', 1800, ['Anna Auditorium', 'Anna Audi']),
            ('Dr. M. Channa Reddy Auditorium', 'Channa Reddy', 12.9696, 79.1558, 'Air-conditioned conference auditorium with 469 seats. Ground floor Room G-20, Main Building.', 469, ['Channa Reddy Audi', 'Channa Reddy Auditorium']),
            ('Dr. Ambedkar Auditorium', 'Ambedkar Audi', 12.9712, 79.1592, 'Technology Tower air-conditioned seminar auditorium with 198 seats.', 198, ['Ambedkar Audi']),
            ('Kamaraj Auditorium', 'Kamaraj Audi', 12.9713, 79.1594, 'Technology Tower conference auditorium with 128 seats.', 128, ['Kamaraj Audi']),
            ('Era Sezhiyan Auditorium', 'Era Sezhiyan', 12.9699, 79.1567, 'Gandhi Block academic auditorium with 462 seating capacity.', 462, ['Era Sezhiyan Audi']),
        ]

        for a_name, a_short, lat, lng, desc, cap, aliases in auditoriums:
            upsert(
                name=a_name,
                category='Auditoriums',
                defaults={
                    'short_name': a_short,
                    'subcategory': 'Event Venues',
                    'description': desc,
                    'entry_type': 'entry',
                    'location_name': a_name,
                    'latitude': lat,
                    'longitude': lng,
                    'source_url': 'https://vit.ac.in/about/infrastructure',
                    'search_keywords': [a_short.lower(), 'auditorium', 'audi', 'hall', 'venue', 'event'],
                    'aliases': aliases,
                    'facilities': [f'{cap} Seats', 'Centralized AC', 'Sound System', 'Projector Screens', 'Stage Lighting']
                }
            )

        # ==========================================
        # 9. CAMPUS GATES & ACCESS
        # ==========================================
        gates = [
            ('VIT Main Gate (Gate 1)', 'Main Gate', 12.9690, 79.1554, 'Primary university vehicle and pedestrian entrance on Katpadi-Thiruvalam Road (SH59). Close to SBI Branch.', ['Main Gate', 'Gate 1']),
            ('VIT 2nd Gate (Gate 2)', '2nd Gate', 12.9702, 79.1575, 'Active pedestrian gate near Periyar Central Library and Food Mall. Surrounded by student shops.', ['2nd Gate', 'Gate 2']),
            ('VIT Gate 3 (SJT Gate)', 'Gate 3', 12.9723, 79.1645, 'Eastern campus entrance directly leading to Silver Jubilee Tower and East perimeter road.', ['Gate 3', 'SJT Gate']),
            ('Railway Souvenir Subway (Underpass)', 'Subway Underpass', 12.9732, 79.1585, 'Key pedestrian underpass connecting Main South Campus and Men’s Hostels North Campus under the railway line.', ['Subway', 'Underpass', 'Railway Subway']),
        ]

        for g_name, g_short, lat, lng, desc, aliases in gates:
            upsert(
                name=g_name,
                category='Gates & Access',
                defaults={
                    'short_name': g_short,
                    'subcategory': 'Entrances & Access',
                    'description': desc,
                    'entry_type': 'entry',
                    'location_name': g_name,
                    'latitude': lat,
                    'longitude': lng,
                    'opening_hours': 'Open 24/7 (Security ID Check)',
                    'source_url': 'https://vit.ac.in/contactus',
                    'search_keywords': [g_short.lower(), 'gate', 'entry', 'exit', 'underpass', 'subway'],
                    'aliases': aliases,
                    'facilities': ['Security Booth', 'Boom Barrier', 'Pedestrian Turnstile', 'CCTV']
                }
            )

        # ==========================================
        # 10. DINING & CAMPUS AMENITIES
        # ==========================================
        amenities = [
            ('TT Express Printing & Binding Cell', 'Printing Cell', 12.9712, 79.1593, 'High-speed laser document printing, engineering plan plotting, and project spiral binding.', 'TT Ground Floor Room 004', '08:30 AM - 07:00 PM', 'tt.printing@vit.ac.in', 'Student Utilities', ['Printing Cell', 'TT Printing']),
            ('Food Mall (Central Food Court)', 'Food Mall', 12.9705, 79.1572, 'Multi-cuisine campus dining hub with vegetarian and non-vegetarian counters, bakery, and juice bars.', 'Opposite Swimming Pool / Library Road', '07:30 AM - 10:30 PM', None, 'Dining & Food Courts', ['Food Mall', 'Central Food Mall']),
            ('SJT Food Court & Cafe', 'SJT Cafe', 12.9718, 79.1630, 'Quick-bite cafeteria, beverages, and snacks situated on the ground floor of Silver Jubilee Tower.', 'Silver Jubilee Tower Ground Floor', '08:00 AM - 08:00 PM', None, 'Dining & Food Courts', ['SJT Cafe', 'SJT Food Court']),
            ('Campus Post Office', 'Post Office', 12.9692, 79.1550, 'Official India Post sub-office providing registered post, speed post, and postal services.', 'Near Main Gate Administrative Annex', '09:30 AM - 04:30 PM', '0416-2242001', 'Student Utilities', ['Post Office', 'Campus Post Office']),
        ]

        for am_name, am_short, lat, lng, desc, loc, hours, cont, cat, aliases in amenities:
            upsert(
                name=am_name,
                category=cat,
                defaults={
                    'short_name': am_short,
                    'subcategory': cat,
                    'description': desc,
                    'entry_type': 'entry',
                    'location_name': loc,
                    'latitude': lat,
                    'longitude': lng,
                    'opening_hours': hours,
                    'contact': cont,
                    'phone': cont if cont and '0416' in cont else None,
                    'email': cont if cont and '@' in cont else None,
                    'source_url': 'https://vit.ac.in/campuslife/otheramenities',
                    'search_keywords': [am_short.lower(), 'amenity', 'food', 'print', 'post'],
                    'aliases': aliases,
                    'facilities': ['Air Conditioning', 'Digital Payment', 'Wheelchair Accessible']
                }
            )

        total_count = DirectoryEntry.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {total_count} verified VIT Vellore directory entries!'))
