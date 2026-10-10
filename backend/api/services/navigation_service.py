import math
import heapq
import urllib.request
import json
from typing import Dict, List, Any, Optional
from api.models import CampusNode, CampusPath

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

DEFAULT_NODES = [
    {"code": "MAIN_GATE", "name": "Main Entrance Gate", "lat": 12.9685, "lng": 79.1560, "node_type": "entrance"},
    {"code": "LIBRARY_JUNCTION", "name": "Library Crossroads", "lat": 12.9700, "lng": 79.1580, "node_type": "junction"},
    {"code": "LIBRARY", "name": "Periyar Central Library", "lat": 12.9698, "lng": 79.1578, "node_type": "building"},
    {"code": "TT", "name": "Technology Tower (TT)", "lat": 12.9702, "lng": 79.1585, "node_type": "building"},
    {"code": "SMV", "name": "Sir M. Visvesvaraya Building (SMV)", "lat": 12.9692, "lng": 79.1559, "node_type": "building"},
    {"code": "NORTH_JUNCTION", "name": "North Campus Junction", "lat": 12.9710, "lng": 79.1610, "node_type": "junction"},
    {"code": "SJT_GATE", "name": "SJT Plaza Entrance", "lat": 12.9714, "lng": 79.1630, "node_type": "entrance"},
    {"code": "SJT", "name": "Silver Jubilee Tower (SJT)", "lat": 12.9716, "lng": 79.1634, "node_type": "building"},
    {"code": "MENS_HOSTEL", "name": "Men's Hostel Blocks", "lat": 12.9730, "lng": 79.1645, "node_type": "building"},
    {"code": "MB", "name": "Dr. M.G.R. Block (Main Building)", "lat": 12.9693, "lng": 79.1565, "node_type": "building"},
    {"code": "PRP", "name": "Pearl Research Park (PRP)", "lat": 12.9708, "lng": 79.1595, "node_type": "building"},
    {"code": "HEALTH_CENTRE", "name": "Campus Health Centre", "lat": 12.9705, "lng": 79.1622, "node_type": "building"},
    {"code": "FOOD_COURT", "name": "Food Court (Darling / FC)", "lat": 12.9705, "lng": 79.1590, "node_type": "building"},
]

DEFAULT_PATHS = [
    ("MAIN_GATE", "LIBRARY_JUNCTION", 300.0),
    ("MAIN_GATE", "MB", 150.0),
    ("MB", "SMV", 120.0),
    ("MB", "LIBRARY_JUNCTION", 180.0),
    ("LIBRARY_JUNCTION", "LIBRARY", 100.0),
    ("LIBRARY_JUNCTION", "TT", 120.0),
    ("LIBRARY_JUNCTION", "FOOD_COURT", 140.0),
    ("LIBRARY_JUNCTION", "PRP", 200.0),
    ("LIBRARY_JUNCTION", "SMV", 250.0),
    ("LIBRARY_JUNCTION", "NORTH_JUNCTION", 350.0),
    ("TT", "PRP", 130.0),
    ("PRP", "NORTH_JUNCTION", 190.0),
    ("NORTH_JUNCTION", "HEALTH_CENTRE", 160.0),
    ("NORTH_JUNCTION", "SJT_GATE", 200.0),
    ("NORTH_JUNCTION", "MENS_HOSTEL", 300.0),
    ("HEALTH_CENTRE", "SJT_GATE", 150.0),
    ("SJT_GATE", "SJT", 100.0),
    ("MENS_HOSTEL", "SJT_GATE", 400.0),
]

def seed_campus_graph_if_empty():
    created_nodes = {}
    for n in DEFAULT_NODES:
        node, _ = CampusNode.objects.get_or_create(code=n["code"], defaults=n)
        created_nodes[node.code] = node

    for from_code, to_code, dist in DEFAULT_PATHS:
        fn = created_nodes.get(from_code) or CampusNode.objects.filter(code=from_code).first()
        tn = created_nodes.get(to_code) or CampusNode.objects.filter(code=to_code).first()
        if fn and tn:
            CampusPath.objects.get_or_create(from_node=fn, to_node=tn, defaults={"distance_meters": dist, "walkable": True})
            CampusPath.objects.get_or_create(from_node=tn, to_node=fn, defaults={"distance_meters": dist, "walkable": True})

class NavigationService:
    @staticmethod
    def fetch_osrm_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float, mode: str = 'walking') -> Optional[Dict[str, Any]]:
        """Queries OpenStreetMap routing engines for real campus footways or roadways."""
        is_walking = mode == 'walking'
        start_pt = f"{from_lng:.6f},{from_lat:.6f}"
        end_pt = f"{to_lng:.6f},{to_lat:.6f}"

        # Dedicated OpenStreetMap foot/car routing engines:
        # routed-foot routes pedestrians through campus walkable paths, footways, and subways
        # routed-car routes vehicles along campus vehicular roadways
        candidate_urls = [
            f"https://routing.openstreetmap.de/routed-foot/route/v1/driving/{start_pt};{end_pt}?overview=full&geometries=geojson&steps=true" if is_walking
            else f"https://routing.openstreetmap.de/routed-car/route/v1/driving/{start_pt};{end_pt}?overview=full&geometries=geojson&steps=true",
            f"https://router.project-osrm.org/route/v1/{'foot' if is_walking else 'car'}/{start_pt};{end_pt}?overview=full&geometries=geojson&steps=true"
        ]

        for url in candidate_urls:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'VITOS-App/1.0'})
                with urllib.request.urlopen(req, timeout=4.0) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    if data.get('code') == 'Ok' and data.get('routes'):
                        route = data['routes'][0]
                        geojson_coords = route['geometry']['coordinates']
                        # GeoJSON provides [lng, lat]; Leaflet expects [lat, lng]
                        leaflet_coords = [[pt[1], pt[0]] for pt in geojson_coords]
                        dist_meters = round(route['distance'], 1)
                        # Realistic duration based on mode
                        if is_walking:
                            duration_sec = route.get('duration', dist_meters / 1.25)
                        else:
                            duration_sec = route.get('duration', dist_meters / 7.0)
                        est_minutes = max(1, round(duration_sec / 60))

                        steps = []
                        for leg in route.get('legs', []):
                            for step in leg.get('steps', []):
                                maneuver = step.get('maneuver', {})
                                mtype = maneuver.get('type', 'step')
                                modifier = maneuver.get('modifier', '')
                                step_dist = round(step.get('distance', 0), 1)
                                step_name = step.get('name') or ''

                                if mtype == 'depart':
                                    instruction = f"Head {modifier or 'forward'} from start" + (f" onto {step_name}" if step_name else "")
                                elif mtype == 'arrive':
                                    instruction = "Arrive at destination" + (f" on {step_name}" if step_name else "")
                                elif mtype in ('turn', 'end of road'):
                                    instruction = f"Turn {modifier}" + (f" onto {step_name}" if step_name else "")
                                elif mtype == 'continue':
                                    instruction = f"Continue {modifier or 'straight'}" + (f" on {step_name}" if step_name else "")
                                else:
                                    instruction = f"{mtype.capitalize()} {modifier}".strip() + (f" on {step_name}" if step_name else "")

                                steps.append({
                                    'instruction': instruction,
                                    'distanceMeters': step_dist,
                                    'durationSeconds': round(step.get('duration', 0)),
                                    'type': mtype,
                                    'modifier': modifier
                                })

                        return {
                            'distanceMeters': dist_meters,
                            'estimatedMinutes': est_minutes,
                            'coordinates': leaflet_coords,
                            'steps': steps,
                            'engine': 'osrm-osm'
                        }
            except Exception:
                continue

        return None

    @classmethod
    def calculate_route(
        cls,
        source_code: str = '',
        destination_code: str = '',
        from_lat: Optional[float] = None,
        from_lng: Optional[float] = None,
        to_lat: Optional[float] = None,
        to_lng: Optional[float] = None,
        mode: str = 'walking'
    ) -> Dict[str, Any]:
        seed_campus_graph_if_empty()

        # 1. Coordinate-first resolution
        if from_lat is not None and from_lng is not None and to_lat is not None and to_lng is not None:
            # Try OpenStreetMap real-world routing
            osrm_res = cls.fetch_osrm_route(from_lat, from_lng, to_lat, to_lng, mode=mode)
            if osrm_res:
                return {
                    "source": source_code or "Start Point",
                    "destination": destination_code or "Destination Point",
                    "distanceMeters": osrm_res['distanceMeters'],
                    "estimatedMinutes": osrm_res['estimatedMinutes'],
                    "mode": mode,
                    "engine": "osrm-osm",
                    "coordinates": osrm_res['coordinates'],
                    "steps": osrm_res['steps'],
                    "path": [source_code or "START", destination_code or "DEST"]
                }

        # 2. Campus node mapping
        target_dest_code = (destination_code or 'SJT').upper()
        if target_dest_code.startswith("SJT"):
            target_dest_code = "SJT"
        elif target_dest_code.startswith("TT"):
            target_dest_code = "TT"
        elif target_dest_code.startswith("SMV"):
            target_dest_code = "SMV"
        elif target_dest_code.startswith("MB"):
            target_dest_code = "MB"
        elif target_dest_code.startswith("PRP"):
            target_dest_code = "PRP"

        source_node = None
        if source_code:
            source_node = CampusNode.objects.filter(code__iexact=source_code).first()

        dest_node = None
        if target_dest_code:
            dest_node = (
                CampusNode.objects.filter(code__iexact=target_dest_code).first()
                or CampusNode.objects.filter(code__icontains=target_dest_code).first()
            )

        # Nearest node fallback if coordinates exist but no code
        if not source_node and from_lat is not None and from_lng is not None:
            source_node = min(
                CampusNode.objects.all(),
                key=lambda n: haversine(from_lat, from_lng, n.lat, n.lng),
                default=None
            )

        if not dest_node and to_lat is not None and to_lng is not None:
            dest_node = min(
                CampusNode.objects.all(),
                key=lambda n: haversine(to_lat, to_lng, n.lat, n.lng),
                default=None
            )

        if not source_node:
            source_node = CampusNode.objects.filter(code="MENS_HOSTEL").first() or CampusNode.objects.first()

        if not dest_node:
            dest_node = CampusNode.objects.filter(code="SJT").first() or CampusNode.objects.last()

        # If coordinates were not given, grab from nodes
        s_lat = from_lat if from_lat is not None else (source_node.lat if source_node else 12.9730)
        s_lng = from_lng if from_lng is not None else (source_node.lng if source_node else 79.1645)
        d_lat = to_lat if to_lat is not None else (dest_node.lat if dest_node else 12.9716)
        d_lng = to_lng if to_lng is not None else (dest_node.lng if dest_node else 79.1634)

        # Try OSRM route between resolved coordinates
        osrm_res = cls.fetch_osrm_route(s_lat, s_lng, d_lat, d_lng, mode=mode)
        if osrm_res:
            return {
                "source": source_node.code if source_node else "START",
                "destination": destination_code or (dest_node.code if dest_node else "DEST"),
                "distanceMeters": osrm_res['distanceMeters'],
                "estimatedMinutes": osrm_res['estimatedMinutes'],
                "mode": mode,
                "engine": "osrm-osm",
                "coordinates": osrm_res['coordinates'],
                "steps": osrm_res['steps'],
                "path": [source_node.code if source_node else "START", dest_node.code if dest_node else "DEST"]
            }

        if source_node == dest_node:
            return {
                "source": source_node.code,
                "destination": dest_node.code,
                "distanceMeters": 0,
                "estimatedMinutes": 0,
                "path": [source_node.code],
                "coordinates": [[source_node.lat, source_node.lng]],
                "steps": [{"instruction": f"You are already at {source_node.name}.", "distanceMeters": 0}],
                "engine": "campus-dijkstra",
                "nodes": [{"code": source_node.code, "name": source_node.name, "lat": source_node.lat, "lng": source_node.lng}]
            }

        # Dijkstra algorithm across campus graph
        all_nodes = {n.code: n for n in CampusNode.objects.all()}
        all_paths = CampusPath.objects.filter(walkable=True)

        graph: Dict[str, List[tuple]] = {code: [] for code in all_nodes}
        for path in all_paths:
            graph[path.from_node.code].append((path.to_node.code, path.distance_meters))

        distances: Dict[str, float] = {code: float('inf') for code in all_nodes}
        previous: Dict[str, Optional[str]] = {code: None for code in all_nodes}
        distances[source_node.code] = 0.0

        pq = [(0.0, source_node.code)]

        while pq:
            current_dist, current_code = heapq.heappop(pq)
            if current_dist > distances[current_code]:
                continue
            if current_code == dest_node.code:
                break

            for neighbor_code, weight in graph.get(current_code, []):
                distance = current_dist + weight
                if distance < distances[neighbor_code]:
                    distances[neighbor_code] = distance
                    previous[neighbor_code] = current_code
                    heapq.heappush(pq, (distance, neighbor_code))

        if distances[dest_node.code] == float('inf'):
            # Fallback to direct connection
            direct_dist = round(haversine(s_lat, s_lng, d_lat, d_lng), 1)
            return {
                "source": source_node.code,
                "destination": destination_code or dest_node.code,
                "distanceMeters": direct_dist,
                "estimatedMinutes": max(1, round(direct_dist / 80.0)),
                "mode": mode,
                "engine": "direct",
                "path": [source_node.code, dest_node.code],
                "coordinates": [[s_lat, s_lng], [d_lat, d_lng]],
                "steps": [
                    {"instruction": f"Head from {source_node.name} directly toward {dest_node.name}", "distanceMeters": direct_dist}
                ]
            }

        # Reconstruct path
        path_codes = []
        curr = dest_node.code
        while curr:
            path_codes.append(curr)
            curr = previous[curr]
        path_codes.reverse()

        total_distance = round(distances[dest_node.code], 1)
        estimated_minutes = max(1, round(total_distance / 80.0))

        nodes_detail = []
        coordinates = []
        steps = []
        for i, code in enumerate(path_codes):
            node_obj = all_nodes.get(code)
            if node_obj:
                nodes_detail.append({
                    "code": node_obj.code,
                    "name": node_obj.name,
                    "lat": node_obj.lat,
                    "lng": node_obj.lng,
                    "nodeType": node_obj.node_type
                })
                coordinates.append([node_obj.lat, node_obj.lng])
                if i < len(path_codes) - 1:
                    next_node = all_nodes.get(path_codes[i + 1])
                    if next_node:
                        leg_dist = round(haversine(node_obj.lat, node_obj.lng, next_node.lat, next_node.lng), 1)
                        steps.append({
                            "instruction": f"Walk from {node_obj.name} toward {next_node.name}",
                            "distanceMeters": leg_dist,
                            "type": "turn"
                        })

        return {
            "source": source_node.code,
            "destination": destination_code or dest_node.code,
            "distanceMeters": total_distance,
            "estimatedMinutes": estimated_minutes,
            "mode": mode,
            "engine": "campus-dijkstra",
            "path": path_codes,
            "coordinates": coordinates,
            "steps": steps,
            "nodes": nodes_detail
        }

