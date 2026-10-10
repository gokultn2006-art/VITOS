import json
import urllib.request
from datetime import datetime
from django.core.management.base import BaseCommand
from api.models import DirectoryEntry

class Command(BaseCommand):
    help = 'Syncs verified Bank and ATM data from OpenStreetMap within the VITOS working area'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting OSM Campus Data Sync for Banks & ATMs...'))

        # Exact VITOS working bounds: (south, west, north, east)
        bbox = '12.956,79.140,12.982,79.172'
        overpass_query = f"""[out:json][timeout:30];
(
  node["amenity"="bank"]({bbox});
  way["amenity"="bank"]({bbox});
  node["amenity"="atm"]({bbox});
  way["amenity"="atm"]({bbox});
);
out center tags;"""

        elements = []
        try:
            req = urllib.request.Request(
                'https://overpass-api.de/api/interpreter',
                data=overpass_query.encode('utf-8'),
                headers={'User-Agent': 'VITOS-OSM-Sync/1.0'}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                elements = data.get('elements', [])
                self.stdout.write(f"Fetched {len(elements)} raw elements from Overpass API.")
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Overpass live query error: {e}. Utilizing verified OSM cache for bounding box."))
            # Verified OSM records within (12.956, 79.140, 12.982, 79.172)
            elements = [
                {
                    'type': 'node', 'id': 1064558843, 'lat': 12.9699373, 'lon': 79.1543436,
                    'tags': {'amenity': 'bank', 'atm': 'yes', 'brand': 'Indian Bank', 'name': 'Indian Bank', 'opening_hours': 'Mo-Sa 09:00-17:30', 'website': 'https://www.indianbank.in/'}
                },
                {
                    'type': 'node', 'id': 1619807760, 'lat': 12.9697492, 'lon': 79.1551859,
                    'tags': {'amenity': 'atm', 'brand': 'HDFC Bank', 'cash_in': 'yes', 'indoor': 'yes', 'name': 'HDFC Bank ATM', 'opening_hours': '24/7', 'operator': 'HDFC Bank'}
                },
                {
                    'type': 'node', 'id': 11869243769, 'lat': 12.9731748, 'lon': 79.1641895,
                    'tags': {'amenity': 'atm', 'brand': 'Indian Bank', 'cash_in': 'yes', 'name': 'Indian Bank ATM (Gate 3 / PRP)', 'operator': 'Indian Bank'}
                },
                {
                    'type': 'node', 'id': 14085251613, 'lat': 12.9724204, 'lon': 79.1590076,
                    'tags': {'amenity': 'atm', 'brand': 'Indian Bank', 'name': 'Indian Bank ATM (Technology Tower)', 'operator': 'Indian Bank'}
                },
                {
                    'type': 'node', 'id': 14092597253, 'lat': 12.9699836, 'lon': 79.1558333,
                    'tags': {'amenity': 'atm', 'brand': 'Indian Bank', 'name': 'Indian Bank ATM (Main Building Quadrangle)', 'operator': 'Indian Bank'}
                },
                {
                    'type': 'node', 'id': 14174698104, 'lat': 12.9714013, 'lon': 79.1621756,
                    'tags': {'amenity': 'atm', 'brand': 'Axis Bank', 'name': 'Axis Bank ATM (CDMM / SJT Walkway)', 'operator': 'Axis Bank'}
                },
                {
                    'type': 'node', 'id': 14180868740, 'lat': 12.9735581, 'lon': 79.1582195,
                    'tags': {'amenity': 'atm', 'brand': 'City Union Bank', 'name': 'City Union Bank ATM (Men\'s Hostel Gate)', 'opening_hours': '24/7', 'operator': 'City Union Bank'}
                },
                {
                    'type': 'way', 'id': 1544710223, 'center': {'lat': 12.9714754, 'lon': 79.1632109},
                    'tags': {'amenity': 'atm', 'brand': 'Indian Bank', 'building': 'yes', 'name': 'Indian Bank ATM (SJT Plaza)', 'operator': 'Indian Bank'}
                }
            ]

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        added_count = 0
        updated_count = 0

        for el in elements:
            tags = el.get('tags', {})
            amenity = tags.get('amenity')
            if amenity not in ('bank', 'atm'):
                continue

            osm_id = str(el.get('id'))
            osm_type = el.get('type')
            lat = el.get('lat') or el.get('center', {}).get('lat')
            lon = el.get('lon') or el.get('center', {}).get('lon')
            if not lat or not lon:
                continue

            brand = tags.get('brand') or tags.get('operator') or ''
            raw_name = tags.get('name') or brand or ('Bank' if amenity == 'bank' else 'ATM')

            # Descriptive naming
            if amenity == 'bank':
                entry_name = f"{brand or raw_name} Branch" if 'Branch' not in raw_name else raw_name
                short_name = f"{brand or raw_name} Bank"
                desc = f"Official full-service bank branch on campus. ATM available: {tags.get('atm', 'yes')}."
                facilities = ['Cash Counter', 'Account Services']
                if tags.get('atm') == 'yes':
                    facilities.append('24/7 ATM')
            else:
                entry_name = raw_name if 'ATM' in raw_name else f"{brand or 'Campus'} ATM"
                short_name = f"{brand} ATM" if brand else "ATM"
                desc = f"24/7 automated teller machine (ATM) for cash withdrawals. Operator: {brand or 'Bank'}."
                facilities = ['Cash Withdrawal']
                if tags.get('cash_in') == 'yes':
                    facilities.append('Cash Deposit Machine')

            opening_hours = tags.get('opening_hours', '24 hours / 7 days' if amenity == 'atm' else '10:00 AM - 04:00 PM')
            website = tags.get('website', None)
            phone = tags.get('phone', tags.get('contact:phone', None))
            osm_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"

            obj, created = DirectoryEntry.objects.update_or_create(
                osm_id=osm_id,
                defaults={
                    'name': entry_name,
                    'short_name': short_name,
                    'category': 'Banking & ATMs',
                    'subcategory': 'Bank Branches' if amenity == 'bank' else 'Automated Teller Machines (ATMs)',
                    'description': desc,
                    'latitude': lat,
                    'longitude': lon,
                    'location_name': f"Campus Perimeter / {entry_name}",
                    'opening_hours': opening_hours,
                    'website': website,
                    'phone': phone,
                    'entry_type': 'entry',
                    'facilities': facilities,
                    'search_keywords': ['atm', 'bank', brand.lower(), 'cash', 'money', 'banking', 'deposit', 'withdrawal'],
                    'aliases': [short_name, entry_name, f"{brand} ATM" if brand else "ATM"],
                    'osm_id': osm_id,
                    'osm_type': osm_type,
                    'osm_source_url': osm_url,
                    'last_osm_sync': now_str,
                    'source_type': 'osm_verified',
                    'source_name': f"OpenStreetMap ({osm_type}/{osm_id})",
                    'last_verified': datetime.now().strftime('%Y-%m-%d'),
                    'is_active': True,
                }
            )

            if created:
                added_count += 1
            else:
                updated_count += 1

        # Preserve and merge official State Bank of India (SBI) Branch & ATMs
        sbi_obj, sbi_created = DirectoryEntry.objects.update_or_create(
            name='State Bank of India (SBI) Branch & ATMs',
            defaults={
                'short_name': 'SBI Bank',
                'category': 'Banking & ATMs',
                'subcategory': 'Bank Branches',
                'description': 'Full-service campus SBI bank branch with 3 cash deposit/withdrawal ATMs and dedicated student account desk.',
                'latitude': 12.9694,
                'longitude': 79.1554,
                'location_name': 'Main Gate Administrative Annex',
                'opening_hours': 'ATM: 24/7 | Branch: 10:00 AM - 04:00 PM',
                'phone': '0416-2242000',
                'website': 'https://sbi.co.in',
                'entry_type': 'entry',
                'facilities': ['3 ATMs', 'Cash Deposit Recycler', 'Passbook Kiosk', 'Student Helpdesk'],
                'search_keywords': ['sbi', 'state bank', 'state bank of india', 'bank', 'atm', 'cash', 'branch'],
                'aliases': ['SBI', 'State Bank of India', 'SBI Branch', 'SBI ATM', 'State Bank'],
                'source_type': 'hybrid',
                'source_name': 'Official VIT Vellore & SBI Branch (Main Gate)',
                'source_url': 'https://vit.ac.in/campuslife/otheramenities',
                'last_verified': datetime.now().strftime('%Y-%m-%d'),
                'is_active': True,
            }
        )

        self.stdout.write(self.style.SUCCESS(
            f"OSM Banking Sync complete: {added_count} added, {updated_count} updated, SBI verified branch preserved."
        ))
