from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    StudentProfile, Building, Room, CampusLocation, Timetable, LostItem,
    DirectoryEntry, Notification, StudentTimetable, TimetableClass,
    CampusNode, CampusPath, ClassroomAvailability
)

class StudentProfileSerializer(serializers.ModelSerializer):
    hasProfilePhoto = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ['full_name', 'reg_no', 'programme', 'year_semester', 'avatar_url', 'hasProfilePhoto', 'saved_locations', 'recent_searches']

    def get_hasProfilePhoto(self, obj):
        return bool(obj.profile_photo)

class UserSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(read_only=True)
    isStaff = serializers.BooleanField(source='is_staff', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'isStaff', 'profile']

class BuildingSerializer(serializers.ModelSerializer):
    totalFloors = serializers.IntegerField(source='total_floors', required=False)
    roomsCount = serializers.IntegerField(source='rooms_count', required=False)

    class Meta:
        model = Building
        fields = ['id', 'name', 'code', 'lat', 'lng', 'total_floors', 'rooms_count', 'totalFloors', 'roomsCount']
        extra_kwargs = {
            'total_floors': {'required': False},
            'rooms_count': {'required': False},
        }

    def to_internal_value(self, data):
        normalized = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'totalFloors' in normalized and 'total_floors' not in normalized:
            normalized['total_floors'] = normalized['totalFloors']
        if 'roomsCount' in normalized and 'rooms_count' not in normalized:
            normalized['rooms_count'] = normalized['roomsCount']
        return super().to_internal_value(normalized)

class RoomSerializer(serializers.ModelSerializer):
    buildingCode = serializers.CharField(source='building.code', read_only=True)
    buildingName = serializers.CharField(source='building.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'buildingCode', 'buildingName', 'floor', 'capacity', 'availability_status', 'available_until', 'facilities', 'current_course']

class CampusLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusLocation
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timetable
        fields = '__all__'

class TimetableClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimetableClass
        fields = '__all__'

class StudentTimetableSerializer(serializers.ModelSerializer):
    classes = TimetableClassSerializer(many=True, read_only=True)

    class Meta:
        model = StudentTimetable
        fields = ['id', 'user', 'semester', 'academic_year', 'uploaded_at', 'active', 'version', 'classes']

class LostItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostItem
        fields = '__all__'

class DirectoryEntrySerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()
    has_coordinates = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = DirectoryEntry
        fields = '__all__'

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()

    def get_has_coordinates(self, obj):
        return obj.latitude is not None and obj.longitude is not None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class CampusNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusNode
        fields = '__all__'

class CampusPathSerializer(serializers.ModelSerializer):
    fromNodeCode = serializers.CharField(source='from_node.code', read_only=True)
    toNodeCode = serializers.CharField(source='to_node.code', read_only=True)

    class Meta:
        model = CampusPath
        fields = ['id', 'from_node', 'to_node', 'fromNodeCode', 'toNodeCode', 'distance_meters', 'walkable']

class ClassroomAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassroomAvailability
        fields = '__all__'
