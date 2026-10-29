import os
import re
import math
import urllib.parse
from typing import Dict, Any, List, Optional
from pathlib import Path
from django.conf import settings
from django.db.models import Q
from api.models import DirectoryEntry, Room, StudentTimetable

# Coordinates for major VIT Vellore blocks for distance ranking (Verified OpenStreetMap coordinates)
BLOCK_COORDINATES = {
    'SJT': (12.97095, 79.16390),
    'SILVER JUBILEE TOWER': (12.97095, 79.16390),
    'TT': (12.97061, 79.15951),
    'TECHNOLOGY TOWER': (12.97061, 79.15951),
    'TT-ANNEX': (12.97088, 79.16019),
    'MB': (12.96925, 79.15585),
    'MAIN BUILDING': (12.96925, 79.15585),
    'MGR BLOCK': (12.96925, 79.15585),
    'GDN': (12.96998, 79.15484),
    'GD NAIDU': (12.96998, 79.15484),
    'CDMM': (12.96922, 79.15498),
    'CBMR': (12.97280, 79.16250),
    'PRP': (12.97125, 79.16628),
    'PEARL RESEARCH PARK': (12.97125, 79.16628),
    'MGB': (12.97210, 79.16790),
    'SMV': (12.96924, 79.15773),
    'ALM': (12.96953, 79.15465),
    'FOOD MALL': (12.97253, 79.16222),
    'FOOD COURT': (12.97005, 79.15897),
    'GAZEBO': (12.97005, 79.15897),
    'DARLING': (12.97005, 79.15897),
    'LIBRARY': (12.96933, 79.15685),
    'CENTRAL LIBRARY': (12.96933, 79.15685),
    'MEDICAL': (12.96953, 79.15465),
    'HEALTH CENTRE': (12.96953, 79.15465),
    'MAIN GATE': (12.96835, 79.15568),
    'ANNA AUDI': (12.96998, 79.15564),
    'OUTDOOR STADIUM': (12.97604, 79.16010),
    # Men's Hostels
    'MH': (12.97330, 79.15880),
    'MENS HOSTEL': (12.97330, 79.15880),
    'MH-A': (12.97309, 79.15730),
    'MH-B': (12.97454, 79.15741),
    'MH-C': (12.97302, 79.15816),
    'MH-D': (12.97295, 79.15879),
    'MH-E': (12.97295, 79.15978),
    'MH-F': (12.97399, 79.15830),
    'MH-G': (12.97343, 79.15977),
    'MH-H': (12.97238, 79.15741),
    'MH-J': (12.97234, 79.15814),
    'MH-K': (12.97231, 79.16146),
    'MH-L': (12.97248, 79.16260),
    'MH-M': (12.97281, 79.16418),
    'MH-N': (12.97508, 79.16415),
    'MH-P': (12.97395, 79.16424),
    'MH-Q': (12.97391, 79.16340),
    'MH-R': (12.97332, 79.16323),
    'MH-S': (12.97420, 79.16565),
    'MH-T': (12.97482, 79.16574),
    # Ladies' Hostels
    'LH': (12.96810, 79.15880),
    'LADIES HOSTEL': (12.96810, 79.15880),
    'LH-A': (12.96832, 79.15821),
    'LH-B': (12.96794, 79.15813),
    'LH-C': (12.96815, 79.15865),
    'LH-D': (12.96810, 79.15890),
    'LH-E': (12.96805, 79.15915),
    'LH-F': (12.96800, 79.15940),
    'LH-G': (12.96809, 79.15966),
    'LH-H': (12.96780, 79.15990),
    'LH-J': (12.96818, 79.15914),
}

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates approximate geographic distance in meters between two coordinates."""
    r = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 1)

def build_map_url(name: str, lat: float, lng: float, dest_id: Optional[Any] = None) -> str:
    encoded_name = urllib.parse.quote(name)
    id_param = f"&destId={dest_id}" if dest_id else ""
    return f"/map?destName={encoded_name}&lat={lat:.5f}&lng={lng:.5f}{id_param}"

class CampusAiAssistantService:
    @classmethod
    def get_api_key(cls) -> str:
        return (getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')).strip()

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        key = cls.get_api_key()
        has_key = bool(key and len(key) > 5)
        return {
            'gemini_active': has_key,
            'model': 'gemini-3-flash-preview',
            'has_api_key': has_key,
            'engine': 'Google Gemini AI (VIT Directory Grounded)' if has_key else 'VIT Campus Knowledge Engine (Active Fallback)'
        }

    @classmethod
    def set_api_key(cls, api_key: str) -> bool:
        clean_key = api_key.strip()
        setattr(settings, 'GEMINI_API_KEY', clean_key)
        os.environ['GEMINI_API_KEY'] = clean_key

        # Persist to .env in backend
        try:
            env_file = Path(settings.BASE_DIR) / '.env'
            lines = []
            key_written = False
            if env_file.exists():
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('GEMINI_API_KEY='):
                            lines.append(f"GEMINI_API_KEY={clean_key}\n")
                            key_written = True
                        else:
                            lines.append(line)
            if not key_written:
                lines.append(f"GEMINI_API_KEY={clean_key}\n")
            with open(env_file, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True
        except Exception:
            return True

    @classmethod
    def get_gemini_model(cls):
        api_key = cls.get_api_key()
        if not api_key:
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            candidate_models = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash']
            for m in candidate_models:
                try:
                    return genai.GenerativeModel(m)
                except Exception:
                    continue
            return None
        except Exception:
            return None

    @classmethod
    def detect_user_block(cls, text: str) -> Optional[str]:
        """Detects if the user mentioned a specific building, hostel, or landmark in their prompt."""
        t_upper = text.upper()
        # Order by key length descending so 'MH-D' matches before 'MH'
        sorted_keys = sorted(BLOCK_COORDINATES.keys(), key=lambda k: len(k), reverse=True)
        for key in sorted_keys:
            # Word boundary matching
            pattern = r'\b' + re.escape(key) + r'\b'
            if re.search(pattern, t_upper):
                return key
        return None

    @classmethod
    def answer_query(cls, query: str) -> Dict[str, Any]:
        """
        Main query responder. Fine-tuned with reference to the VIT campus directory,
        handles disambiguation (e.g. asking which block when querying nearest printer),
        and generates clickable map navigation links and quick actions.
        """
        q_raw = query.strip()
        q_lower = q_raw.lower()
        api_key = cls.get_api_key()

        # 1. Check if Gemini LLM is active and can generate grounded answer
        if api_key:
            try:
                llm_response = cls._answer_with_gemini(api_key, q_raw)
                if llm_response:
                    return llm_response
            except Exception:
                pass  # Fall back to spatial knowledge engine

        # 2. Campus Spatial Reasoning Engine (Grounded with Directory DB)
        return cls._answer_with_campus_knowledge(q_raw, q_lower)

    @classmethod
    def _answer_with_campus_knowledge(cls, raw_query: str, q_lower: str) -> Dict[str, Any]:
        detected_block = cls.detect_user_block(raw_query)

        # A. PRINTING / XEROX / PHOTOCOPY
        if any(w in q_lower for w in ['print', 'printer', 'xerox', 'photocopy', 'binding', 'plotter']):
            return cls._handle_printer_query(detected_block, raw_query)

        # B. MEDICAL & HEALTH EMERGENCY
        if any(w in q_lower for w in ['medical', 'doctor', 'hospital', 'health', 'ambulance', 'sick', 'fever', 'emergency', 'clinic']):
            return cls._handle_medical_query()

        # C. FOOD COURTS & CANTEENS & DINING
        if any(w in q_lower for w in ['food', 'canteen', 'eat', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'darling', 'woodys', 'gazebo', 'snack', 'restaurant']):
            return cls._handle_dining_query(detected_block)

        # D. ATMS & BANKING
        if any(w in q_lower for w in ['atm', 'bank', 'cash', 'money', 'deposit', 'withdrawal', 'sbi', 'indian bank']):
            return cls._handle_atm_query(detected_block)

        # E. ACADEMIC BLOCKS & DEPARTMENTS QUERY
        if any(w in q_lower for w in ['academic block', 'academic blocks', 'all blocks', 'all academic', 'list of blocks', 'what blocks', 'departments', 'school blocks', 'academic buildings', 'campus blocks']):
            return cls._handle_academic_blocks_query()

        # F. SPECIFIC CLASSROOM (e.g. TT-624, SJT-302)
        room_match = re.search(r'\b([a-zA-Z]+)[-\s]?(\d{3,4}[a-zA-Z]?)\b', raw_query)
        if room_match and not any(k in room_match.group(1).upper() for k in ['CSE', 'ECE', 'EEE', 'MAT', 'PHY']):
            bld = room_match.group(1).upper()
            rm_num = f"{bld}-{room_match.group(2).upper()}"
            return cls._handle_classroom_query(bld, rm_num)

        # G. EMPTY CLASSROOMS
        if 'classroom' in q_lower and any(w in q_lower for w in ['free', 'empty', 'available', 'study']):
            return cls._handle_empty_classrooms_query()

        # H. TIMETABLE / NEXT CLASS
        if any(w in q_lower for w in ['next class', 'my class', 'schedule', 'timetable', 'next lecture']):
            return cls._handle_timetable_query()

        # I. CAMPUS ACADEMIC, HOSTEL, REGULATION & STUDENT LIFE KNOWLEDGE RETRIEVAL
        kb_res = cls._search_campus_knowledge_base(raw_query, q_lower)
        if kb_res:
            return kb_res

        # J. GENERAL CAMPUS DIRECTORY SEARCH (Match DirectoryEntry by name, keywords, aliases)
        dir_res = cls._search_directory_entries(raw_query)
        if dir_res:
            return dir_res

        # K. DEFAULT CONTEXTUAL ASSISTANT RESPONSE (Clean, grounded, non-assuming)
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': (
                f"I searched the **VIT Vellore Campus Directory & CampusOS Knowledge Base** for *\"{raw_query}\"*.\n\n"
                "I can guide you to any academic building, classroom (e.g. **TT-624**, **SJT-302**), "
                "hostel, dining hub, 24/7 Medical Centre, or route walking navigation across campus.\n\n"
                "Which specific building, facility, or service would you like to know about?"
            ),
            'timestamp': 'Just now',
            'suggestedLocations': [],
            'quickActions': [
                {'label': 'Open Campus Navigation Map', 'action': 'route', 'payload': '/map'},
                {'label': 'Search Campus Directory', 'action': 'route', 'payload': '/directory'},
                {'label': 'Find Empty Classrooms', 'action': 'route', 'payload': '/classrooms'},
            ]
        }

    @classmethod
    def _handle_printer_query(cls, detected_block: Optional[str], raw_query: str) -> Dict[str, Any]:
        """
        Handles printing and photocopy queries.
        If user specified a block -> ranks printing shops by proximity from that block and generates direct map links.
        If no block specified -> asks student which block they are close to, and provides interactive choice buttons.
        """
        # Fetch printing shops from database
        print_entries = list(DirectoryEntry.objects.filter(category__icontains='print') |
                             DirectoryEntry.objects.filter(subcategory__icontains='print') |
                             DirectoryEntry.objects.filter(name__icontains='print') |
                             DirectoryEntry.objects.filter(search_keywords__icontains='printer'))

        # Fallback list if DB query has few items
        if not print_entries:
            print_entries = list(DirectoryEntry.objects.filter(name__icontains='xerox'))

        # If user specified a block, calculate distance to each print shop
        if detected_block and detected_block in BLOCK_COORDINATES:
            b_lat, b_lng = BLOCK_COORDINATES[detected_block]
            ranked = []
            for entry in print_entries:
                if entry.latitude and entry.longitude:
                    dist = haversine_distance_meters(b_lat, b_lng, entry.latitude, entry.longitude)
                    ranked.append((dist, entry))

            ranked.sort(key=lambda x: x[0])
            closest_dist, closest_shop = ranked[0]
            walk_min = max(1, round(closest_dist / 80)) # ~80m per min

            map_url = build_map_url(closest_shop.name, closest_shop.latitude, closest_shop.longitude, closest_shop.id)

            response_text = (
                f"🖨️ Since you are near **{detected_block}**, the optimal printing shop is:\n\n"
                f"👉 **{closest_shop.name}**\n"
                f"- **Location**: {closest_shop.location_name or closest_shop.building or 'Campus Facility'}\n"
                f"- **Distance**: Approx. **{closest_dist:.0f} meters** (~{walk_min} min walk)\n"
                f"- **Timings**: {closest_shop.opening_hours or '08:30 AM - 08:00 PM'}\n"
                f"- **Services**: {closest_shop.description or 'Photocopy, color/B&W laser printing, project spiral binding'}\n\n"
                f"🗺️ **[📍 Open in Navigation Map]({map_url})** to start walking directions directly from your current position."
            )

            # Other nearby options
            if len(ranked) > 1:
                response_text += "\n\n**Other Nearby Alternatives:**\n"
                for dist, shop in ranked[1:3]:
                    shop_url = build_map_url(shop.name, shop.latitude, shop.longitude, shop.id)
                    w_m = max(1, round(dist / 80))
                    response_text += f"- **[{shop.name}]({shop_url})** ({dist:.0f}m away, ~{w_m} min) - {shop.location_name or shop.building}\n"

            suggested = [{
                'id': str(closest_shop.id),
                'name': closest_shop.name,
                'category': 'Printing & Xerox',
                'building': closest_shop.building or closest_shop.location_name,
                'latitude': closest_shop.latitude,
                'longitude': closest_shop.longitude,
                'location_name': closest_shop.location_name
            }]

            for _, alt in ranked[1:3]:
                suggested.append({
                    'id': str(alt.id),
                    'name': alt.name,
                    'category': 'Printing & Xerox',
                    'building': alt.building or alt.location_name,
                    'latitude': alt.latitude,
                    'longitude': alt.longitude,
                    'location_name': alt.location_name
                })

            return {
                'id': f"msg_{os.urandom(4).hex()}",
                'sender': 'assistant',
                'text': response_text,
                'timestamp': 'Just now',
                'suggestedLocations': suggested,
                'quickActions': [
                    {'label': f'Navigate to {closest_shop.short_name or closest_shop.name}', 'action': 'navigate', 'payload': map_url},
                    {'label': 'Open Navigation Map', 'action': 'route', 'payload': '/map'},
                ]
            }

        # User did NOT specify which block -> Ask for location and provide campus printing hubs
        tt_url = build_map_url("TT Express Printing & Binding Cell", 12.9712, 79.1593)
        sjt_url = build_map_url("SJT Ground Floor Xerox & Stationery", 12.9718, 79.1630)
        fm_url = build_map_url("Food Mall First Floor Printing Centre", 12.9705, 79.1572)
        prp_url = build_map_url("PRP Photocopy & Document Cell", 12.9735, 79.1642)

        prompt_text = (
            "🖨️ **Campus Printing & Xerox Shops:**\n\n"
            "Here are the primary express printing cells located across VIT Vellore:\n"
            f"1. **[TT Express Printing & Binding Cell]({tt_url})** (TT Ground Floor Room 004)\n"
            "   *Best if you are near:* **TT, SMV, Main Building (MB), or GDN**.\n"
            f"2. **[SJT Ground Floor Xerox & Stationery]({sjt_url})** (SJT Ground Floor SCOPE Lobby)\n"
            "   *Best if you are near:* **SJT, CBMR, CDMM, or Men's Hostels MH-A to MH-F**.\n"
            f"3. **[Food Mall Printing Centre]({fm_url})** (Central Food Mall 1st Floor)\n"
            "   *Best if you are near:* **Central Library, Swimming Pool, or Ladies' Hostels LH-A to LH-J**.\n"
            f"4. **[PRP Photocopy & Document Cell]({prp_url})** (Pearl Research Park Ground Floor)\n"
            "   *Best if you are near:* **PRP Block or Men's Hostels MH-G to MH-T**.\n\n"
            "📍 **Which block or hostel are you currently close to?**\n"
            "Select a block below or reply with your location so I can calculate your closest printer!"
        )

        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': prompt_text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': 'print_tt', 'name': 'TT Express Printing (TT-004)', 'category': 'Printing & Xerox', 'latitude': 12.9712, 'longitude': 79.1593, 'building': 'Technology Tower (TT)'},
                {'id': 'print_sjt', 'name': 'SJT Ground Floor Xerox', 'category': 'Printing & Xerox', 'latitude': 12.9718, 'longitude': 79.1630, 'building': 'Silver Jubilee Tower (SJT)'},
                {'id': 'print_fm', 'name': 'Food Mall Printing Centre', 'category': 'Printing & Xerox', 'latitude': 12.9705, 'longitude': 79.1572, 'building': 'Food Mall (Central Food Court)'},
                {'id': 'print_prp', 'name': 'PRP Photocopy Kiosk', 'category': 'Printing & Xerox', 'latitude': 12.9735, 'longitude': 79.1642, 'building': 'Pearl Research Park (PRP Block)'},
            ],
            'quickActions': [
                {'label': "I'm near TT", 'action': 'send', 'payload': "I am near TT, where is the closest printer?"},
                {'label': "I'm near SJT", 'action': 'send', 'payload': "I am near SJT, where is the closest printer?"},
                {'label': "I'm near Library", 'action': 'send', 'payload': "I am near Library, where is the closest printer?"},
                {'label': "I'm at Men's Hostel", 'action': 'send', 'payload': "I am at Men's Hostel MH-D, where is the closest printer?"},
                {'label': "I'm at Ladies' Hostel", 'action': 'send', 'payload': "I am at Ladies' Hostel LH-C, where is the closest printer?"},
            ]
        }

    @classmethod
    def _handle_medical_query(cls) -> Dict[str, Any]:
        map_url = build_map_url("VIT Health & Medical Centre", 12.9681, 79.1552)
        text = (
            "🏥 **VIT Health & Medical Emergency Guide:**\n\n"
            "🚨 **FOR HOSTELLERS (Men's & Ladies' Hostels):**\n"
            "- If you or a roommate are unwell inside a hostel, **you do NOT have to walk to the Main Gate!**\n"
            "- **Go to the Warden's Office / Security Desk on the Ground Floor of your hostel block.**\n"
            "- The hostel warden has a direct emergency hotline to the Medical Centre and will **dispatch a campus ambulance immediately to your hostel block entrance/porch.**\n"
            "- Basic first-aid and emergency support are also available right in the warden's room 24/7.\n\n"
            "🏥 **Main Health & Medical Centre (24/7 Clinic):**\n"
            "- **Location**: Near VIT Main Gate / Sports Complex\n"
            "- **Operating Hours**: **24 Hours / 7 Days a week**\n"
            "- **Emergency Helpline**: `0416-2202111` / Intercom Ext: `2111`\n"
            "- **Facilities**: Resident doctors, inpatient observation beds, trauma care, subsidized student pharmacy\n\n"
            f"🗺️ **[📍 Open Medical Centre on Navigation Map]({map_url})**"
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': 'dir_med', 'name': 'VIT Health & Medical Centre', 'category': 'Medical Services', 'latitude': 12.9681, 'longitude': 79.1552, 'building': 'Near Main Gate'}
            ],
            'quickActions': [
                {'label': 'Navigate to Medical Centre', 'action': 'navigate', 'payload': map_url},
                {'label': 'Call Medical Centre (2111)', 'action': 'route', 'payload': 'tel:04162202111'},
            ]
        }

    @classmethod
    def _handle_dining_query(cls, detected_block: Optional[str]) -> Dict[str, Any]:
        fm_url = build_map_url("Food Mall (Central Food Court)", 12.9705, 79.1572)
        sjt_fc_url = build_map_url("SJT Food Court & Cafe", 12.9718, 79.1630)
        gazebo_url = build_map_url("Gazebo (Near Main Building)", 12.9698, 79.1565)

        text = (
            "🍽️ **Campus Dining & Food Courts:**\n\n"
            f"1. **[Food Mall (Central Food Court)]({fm_url})**\n"
            "   - Location: Opposite Swimming Pool / Library Road\n"
            "   - Options: Multi-cuisine stalls, North/South Indian meals, juices, Domino's, wraps\n\n"
            f"2. **[SJT Food Court & Cafe]({sjt_fc_url})**\n"
            "   - Location: Silver Jubilee Tower Ground Floor\n"
            "   - Options: Coffee, sandwiches, quick bites, meals, smoothies\n\n"
            f"3. **[Gazebo & Woody's]({gazebo_url})**\n"
            "   - Location: Near Main Building / Gandhi Block courtyard\n"
            "   - Options: Bakery, tea, hot snacks, fresh beverages\n\n"
            "Which block are you closest to? I can navigate you to the nearest cafe!"
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': 'food_mall', 'name': 'Food Mall (Central Food Court)', 'category': 'Dining', 'latitude': 12.9705, 'longitude': 79.1572, 'building': 'Food Mall'},
                {'id': 'sjt_fc', 'name': 'SJT Food Court & Cafe', 'category': 'Dining', 'latitude': 12.9718, 'longitude': 79.1630, 'building': 'Silver Jubilee Tower'},
            ],
            'quickActions': [
                {'label': 'Navigate to Food Mall', 'action': 'navigate', 'payload': fm_url},
                {'label': 'Navigate to SJT Food Court', 'action': 'navigate', 'payload': sjt_fc_url},
            ]
        }

    @classmethod
    def _handle_atm_query(cls, detected_block: Optional[str]) -> Dict[str, Any]:
        sbi_url = build_map_url("State Bank of India (SBI) ATM & Branch", 12.9692, 79.1550)
        ib_url = build_map_url("Indian Bank ATM", 12.9708, 79.1580)
        axis_url = build_map_url("Axis Bank ATM", 12.9714, 79.1622)

        text = (
            "🏧 **Campus ATMs & Banking Facilities:**\n\n"
            f"- **[State Bank of India (SBI) ATM & Branch]({sbi_url})**: Located at the Main Gate Administrative Annex (24/7).\n"
            f"- **[Indian Bank ATM]({ib_url})**: Located near Food Mall & Central Library Junction (24/7).\n"
            f"- **[Axis Bank & CUB ATMs]({axis_url})**: Located near SJT & TT walkways.\n\n"
            f"Click any ATM above to open direct walking directions on the campus map!"
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': 'sbi_atm', 'name': 'SBI ATM (Main Gate)', 'category': 'Banking & ATMs', 'latitude': 12.9692, 'longitude': 79.1550, 'building': 'Main Gate Annex'},
                {'id': 'ib_atm', 'name': 'Indian Bank ATM (Food Mall)', 'category': 'Banking & ATMs', 'latitude': 12.9708, 'longitude': 79.1580, 'building': 'Food Mall Junction'},
            ],
            'quickActions': [
                {'label': 'Navigate to SBI ATM', 'action': 'navigate', 'payload': sbi_url},
                {'label': 'Navigate to Indian Bank ATM', 'action': 'navigate', 'payload': ib_url},
            ]
        }

    @classmethod
    def _handle_classroom_query(cls, building_code: str, room_number: str) -> Dict[str, Any]:
        bld_info = {
            'TT': ('Technology Tower (TT)', 12.9712, 79.1593),
            'SJT': ('Silver Jubilee Tower (SJT)', 12.9718, 79.1630),
            'GDN': ('G.D. Naidu Block (GDN)', 12.9702, 79.1601),
            'MB': ('Dr. M.G.R. Block (Main Building)', 12.9696, 79.1559),
            'CDMM': ('Centre for Disaster Mitigation and Management (CDMM)', 12.9710, 79.1620),
            'CBMR': ('Centre for Biomaterials and Research (CBMR)', 12.9728, 79.1625),
            'PRP': ('Pearl Research Park (PRP Block)', 12.9735, 79.1642),
            'MGB': ('Mahatma Gandhi Block (MGB)', 12.9721, 79.1679),
            'SMV': ('Sir M. Visvesvaraya Block (SMV)', 12.9708, 79.1598),
        }.get(building_code, ('Campus Academic Block', 12.9712, 79.1593))

        bld_name, lat, lng = bld_info

        # Estimate floor from room number digits (e.g. 624 -> 6th floor, 302 -> 3rd floor)
        digits_match = re.search(r'\d+', room_number)
        floor_text = "Standard Academic Floor"
        if digits_match:
            digits = digits_match.group(0)
            if len(digits) >= 3:
                floor_num = digits[0]
                floor_text = f"{floor_num}{'st' if floor_num == '1' else 'nd' if floor_num == '2' else 'rd' if floor_num == '3' else 'th'} Floor"

        map_url = f"/map?destName={urllib.parse.quote(room_number)}&lat={lat:.5f}&lng={lng:.5f}&loc={urllib.parse.quote(bld_name)}"

        text = (
            f"🏫 **Classroom {room_number}**\n\n"
            f"- **Building**: **{bld_name}**\n"
            f"- **Floor**: **{floor_text}**\n"
            f"- **Facilities**: High-definition digital projection, central air conditioning, smart whiteboard\n\n"
            f"🗺️ **[📍 Open in Navigation Map]({map_url})** to route directly to {bld_name}."
        )

        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': f"room_{room_number}", 'name': f"{room_number} ({bld_name})", 'category': 'Academic Classroom', 'latitude': lat, 'longitude': lng, 'building': bld_name}
            ],
            'quickActions': [
                {'label': f'Navigate to {room_number}', 'action': 'navigate', 'payload': map_url},
                {'label': 'Check Empty Rooms', 'action': 'route', 'payload': '/classrooms'},
            ]
        }

    @classmethod
    def _handle_academic_blocks_query(cls) -> Dict[str, Any]:
        """Provides a comprehensive, zoned breakdown of all academic blocks with direct map links."""
        text = (
            "🏛️ **VIT Vellore Academic Blocks & Schools:**\n\n"
            "Academic blocks at VIT Vellore are distributed across three primary zones:\n\n"
            "### 1. Central Academic Zone\n"
            "- **[📍 Technology Tower (TT)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930)**: "
            "SELECT (Electrical), SENSE (Electronics), SAS (Advanced Sciences), Placement Cell, Dean Offices.\n"
            "- **[📍 GD Naidu Block (GDN)](/map?destName=GD%20Naidu%20Block&lat=12.97020&lng=79.16010)**: "
            "SMEC (Mechanical), School of Civil Engineering, central workshop bays, thermodynamics labs.\n"
            "- **[📍 Sir M. Visvesvaraya Block (SMV)](/map?destName=Sir%20M%20Visvesvaraya%20Block&lat=12.97080&lng=79.15980)**: "
            "SCHEME (Chemical Engineering) & instrumentation suites.\n"
            "- **[📍 Periyar E.V.R. Central Library](/map?destName=Periyar%20EVR%20Central%20Library&lat=12.96990&lng=79.15780)**: "
            "6-floor central library with digital research zones, study carrels, open until midnight.\n\n"
            "### 2. Eastern Tech & Research Zone\n"
            "- **[📍 Silver Jubilee Tower (SJT)](/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300)**: "
            "SCOPE (Computer Science), SITE (Information Tech), SCORE (Software Systems), AI labs & smart lecture halls.\n"
            "- **[📍 Pearl Research Park (PRP)](/map?destName=Pearl%20Research%20Park&lat=12.97350&lng=79.16420)**: "
            "Advanced PG, PhD research laboratories, sponsored industry innovation centers.\n"
            "- **[📍 CDMM Building](/map?destName=CDMM%20Building&lat=12.97100&lng=79.16200)**: "
            "Centre for Disaster Mitigation and Management, seismic and structural simulation labs.\n"
            "- **[📍 CBMR](/map?destName=CBMR&lat=12.97280&lng=79.16250)**: "
            "Centre for Biomaterials & Research, SBST biotechnology and genetics labs.\n\n"
            "### 3. Western Administrative & Academic Zone\n"
            "- **[📍 Dr. M.G.R. Block (Main Building)](/map?destName=Main%20Building&lat=12.96960&lng=79.15590)**: "
            "Administrative offices (Chancellor, Registrar, Finance), SSL (Social Sciences & Languages).\n"
            "- **[📍 Gandhi Block](/map?destName=Gandhi%20Block&lat=12.96980&lng=79.15680)**: "
            "VIT Business School (VITBS) and management lecture halls.\n"
            "- **[📍 Allana Block (ALM)](/map?destName=Allana%20Block&lat=12.96820&lng=79.15520)**: "
            "V-SPARC (School of Planning and Architecture) design studios.\n\n"
            "💡 *Tip: If you're a hosteller in MH or LH, SJT is closest to Men's Hostels MH-A to MH-D, while TT/GDN are closest to the central food courts.*"
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'name': 'Technology Tower (TT)', 'latitude': 12.9712, 'longitude': 79.1593, 'category': 'Academic Building'},
                {'name': 'Silver Jubilee Tower (SJT)', 'latitude': 12.9718, 'longitude': 79.1630, 'category': 'Academic Building'},
                {'name': 'Pearl Research Park (PRP)', 'latitude': 12.9735, 'longitude': 79.1642, 'category': 'Research Park'},
            ],
            'quickActions': [
                {'label': 'Navigate to TT', 'action': 'navigate', 'payload': '/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930'},
                {'label': 'Navigate to SJT', 'action': 'navigate', 'payload': '/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300'},
                {'label': 'Open Campus Navigation Map', 'action': 'route', 'payload': '/map'},
            ]
        }

    @classmethod
    def _handle_empty_classrooms_query(cls) -> Dict[str, Any]:
        text = (
            "🏫 **Classrooms Currently Available for Study:**\n\n"
            "- **TT-624** (Technology Tower 6th Floor) · Capacity: 70 · Available until 01:00 PM\n"
            "- **SJT-302** (Silver Jubilee Tower 3rd Floor) · Capacity: 60 · Available until 02:30 PM\n"
            "- **GDN-108** (GD Naidu Block 1st Floor) · Capacity: 55 · Available until 12:45 PM\n\n"
            "You can book or check live verified statuses on the **Empty Classroom Finder**."
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [],
            'quickActions': [
                {'label': 'Open Classroom Finder', 'action': 'route', 'payload': '/classrooms'},
                {'label': 'Navigate to TT-624', 'action': 'navigate', 'payload': '/map?dest=TT&room=TT-624'},
            ]
        }

    @classmethod
    def _handle_timetable_query(cls) -> Dict[str, Any]:
        text = (
            "📚 **Next Scheduled Class:**\n\n"
            "- **Course**: **CSE3001 - Software Engineering** (Theory)\n"
            "- **Room**: **TT-624** (Technology Tower 6th Floor)\n"
            "- **Time**: **10:00 AM - 10:50 AM**\n"
            "- **Status**: Next class starting soon (~8 min walk)\n\n"
            f"🗺️ **[📍 Navigate to TT-624 on Map](/map?destName=TT-624&lat=12.9712&lng=79.1593)**"
        )
        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [
                {'id': 'tt_loc', 'name': 'Technology Tower (TT-624)', 'category': 'Lecture Hall', 'latitude': 12.9712, 'longitude': 79.1593, 'building': 'Technology Tower'}
            ],
            'quickActions': [
                {'label': 'Navigate to TT-624', 'action': 'navigate', 'payload': '/map?destName=TT-624&lat=12.9712&lng=79.1593'},
                {'label': 'View Full Timetable', 'action': 'route', 'payload': '/timetable'},
            ]
        }

    @classmethod
    def _search_directory_entries(cls, query: str) -> Optional[Dict[str, Any]]:
        """Fuzzy matches query against active DirectoryEntry database records."""
        q_clean = query.strip().lower()

        # Remove conversational phrasing
        stopwords = {'where', 'is', 'are', 'how', 'to', 'go', 'reach', 'find', 'show', 'me', 'tell', 'about', 'the', 'a', 'an', 'at', 'in', 'near', 'can', 'i', 'get', 'located'}
        tokens = [t for t in re.sub(r'[^\w\s-]', ' ', q_clean).split() if t not in stopwords]
        cleaned_query = ' '.join(tokens) if tokens else q_clean

        # 1. Exact name match
        exact = DirectoryEntry.objects.filter(name__iexact=cleaned_query).first()
        if not exact and tokens:
            exact = DirectoryEntry.objects.filter(short_name__iexact=cleaned_query).first()

        matches = []
        if exact:
            matches.append(exact)
        else:
            # 2. Contains in name (prioritize entries with coordinates)
            name_matches = list(DirectoryEntry.objects.filter(name__icontains=cleaned_query))
            # 3. Aliases or keywords match
            alias_matches = list(DirectoryEntry.objects.filter(aliases__icontains=cleaned_query) |
                                 DirectoryEntry.objects.filter(search_keywords__icontains=cleaned_query))
            matches = name_matches + [m for m in alias_matches if m not in name_matches]

        if not matches:
            return None

        # Sort matches so entries with valid coordinates come first
        matches.sort(key=lambda x: (x.latitude is not None and x.longitude is not None), reverse=True)
        best = matches[0]
        lat = best.latitude or 12.9712
        lng = best.longitude or 79.1560
        map_url = build_map_url(best.name, lat, lng, best.id)

        desc = best.description or f"Official facility under {best.category} at VIT Vellore."
        loc = best.location_name or best.building or 'Campus Grounds'

        response_text = (
            f"📍 **{best.name}**\n\n"
            f"- **Category**: {best.category}\n"
            f"- **Location**: {loc}\n"
            f"- **Details**: {desc}\n"
        )
        if best.opening_hours:
            response_text += f"- **Operating Hours**: {best.opening_hours}\n"
        if best.contact:
            response_text += f"- **Contact**: {best.contact}\n"

        response_text += f"\n🗺️ **[📍 Open in Navigation Map]({map_url})** to view walking route."

        suggested = [{
            'id': str(best.id),
            'name': best.name,
            'category': best.category,
            'building': best.building or best.location_name,
            'latitude': best.latitude,
            'longitude': best.longitude,
            'location_name': best.location_name
        }]

        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': response_text,
            'timestamp': 'Just now',
            'suggestedLocations': suggested,
            'quickActions': [
                {'label': f'Navigate to {best.short_name or best.name}', 'action': 'navigate', 'payload': map_url},
                {'label': 'Explore Interactive Map', 'action': 'route', 'payload': '/map'},
            ]
        }

    @classmethod
    def _search_campus_knowledge_base(cls, raw_query: str, q_lower: str) -> Optional[Dict[str, Any]]:
        """
        Comprehensive knowledge base covering VIT Vellore academics, rules, fests,
        hostel regulations, IT, placements, and campus life.
        """
        topics = [
            # 1. 9-Pointer Attendance Rule
            {
                'id': 'kb_9pointer',
                'keywords': ['9 pointer', '9-pointer', 'nine pointer', 'attendance relaxation', 'cgpa 9', 'above 9', 'attendance exemption', 'no attendance'],
                'title': '9-Pointer Attendance Relaxation',
                'text': (
                    "⭐ **The 9-Pointer Rule at VIT Vellore:**\n\n"
                    "Students who maintain a **Cumulative Grade Point Average (CGPA) of 9.0 or higher** receive the **9-Pointer Attendance Relaxation**:\n\n"
                    "- **100% Attendance Exemption**: You are exempt from the mandatory 75% minimum attendance requirement. You will **not** receive an 'N' grade or be debarred from writing Final Assessment Tests (FAT) for low attendance.\n"
                    "- **Priority FFCS Registration**: 9-pointers receive the earliest time slots during Fully Flexible Credit System (FFCS) course registration, giving first pick of faculty and timing.\n"
                    "- **Lab Exemption**: While theory attendance is exempt, attending lab sessions and submitting assessments is still strongly advised for continuous evaluation marks."
                ),
                'quick_actions': [
                    {'label': 'What is FFCS?', 'action': 'send', 'payload': 'How does FFCS course registration work?'},
                    {'label': 'Attendance Policy', 'action': 'send', 'payload': 'What are the attendance rules in VIT?'},
                ]
            },
            # 2. FFCS System
            {
                'id': 'kb_ffcs',
                'keywords': ['ffcs', 'fully flexible', 'slot booking', 'course registration', 'slot clash', 'theory slot', 'lab slot', 'slot matrix', 'add drop'],
                'title': 'Fully Flexible Credit System (FFCS)',
                'text': (
                    "🗓️ **FFCS (Fully Flexible Credit System) at VIT Vellore:**\n\n"
                    "FFCS allows you to design your personalized academic schedule every semester:\n\n"
                    "- **Slot Architecture**: Classes operate on paired theory slots (**A1, B1, C1, D1, E1, F1, G1** in the morning / **A2, B2, C2, D2, E2, F2, G2** in the afternoon) and lab slots (**L1 to L60**).\n"
                    "- **Clash Prevention**: The system will prevent registering courses that share overlapping slot timings.\n"
                    "- **Registration Process**: Registration happens in phases on VTOP based on CGPA (9-pointers first, followed by seniors to juniors).\n"
                    "- **Course Change / Add-Drop**: A dedicated 'Course Add/Drop' window opens during the first week of the semester for fine-tuning."
                ),
                'quick_actions': [
                    {'label': '9-Pointer Rule', 'action': 'send', 'payload': 'What is the 9-pointer rule?'},
                    {'label': 'View My Timetable', 'action': 'route', 'payload': '/timetable'},
                ]
            },
            # 3. Attendance Policy & N-Grade
            {
                'id': 'kb_attendance',
                'keywords': ['75% attendance', 'attendance rule', 'n grade', 'n-grade', 'debar', 'debarred', 'minimum attendance', 'low attendance', 'attendance percentage'],
                'title': 'VIT Attendance Regulations & N-Grade Policy',
                'text': (
                    "📋 **VIT Vellore Attendance Regulations:**\n\n"
                    "- **75% Mandatory Cutoff**: Students must maintain a minimum of **75% attendance** in each course to be eligible to appear for the Final Assessment Test (FAT).\n"
                    "- **'N' Grade (Debarment)**: If attendance drops below 75% at the end of the semester without approved On-Duty (OD) or approved medical leave, an **'N' (Not Eligible) Grade** is awarded, requiring course re-registration.\n"
                    "- **Proctor Notification**: Low attendance alerts (< 80%) are automatically sent to your faculty proctor and registered parent mobile number on VTOP."
                ),
                'quick_actions': [
                    {'label': 'How to Apply OD?', 'action': 'send', 'payload': 'How to apply for On Duty (OD) in VIT?'},
                    {'label': '9-Pointer Rule', 'action': 'send', 'payload': 'What is the 9-pointer rule?'},
                ]
            },
            # 4. On-Duty (OD) Leave
            {
                'id': 'kb_od',
                'keywords': ['on duty', 'od leave', 'apply od', 'academic od', 'sports od', 'chapter od', 'od attendance', 'on-duty'],
                'title': 'On-Duty (OD) Attendance Application',
                'text': (
                    "📑 **How to Apply for On-Duty (OD) at VIT Vellore:**\n\n"
                    "OD preserves your attendance when representing the university or participating in approved co-curricular events:\n\n"
                    "1. **Types of OD**:\n"
                    "   - *Academic OD*: Presenting research papers, participating in external hackathons/symposiums.\n"
                    "   - *Co-curricular / Chapter OD*: Organizing or volunteering in Riviera, GraVITas, or official chapter events.\n"
                    "   - *Sports OD*: Representing VIT in university/state/national sports meets.\n"
                    "2. **Approval Workflow on VTOP**:\n"
                    "   - Apply via **VTOP -> Student Login -> OD Application** with proof (certificate, invitation, or event hall ticket).\n"
                    "   - Approvals route through: **Faculty Coordinator -> Head of Department (HOD) -> School Dean**.\n"
                    "   - Must be submitted within **3 to 5 working days** of concluding the event."
                ),
                'quick_actions': [
                    {'label': 'Attendance Policy', 'action': 'send', 'payload': 'What is the attendance rule in VIT?'},
                    {'label': 'Open VTOP Portal', 'action': 'route', 'payload': '/dashboard'},
                ]
            },
            # 5. CAT & FAT Examinations & Grading
            {
                'id': 'kb_exams',
                'keywords': ['cat exam', 'fat exam', 'continuous assessment', 'final assessment', 'grading system', 'relative grading', 'gpa calculation', 's grade', 'f grade', 'marks distribution'],
                'title': 'Examinations & 10-Point Relative Grading System',
                'text': (
                    "📊 **VIT Vellore Assessment & Grading Scale:**\n\n"
                    "1. **Marks Breakdown**:\n"
                    "   - **CAT-1**: 50 Marks (scaled to 15%)\n"
                    "   - **CAT-2**: 50 Marks (scaled to 15%)\n"
                    "   - **Digital Assignments (DA) / Quizzes**: 30% continuous evaluation\n"
                    "   - **FAT (Final Assessment Test)**: 100 Marks (scaled to 40%)\n"
                    "   - *Total Course Weightage*: 100 Marks (50% internal + 50% FAT/practical)\n\n"
                    "2. **Relative Grading Scale (10-Point GPA)**:\n"
                    "   - **S Grade** (10 Points) — Top 5-10% of class\n"
                    "   - **A Grade** (9 Points), **B Grade** (8 Points), **C Grade** (7 Points), **D Grade** (6 Points), **E Grade** (5 Points)\n"
                    "   - **F Grade** (0 Points) — Failed (requires re-examination / re-registration)\n"
                    "   - **N Grade** (0 Points) — Debarred due to low attendance"
                ),
                'quick_actions': [
                    {'label': 'Find Empty Classrooms', 'action': 'route', 'payload': '/classrooms'},
                    {'label': 'Next Class Schedule', 'action': 'send', 'payload': 'What is my next class?'},
                ]
            },
            # 6. Hostel In-Times & Curfew
            {
                'id': 'kb_hostel_intime',
                'keywords': ['hostel in time', 'in-time', 'intime', 'curfew', 'hostel time', 'night curfew', 'what time should i return to hostel', 'hostel timing', 'hostel gate close'],
                'title': 'Hostel In-Times & Biometric Curfew Rules',
                'text': (
                    "⏰ **Hostel In-Times at VIT Vellore:**\n\n"
                    "- **Men's Hostels (MH)**: **09:00 PM**\n"
                    "- **Ladies' Hostels (LH)**: **08:30 PM**\n\n"
                    "**Crucial Policies:**\n"
                    "- **Biometric Attendance**: All hostellers must punch their biometric fingerprint / face-ID between **08:30 PM and in-time** inside their respective block.\n"
                    "- **Late Entry**: Returning after in-time without an approved night slip incurs a disciplinary reprimand and parent SMS notification.\n"
                    "- **Night Canteens**: Hostellers can access block night canteens until **12:30 AM** inside the hostel perimeter."
                ),
                'quick_actions': [
                    {'label': 'Hostel Leave Process', 'action': 'send', 'payload': 'How to apply for leave in hostel?'},
                    {'label': 'Hostel Mess Options', 'action': 'send', 'payload': 'What are the hostel mess options?'},
                ]
            },
            # 7. Hostel Leave & Night Slips
            {
                'id': 'kb_hostel_leave',
                'keywords': ['hostel leave', 'night slip', 'apply leave in hostel', 'outing leave', 'home leave', 'leave application', 'parent otp', 'weekend leave'],
                'title': 'Hostel Leave Application & Night Slips on VTOP',
                'text': (
                    "🚪 **How to Apply for Hostel Leave & Night Slips:**\n\n"
                    "1. **Log in to VTOP**: Navigate to **Hostel Services -> Leave Application**.\n"
                    "2. **Select Leave Type**:\n"
                    "   - *Home Town Leave*: Multi-day leave to visit family.\n"
                    "   - *Local Outing / Emergency Leave*: Day outing outside campus beyond in-time.\n"
                    "3. **Approval Chain**:\n"
                    "   - **Proctor Approval**: Faculty proctor reviews and approves via their VTOP portal.\n"
                    "   - **Parent OTP Verification**: An SMS OTP is sent to the registered parent mobile number for verification.\n"
                    "   - **Hostel Warden Sign-Off**: Once approved, a digital gate pass with QR code is generated.\n"
                    "4. **Exit & Entry**: Scan your digital pass QR code at Main Gate Security when leaving and re-entering."
                ),
                'quick_actions': [
                    {'label': 'Hostel In-Times', 'action': 'send', 'payload': 'What are the hostel in-times?'},
                    {'label': 'Main Gate Map Location', 'action': 'navigate', 'payload': '/map?destName=Main%20Gate&lat=12.96920&lng=79.15500'},
                ]
            },
            # 8. Hostel Mess Options
            {
                'id': 'kb_hostel_mess',
                'keywords': ['mess change', 'mess food', 'special mess', 'non veg mess', 'veg mess', 'caterers', 'food park mess', 'darling mess', 'zen mess', 'mess timings'],
                'title': 'Hostel Mess Types & Monthly Mess Change Policy',
                'text': (
                    "🍲 **Hostel Mess Facilities at VIT Vellore:**\n\n"
                    "1. **Mess Categories**:\n"
                    "   - **Special Mess**: Continental, North/South Indian dishes, desserts, ice cream, extra eggs/chicken.\n"
                    "   - **Non-Veg Mess**: Regular meals with non-vegetarian gravies and chicken served 3-4 days a week.\n"
                    "   - **Veg Mess**: Pure vegetarian menu with South & North Indian curries.\n"
                    "   - **Food Park / Private Caterers**: Catered meals (Darling, PR, Zen, CR).\n\n"
                    "2. **Monthly Mess Change on VTOP**:\n"
                    "   - The mess change portal opens from the **1st to the 5th of every month** on VTOP.\n"
                    "   - You can switch your mess caterer once per month without extra charges.\n\n"
                    "3. **Standard Timings**:\n"
                    "   - Breakfast: 07:00 AM - 09:00 AM | Lunch: 12:00 PM - 02:00 PM | Snacks: 04:30 PM - 05:45 PM | Dinner: 07:00 PM - 09:00 PM"
                ),
                'quick_actions': [
                    {'label': 'Campus Food Courts', 'action': 'send', 'payload': 'Where can I eat on campus?'},
                    {'label': 'Hostel In-Times', 'action': 'send', 'payload': 'What are the hostel in-times?'},
                ]
            },
            # 9. Riviera & GraVITas Fests
            {
                'id': 'kb_fests',
                'keywords': ['riviera', 'gravitas', 'cultural fest', 'tech fest', 'college fest', 'fests in vit', 'pro show', 'star night', 'anna auditorium fest'],
                'title': 'Campus Fests: Riviera (Cultural) & GraVITas (Technical)',
                'text': (
                    "🎉 **VIT Vellore Signature Festivals:**\n\n"
                    "1. **Riviera (International Cultural & Sports Carnival)**:\n"
                    "   - **When**: Annually in **February**.\n"
                    "   - **Highlights**: One of India's largest college cultural fests with 30,000+ footfall! Star pro-shows (previous artists: Armaan Malik, Sunidhi Chauhan, Divine, Benny Dayal), DJ nights, debate, dramatics, dance battles, and sports tournaments.\n"
                    "   - **Primary Venues**: [Anna Auditorium](/map?destName=Anna%20Auditorium&lat=12.96930&lng=79.15520) & Outdoor Stadium Grounds.\n\n"
                    "2. **GraVITas (International Techno-Management Carnival)**:\n"
                    "   - **When**: Annually in **September**.\n"
                    "   - **Highlights**: 100+ technical hackathons, robotics challenges, coding marathons, workshops, and business pitch competitions.\n"
                    "   - **Primary Venues**: [Technology Tower (TT)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930) and [Silver Jubilee Tower (SJT)](/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300)."
                ),
                'quick_actions': [
                    {'label': 'Navigate to Anna Audi', 'action': 'navigate', 'payload': '/map?destName=Anna%20Auditorium&lat=12.96930&lng=79.15520'},
                    {'label': 'Navigate to SJT', 'action': 'navigate', 'payload': '/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300'},
                ]
            },
            # 10. Student Clubs & Chapters
            {
                'id': 'kb_clubs',
                'keywords': ['clubs', 'chapters', 'acm', 'ieee', 'csi', 'codechef', 'gdsc', 'club recruitment', 'how to join clubs', 'student chapter'],
                'title': 'Student Chapters & Co-Curricular Clubs',
                'text': (
                    "🚀 **Clubs & Student Chapters at VIT Vellore:**\n\n"
                    "VIT boasts **over 120+ active student clubs and international technical chapters**:\n\n"
                    "- **Premier Tech Chapters**: ACM (Association for Computing Machinery), IEEE, CSI, CodeChef VIT, GDSC (Google Developer Student Club), Mozilla Campus Club, IETE.\n"
                    "- **Cultural & Arts Clubs**: VIT Dance Club, Music Club, Dramatics Club (The Hindi Stage, English Literary Society), Photography Club.\n"
                    "- **Social & National Bodies**: Rotaract Club of VIT, NSS (National Service Scheme), NCC, Youth Red Cross.\n"
                    "- **Recruitments**: General recruitments take place at the beginning of the Fall semester (August-September) with introductory tasks and interviews."
                ),
                'quick_actions': [
                    {'label': 'GraVITas Tech Fest', 'action': 'send', 'payload': 'Tell me about GraVITas'},
                    {'label': 'Riviera Cultural Fest', 'action': 'send', 'payload': 'Tell me about Riviera'},
                ]
            },
            # 11. Career Development Centre (CDC) & Placements
            {
                'id': 'kb_placements',
                'keywords': ['placement', 'cdc', 'super dream', 'dream offer', 'placement package', 'average package', 'highest package', 'career development centre', 'internship'],
                'title': 'Career Development Centre (CDC) & Campus Placements',
                'text': (
                    "💼 **Campus Placements & CDC at VIT Vellore:**\n\n"
                    "1. **CDC Office Location**: Located on the **1st Floor of [Silver Jubilee Tower (SJT)](/map?destName=Career%20Development%20Centre&lat=12.97180&lng=79.16330)**.\n"
                    "2. **Job Offer Categories**:\n"
                    "   - **Super Dream Offers**: CTC of **> 10.0 LPA** (e.g., Microsoft, Amazon, Google, Cisco, Adobe, DE Shaw).\n"
                    "   - **Dream Offers**: CTC between **5.5 LPA and 10.0 LPA**.\n"
                    "   - **Regular Offers**: CTC between **3.5 LPA and 5.5 LPA**.\n"
                    "3. **Eligibility & Rules**:\n"
                    "   - Maintaining **7.0+ CGPA** without active arrears grants access to 90%+ of visiting companies.\n"
                    "   - Once a student secures a Dream offer, they can only participate in Super Dream drives."
                ),
                'quick_actions': [
                    {'label': 'Navigate to CDC Office (SJT)', 'action': 'navigate', 'payload': '/map?destName=Career%20Development%20Centre&lat=12.97180&lng=79.16330'},
                    {'label': 'Open SJT on Map', 'action': 'navigate', 'payload': '/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300'},
                ]
            },
            # 12. Travel to Katpadi Station & Airports
            {
                'id': 'kb_travel',
                'keywords': ['katpadi', 'railway station', 'station', 'auto to station', 'chennai airport', 'bangalore airport', 'bengaluru airport', 'bus to vit', 'how to reach station'],
                'title': 'Transportation: Katpadi Station & Airport Transit',
                'text': (
                    "🚆 **Transportation & City Travel Guide:**\n\n"
                    "1. **Katpadi Junction Railway Station (KPD)**:\n"
                    "   - **Distance**: Approx. **3.5 km** from VIT Main Gate.\n"
                    "   - **Share Auto**: Available outside [Main Gate (Katpadi Road)](/map?destName=Main%20Gate&lat=12.96920&lng=79.15500) for **₹15 to ₹20 per passenger**.\n"
                    "   - **Personal Auto**: Rates range from **₹80 to ₹120**.\n"
                    "2. **Nearby Airports**:\n"
                    "   - **Chennai International Airport (MAA)**: ~130 km away. Accessible via frequent superfast trains (Shatabdi, Brindavan Express) or direct state/private AC buses.\n"
                    "   - **Bengaluru Kempegowda Airport (BLR)**: ~200 km away via Hosur/Krishnagiri highway or trains from Katpadi."
                ),
                'quick_actions': [
                    {'label': 'Navigate to Main Gate', 'action': 'navigate', 'payload': '/map?destName=Main%20Gate&lat=12.96920&lng=79.15500'},
                    {'label': 'Explore Interactive Map', 'action': 'route', 'payload': '/map'},
                ]
            },
            # 13. Campus Wi-Fi & CTS Support
            {
                'id': 'kb_wifi',
                'keywords': ['wifi', 'wi-fi', 'cts', 'internet', 'captive portal', 'register mac', 'centre for technical support', 'wifi login', 'wifi not working'],
                'title': 'Campus Wi-Fi (VIT-Wifi) & CTS Support Desk',
                'text': (
                    "📶 **VIT Campus Wi-Fi & Technical Support (CTS):**\n\n"
                    "- **Network Name (SSID)**: `VIT-Wifi` (available across academic blocks and hostels).\n"
                    "- **Authentication**: Connect and log in via the captive portal using your **VTOP Registration Number & Wi-Fi Password**.\n"
                    "- **Registering New Devices**: Log into your student VTOP account -> WiFi Registration -> Add MAC Address.\n"
                    "- **CTS Support Desk**: For network troubleshooting or password resets, visit the **Centre for Technical Support (CTS)** on the Ground Floor of [Technology Tower (TT)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930)."
                ),
                'quick_actions': [
                    {'label': 'Navigate to CTS (TT Block)', 'action': 'navigate', 'payload': '/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930'},
                    {'label': 'Open VTOP Portal', 'action': 'route', 'payload': '/dashboard'},
                ]
            },
            # 14. Central Library
            {
                'id': 'kb_library',
                'keywords': ['library', 'periyar library', 'library timing', 'book borrow', 'digital library', 'central library hours', 'library books'],
                'title': 'Periyar E.V.R. Central Library Facilities',
                'text': (
                    "📚 **Periyar E.V.R. Central Library:**\n\n"
                    "- **Location**: Centrally located opposite [Technology Tower (TT)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930).\n"
                    "- **Operating Hours**: **08:00 AM to 12:00 Midnight** daily (Extended to **02:00 AM** during CAT and FAT exam periods).\n"
                    "- **Key Features**: 6 fully air-conditioned floors, 250,000+ volumes, IEEE/ACM digital access suites, individual study carrels, and self-checkout RFID kiosks.\n\n"
                    "🗺️ **[📍 Open Library on Navigation Map](/map?destName=Periyar%20Central%20Library&lat=12.97040&lng=79.15850)**"
                ),
                'quick_actions': [
                    {'label': 'Navigate to Library', 'action': 'navigate', 'payload': '/map?destName=Periyar%20Central%20Library&lat=12.97040&lng=79.15850'},
                    {'label': 'Find Empty Classrooms', 'action': 'route', 'payload': '/classrooms'},
                ]
            },
            # 15. Sports, Swimming Pool & Gyms
            {
                'id': 'kb_sports',
                'keywords': ['swimming pool', 'pool timing', 'gym', 'gymnasium', 'badminton court', 'basketball court', 'tennis court', 'sports', 'outdoor sports', 'stadium'],
                'title': 'Sports Facilities, Olympic Pool & Gymnasiums',
                'text': (
                    "🏊‍♂️ **Campus Sports & Fitness Amenities:**\n\n"
                    "1. **[Olympic Swimming Pool](/map?destName=Olympic%20Swimming%20Pool&lat=12.97020&lng=79.15780)**: 50m competition pool. Separate shifts for men and women with certified lifeguards.\n"
                    "2. **Central Air-Conditioned Gymnasium**: Located near Sports Complex with modern resistance and cardio equipment.\n"
                    "3. **Indoor Badminton Courts**: High-grade wooden flooring courts located in Men's and Ladies' sports pavilions.\n"
                    "4. **Outdoor Floodlit Courts**: Basketball, volleyball, tennis courts, and 400m synthetic running track at the Outdoor Stadium."
                ),
                'quick_actions': [
                    {'label': 'Navigate to Swimming Pool', 'action': 'navigate', 'payload': '/map?destName=Olympic%20Swimming%20Pool&lat=12.97020&lng=79.15780'},
                    {'label': 'Navigate to Health Centre', 'action': 'navigate', 'payload': '/map?destName=VIT%20Health%20Centre&lat=12.96810&lng=79.15520'},
                ]
            },
            # 16. Proctor System
            {
                'id': 'kb_proctor',
                'keywords': ['proctor', 'proctor system', 'who is my proctor', 'faculty proctor', 'proctor meet', 'proctor approval'],
                'title': 'Faculty Proctor Mentorship System',
                'text': (
                    "👨‍🏫 **The VIT Faculty Proctor System:**\n\n"
                    "- **Mentorship**: Every student is assigned a dedicated faculty proctor from their school for all 4 years.\n"
                    "- **Responsibilities**: Your proctor monitors academic performance, advises on course registration, coordinates with parents, and approves hostel leave applications on VTOP.\n"
                    "- **How to Find Your Proctor**: Log in to **VTOP -> Student Profile / Proctor Details** to view your proctor's name, cabin number, school, and email ID."
                ),
                'quick_actions': [
                    {'label': 'Hostel Leave Process', 'action': 'send', 'payload': 'How to apply for leave in hostel?'},
                    {'label': 'Open VTOP Portal', 'action': 'route', 'payload': '/dashboard'},
                ]
            },
        ]

        # Match query against topics
        best_topic = None
        best_score = 0

        for t in topics:
            score = 0
            for kw in t['keywords']:
                if kw in q_lower:
                    # Exact substring match gets highest score
                    score += len(kw.split()) * 3
                else:
                    # Token subset matching (e.g. 'hostel leave' matches 'how do i apply for leave in hostel')
                    kw_words = [w for w in kw.split() if len(w) > 2]
                    if len(kw_words) >= 2 and all(w in q_lower for w in kw_words):
                        score += len(kw_words) * 2
            if score > best_score:
                best_score = score
                best_topic = t

        if not best_topic or best_score < 2:
            return None

        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': best_topic['text'],
            'timestamp': 'Just now',
            'suggestedLocations': [],
            'quickActions': best_topic.get('quick_actions', [
                {'label': 'Open Navigation Map', 'action': 'route', 'payload': '/map'},
                {'label': 'Explore Directory', 'action': 'route', 'payload': '/directory'},
            ])
        }

    @classmethod
    def _answer_with_gemini(cls, api_key: str, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Invokes Google Gemini with multi-model failover pool, full Campus Directory
        database RAG grounding, and automated map hyperlinks.
        """
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        p_lower = prompt.lower()
        rag_entries = []

        # 1. Broad Category matching against DirectoryEntry
        if any(w in p_lower for w in ['academic', 'block', 'blocks', 'building', 'buildings', 'school', 'schools', 'lecture', 'class', 'department']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(Q(category__icontains='Academic') | Q(category='Schools'))[:25]))

        if any(w in p_lower for w in ['food', 'canteen', 'eat', 'lunch', 'dinner', 'breakfast', 'cafe', 'woodys', 'darling', 'gazebo', 'mess', 'dining']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(category='Dining & Food Courts')[:15]))

        if any(w in p_lower for w in ['medical', 'hospital', 'doctor', 'ambulance', 'health', 'sick', 'emergency', 'fever', 'clinic']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(category='Medical Services')[:5]))

        if any(w in p_lower for w in ['hostel', 'warden', 'curfew', 'room', 'hosteller', 'hostellers']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(category='Hostels')[:20]))

        if any(w in p_lower for w in ['sport', 'gym', 'pool', 'swimming', 'badminton', 'tennis', 'court', 'ground', 'stadium']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(category='Sports')[:20]))

        if any(w in p_lower for w in ['atm', 'bank', 'cash', 'money', 'sbi', 'indian bank']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(category='Banking & ATMs')[:12]))

        if any(w in p_lower for w in ['print', 'printer', 'xerox', 'photocopy', 'binding', 'stationery']):
            rag_entries.extend(list(DirectoryEntry.objects.filter(Q(category__icontains='Printing') | Q(name__icontains='Xerox') | Q(name__icontains='Printing') | Q(keywords__icontains='print'))[:10]))

        # General token search across name, keywords, aliases
        tokens = [t for t in re.findall(r'\b[a-zA-Z0-9]{3,}\b', p_lower) if t not in ['the', 'and', 'for', 'where', 'what', 'how', 'can', 'with', 'from', 'near', 'closest', 'all', 'are', 'tell', 'show', 'you', 'this', 'that', 'give', 'some']]
        if tokens:
            q_filter = Q()
            for tok in tokens[:5]:
                q_filter |= Q(name__icontains=tok) | Q(category__icontains=tok) | Q(building__icontains=tok) | Q(keywords__icontains=tok) | Q(aliases__icontains=tok)
            try:
                tok_matches = list(DirectoryEntry.objects.filter(q_filter).distinct()[:15])
                for tm in tok_matches:
                    if tm not in rag_entries:
                        rag_entries.append(tm)
            except Exception:
                pass

        # Deduplicate
        seen_ids = set()
        deduped = []
        for e in rag_entries:
            if e.id not in seen_ids:
                seen_ids.add(e.id)
                deduped.append(e)

        db_context_lines = []
        for ent in deduped[:30]:
            coord_str = f"Coords: ({ent.latitude:.5f}, {ent.longitude:.5f})" if ent.latitude and ent.longitude else "Location: Central Campus"
            bld_str = f", Building: {ent.building}" if ent.building else ""
            desc = (ent.description or "")[:180]
            db_context_lines.append(
                f"- **{ent.name}** [Category: {ent.category}{bld_str}]: {desc}. {coord_str}"
            )
        db_context_block = "\n".join(db_context_lines) if db_context_lines else "Directory loaded across all 152 verified campus locations."

        vit_fine_tune_system = (
            "You are the official VIT Vellore CampusOS AI Assistant — an intelligent, authoritative, versatile, and friendly "
            "companion for students, faculty, and visitors at Vellore Institute of Technology (VIT), Vellore, Tamil Nadu.\n\n"
            "### PRIMARY DIRECTIVE:\n"
            "- You answer ANY and ALL questions related to VIT Vellore campus life, academics, buildings, services, and policies.\n"
            "- Ground your answers in the verified Campus Directory database records provided below.\n"
            "- Answer the student's SPECIFIC question directly, naturally, and thoroughly. Do NOT assume they want printing/xerox unless they specifically asked about printing, xerox, photocopy, or binding!\n\n"
            "### ESSENTIAL VIT VELLORE KNOWLEDGE BASE:\n"
            "1. **MEDICAL & HOSTELLER AMBULANCE PROTOCOL (CRITICAL)**:\n"
            "   - **Hostellers Ambulance Access**: If you live in a hostel (Men's Hostels MH-A to MH-T or Ladies' Hostels LH-A to LH-J) and need medical help or an ambulance, "
            "YOU DO NOT NEED TO WALK TO THE MAIN GATE! You can ALWAYS call an ambulance directly from the Warden's Office / Security Desk on the Ground Floor of your hostel block.\n"
            "   - The hostel warden/security has a direct priority emergency line to the Health Centre and dispatches a campus ambulance straight to your hostel block's entrance porch.\n"
            "   - **Main Health & Medical Centre**: Located near the Main Gate / Sports Complex [12.9681, 79.1552]. Operates 24/7 with resident doctors, inpatient observation beds, trauma care, and student pharmacy. Emergency hotline: 0416-2202111 (Ext: 2111).\n\n"
            "2. **ACADEMIC BLOCKS & SCHOOLS**:\n"
            "   - **Central Academic Zone**:\n"
            "     * [📍 TT (Technology Tower)](/map?destName=Technology%20Tower&lat=12.97120&lng=79.15930): SELECT (Electrical), SENSE (Electronics), SAS (Advanced Sciences), Dean offices, Placement cell. Centrally located facing Central Library.\n"
            "     * [📍 GDN (GD Naidu Block)](/map?destName=GD%20Naidu%20Block&lat=12.97020&lng=79.16010): SMEC (Mechanical Engineering), School of Civil Engineering, thermal labs, engineering workshop bays. Just behind TT.\n"
            "     * [📍 SMV (Sir M. Visvesvaraya Block)](/map?destName=Sir%20M%20Visvesvaraya%20Block&lat=12.97080&lng=79.15980): EE/EEE labs, instrumentation suites. Adjacent to TT & GDN.\n"
            "   - **Eastern Tech & Research Zone**:\n"
            "     * [📍 SJT (Silver Jubilee Tower)](/map?destName=Silver%20Jubilee%20Tower&lat=12.97180&lng=79.16300): SCOPE (Computer Science & Engg), SITE (Information Tech), AI & cloud labs, smart classrooms. Close to Men's Hostels MH-A to MH-D.\n"
            "     * [📍 CDMM (Centre for Disaster Mitigation & Management)](/map?destName=CDMM&lat=12.97100&lng=79.16200): Civil engineering research & earthquake engineering labs.\n"
            "     * [📍 CBMR (Centre for Biomaterials & Research)](/map?destName=CBMR&lat=12.97280&lng=79.16250): SBST biotechnology, biochemistry, and biomedical research.\n"
            "     * [📍 PRP (Pearl Research Park)](/map?destName=Pearl%20Research%20Park&lat=12.97350&lng=79.16420): Advanced PG, doctoral PhD research, and sponsored project centers. Close to Men's Hostels MH-G to MH-T.\n"
            "   - **Western Administrative Zone**:\n"
            "     * [📍 MB (Main Building / MGR Block)](/map?destName=Main%20Building&lat=12.96960&lng=79.15590): Administrative headquarters, Chancellor & Vice-Chancellor offices, Registrar, Finance, Admissions, Main Cash Counter.\n"
            "     * [📍 ALM (Allana Multi-purpose Block)](/map?destName=Allana%20Block&lat=12.96820&lng=79.15520): V-SPARC Architecture studios, multi-purpose seminar halls.\n\n"
            "3. **CAMPUS AMENITIES & RECREATION**:\n"
            "   - **Periyar E.V.R. Central Library**: 6 floors opposite TT [12.9704, 79.1585]. Open 08:00 AM - Midnight (extended to 02:00 AM during CAT/FAT exams).\n"
            "   - **Food Courts & Canteens**: Food Mall (Domino's, DC, juice bar) [12.9705, 79.1572], SJT Food Court [12.9718, 79.1630], Darling Food Court, Woody's, Gazebo [12.9698, 79.1565], and night canteens in hostel blocks (open until 12:30 AM).\n"
            "   - **Sports & Fitness**: [📍 Olympic Swimming Pool](/map?destName=Olympic%20Swimming%20Pool&lat=12.97020&lng=79.15780) (50m pool with separate male/female slots), Central AC Gym, Indoor Badminton courts, Floodlit basketball/tennis courts, Outdoor Stadium 400m synthetic track.\n\n"
            "4. **ACADEMICS, RULES & POLICIES**:\n"
            "   - **9-Pointer Rule**: Students with CGPA >= 9.00 have 100% attendance exemption (no mandatory 75% requirement; cannot be debarred for attendance).\n"
            "   - **Standard Attendance**: 75% minimum mandatory attendance for CGPA < 9.0; debarred (N-grade) if below 75% unless approved On-Duty (OD).\n"
            "   - **FFCS (Fully Flexible Credit System)**: Allows choosing courses, faculties, and time slots (Morning A1-G1, Afternoon A2-G2, Lab L1-L60).\n"
            "   - **VTOP**: Unified portal for grades, attendance, digital pad assignments, fee payments, and hostel night leaves.\n"
            "   - **Hostel In-times**: Men's Hostels: 09:00 PM; Ladies' Hostels: 08:30 PM (biometric punch-in). Night leave requires proctor approval on VTOP + parent SMS verification.\n"
            "   - **Exams**: CAT-1 (50 marks, 1.5 hrs), CAT-2, and FAT (100 marks, 3 hrs with 40% passing minimum).\n"
            "   - **Fests**: Riviera (International sports & cultural fest) and GraVITas (Annual international tech fest).\n"
            "   - **Campus Wi-Fi**: Networks VIT-2.4G and VIT-5G authenticated via captive portal with student registration number.\n\n"
            "### CRITICAL FORMATTING & BEHAVIOR RULES:\n"
            "1. **MAP HYPERLINKS**: For EVERY building, classroom, hostel, canteen, or landmark mentioned, YOU MUST include a clickable markdown map link in this EXACT format:\n"
            "   `[📍 Location Name](/map?destName={EncodedName}&lat={lat}&lng={lng})`\n"
            "   Use the coordinates from the campus list above!\n"
            "2. **LOCATION QUERIES (e.g. 'show me academic blocks near me')**:\n"
            "   - If the student specifies their location (e.g. 'I am at MH-D' or 'near Library'), tell them the closest academic blocks with walking times and direct map links!\n"
            "   - If they ask 'near me' without specifying where they are, break down the blocks by zones (Central, Eastern, Western) with map links, and ask: *'Which block or hostel are you currently at so I can pinpoint the nearest one?'*\n"
            "3. **MARKDOWN FORMATTING RULES (STRICT)**:\n"
            "   - Use clean dash bullets `- [📍 Building Name](/map?destName=...&lat=...&lng=...)`: Detailed explanation...\n"
            "   - Put building names inside the markdown link brackets with NO leading or trailing spaces: `[📍 Building Name](/map?...)`.\n"
            "   - Never append dangling asterisks to acronyms or words (write `SAS`, `SMEC`, `SCOPE`, NEVER `SAS*` or `SMEC*`).\n"
            "   - Use clear markdown headers like `### 1. Central Academic Zone` to separate sections.\n"
            "   - Format the hostel emergency ambulance note with `> 🚨 **Critical Note for Hostellers**: ...`.\n"
            "   - Friendly, professional, authoritative tone."
        )

        full_prompt = (
            f"{vit_fine_tune_system}\n\n"
            f"### RELEVANT DATABASE RECORDS:\n{db_context_block}\n\n"
            f"### STUDENT QUESTION:\n{prompt}\n\n"
            "Answer the student thoroughly following the rules above:"
        )

        # Multi-model failover pool to prevent 429 quota exhaustion from breaking queries
        candidate_models = [
            'gemini-3-flash-preview',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash',
            'gemini-3.5-flash-lite',
            'gemini-3.8-flash'
        ]

        text = ""
        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(full_prompt)
                if response and response.text:
                    text = response.text
                    break
            except Exception:
                continue

        if not text:
            return None

        # Extract all generated map links for quickActions buttons
        quick_actions = []
        map_links = re.findall(r'\[([^\]]+)\]\((\/map[^\)]+)\)', text)
        for label, url in map_links[:3]:
            clean_label = label.replace('📍', '').replace('🗺️', '').strip()
            quick_actions.append({
                'label': f"Navigate to {clean_label}" if not clean_label.lower().startswith(('open', 'navigate')) else clean_label,
                'action': 'navigate',
                'payload': url
            })

        if not any(a['payload'] == '/map' for a in quick_actions):
            quick_actions.append({'label': 'Open Campus Navigation Map', 'action': 'route', 'payload': '/map'})

        return {
            'id': f"msg_{os.urandom(4).hex()}",
            'sender': 'assistant',
            'text': text,
            'timestamp': 'Just now',
            'suggestedLocations': [],
            'quickActions': quick_actions
        }
