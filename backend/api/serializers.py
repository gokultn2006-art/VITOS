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
    class Meta:
        model = Building
        fields = '__all__'

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
    class Meta:
        model = DirectoryEntry
        fields = '__all__'

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
