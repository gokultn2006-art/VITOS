import heapq
from typing import Dict, List, Any, Optional
from api.models import CampusNode, CampusPath

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
]

DEFAULT_PATHS = [
    ("MAIN_GATE", "LIBRARY_JUNCTION", 300.0),
    ("LIBRARY_JUNCTION", "LIBRARY", 100.0),
    ("LIBRARY_JUNCTION", "TT", 120.0),
    ("LIBRARY_JUNCTION", "SMV", 250.0),
    ("LIBRARY_JUNCTION", "NORTH_JUNCTION", 350.0),
    ("NORTH_JUNCTION", "SJT_GATE", 200.0),
    ("NORTH_JUNCTION", "MENS_HOSTEL", 300.0),
    ("SJT_GATE", "SJT", 100.0),
    ("MENS_HOSTEL", "SJT_GATE", 400.0),
]

def seed_campus_graph_if_empty():
    if not CampusNode.objects.exists():
        created_nodes = {}
        for n in DEFAULT_NODES:
            node = CampusNode.objects.create(**n)
            created_nodes[node.code] = node

        for from_code, to_code, dist in DEFAULT_PATHS:
            fn = created_nodes.get(from_code)
            tn = created_nodes.get(to_code)
            if fn and tn:
                CampusPath.objects.create(from_node=fn, to_node=tn, distance_meters=dist, walkable=True)
                CampusPath.objects.create(from_node=tn, to_node=fn, distance_meters=dist, walkable=True)

class NavigationService:
    @staticmethod
    def calculate_route(source_code: str, destination_code: str) -> Dict[str, Any]:
        seed_campus_graph_if_empty()

        # Handle classroom strings like "SJT208" or "SJT123" by mapping to building code "SJT"
        target_dest_code = destination_code.upper()
        if target_dest_code.startswith("SJT"):
            target_dest_code = "SJT"
        elif target_dest_code.startswith("TT"):
            target_dest_code = "TT"
        elif target_dest_code.startswith("SMV"):
            target_dest_code = "SMV"

        source_node = CampusNode.objects.filter(code__iexact=source_code).first()
        dest_node = CampusNode.objects.filter(code__iexact=target_dest_code).first() or CampusNode.objects.filter(code__icontains=target_dest_code).first()

        if not source_node:
            source_node = CampusNode.objects.filter(code="MENS_HOSTEL").first() or CampusNode.objects.first()

        if not dest_node:
            dest_node = CampusNode.objects.filter(code="SJT").first() or CampusNode.objects.last()

        if source_node == dest_node:
            return {
                "source": source_node.code,
                "destination": dest_node.code,
                "distanceMeters": 0,
                "estimatedMinutes": 0,
                "path": [source_node.code],
                "nodes": [{"code": source_node.code, "name": source_node.name, "lat": source_node.lat, "lng": source_node.lng}]
            }

        # Build adjacency graph
        all_nodes = {n.code: n for n in CampusNode.objects.all()}
        all_paths = CampusPath.objects.filter(walkable=True)

        graph: Dict[str, List[tuple]] = {code: [] for code in all_nodes}
        for path in all_paths:
            graph[path.from_node.code].append((path.to_node.code, path.distance_meters))

        # Dijkstra algorithm
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
            return {
                "error": f"No walkable route found between {source_node.name} and {dest_node.name}."
            }

        # Reconstruct path
        path_codes = []
        curr = dest_node.code
        while curr:
            path_codes.append(curr)
            curr = previous[curr]
        path_codes.reverse()

        total_distance = round(distances[dest_node.code], 1)
        estimated_minutes = max(1, round(total_distance / 80.0)) # ~80m per min average walking speed

        nodes_detail = []
        for code in path_codes:
            node_obj = all_nodes.get(code)
            if node_obj:
                nodes_detail.append({
                    "code": node_obj.code,
                    "name": node_obj.name,
                    "lat": node_obj.lat,
                    "lng": node_obj.lng,
                    "nodeType": node_obj.node_type
                })

        return {
            "source": source_node.code,
            "destination": destination_code,
            "distanceMeters": total_distance,
            "estimatedMinutes": estimated_minutes,
            "path": path_codes,
            "nodes": nodes_detail
        }
