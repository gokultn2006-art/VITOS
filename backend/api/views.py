import os
from datetime import datetime, date
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponse

from .models import (
    StudentProfile, Building, Room, CampusLocation, Timetable, LostItem,
    DirectoryEntry, Notification, StudentTimetable, TimetableClass,
    CampusNode, CampusPath, ClassroomAvailability
)
from .serializers import (
    UserSerializer, StudentProfileSerializer, BuildingSerializer, RoomSerializer,
    CampusLocationSerializer, TimetableSerializer, LostItemSerializer,
    DirectoryEntrySerializer, NotificationSerializer, StudentTimetableSerializer,
    TimetableClassSerializer, CampusNodeSerializer, CampusPathSerializer,
    ClassroomAvailabilitySerializer
)
from .services.ffcs_slot_service import FFCSSlotParser, TimetableConflictService
from .services.next_class_service import NextClassService
from .services.navigation_service import NavigationService
from .services.notification_service import NotificationService

def get_request_user(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer vitos_token_'):
        parts = auth_header.split('_')
        if len(parts) >= 3:
            try:
                user_id = int(parts[2])
                return User.objects.get(id=user_id)
            except Exception:
                pass
    return User.objects.filter(username='22BCE1024').first() or User.objects.first()

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        username = data.get('reg_no') or data.get('email')
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        reg_no = data.get('reg_no')
        programme = data.get('programme', 'B.Tech Computer Science and Engineering')
        year_semester = data.get('year_semester', '3rd Year (Semester VI)')

        if not username or not password or not reg_no:
            return Response({'error': 'Registration number, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists() or StudentProfile.objects.filter(reg_no=reg_no).exists():
            return Response({'error': 'An account with this registration number or email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=full_name.split()[0] if full_name else '',
            last_name=' '.join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ''
        )

        profile = StudentProfile.objects.create(
            user=user,
            full_name=full_name or reg_no,
            reg_no=reg_no,
            programme=programme,
            year_semester=year_semester,
            saved_locations=['TT', 'LIB', 'MED'],
            recent_searches=['TT-624', 'Periyar Library', 'Medical Centre']
        )

        serializer = UserSerializer(user)
        return Response({
            'token': f"vitos_token_{user.id}_{os.urandom(4).hex()}",
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('identifier') or request.data.get('email') or request.data.get('reg_no')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'error': 'Please provide registration number/email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=identifier, password=password)
        if not user:
            try:
                if '@' in identifier:
                    u = User.objects.get(email=identifier)
                else:
                    prof = StudentProfile.objects.get(reg_no=identifier)
                    u = prof.user
                if u.check_password(password):
                    user = u
            except Exception:
                pass

        if not user:
            return Response({'error': 'Invalid credentials. Please check your Registration Number and Password.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = UserSerializer(user)
        return Response({
            'token': f"vitos_token_{user.id}_{os.urandom(4).hex()}",
            'user': serializer.data
        })

class CurrentUserView(APIView):
    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = UserSerializer(user)
        return Response(serializer.data)

class TimetableRegisterView(APIView):
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        courses_data = request.data.get('courses', [])
        semester = request.data.get('semester', 'Winter 2026')
        academic_year = request.data.get('academicYear', '2025-2026')

        if not isinstance(courses_data, list) or len(courses_data) == 0:
            return Response({'error': 'No course entries provided in timetable payload.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Mark previous timetables as inactive
            prev_timetables = StudentTimetable.objects.filter(user=user, active=True)
            prev_version = prev_timetables.first().version if prev_timetables.exists() else 0
            prev_timetables.update(active=False)

            # Create new active timetable
            new_timetable = StudentTimetable.objects.create(
                user=user,
                semester=semester,
                academic_year=academic_year,
                active=True,
                version=prev_version + 1
            )

            created_classes = []
            for item in courses_data:
                course_code = item.get('courseCode', '').upper()
                course_name = item.get('courseTitle') or item.get('courseName') or course_code
                faculty = item.get('faculty', 'VIT Faculty')
                venue = item.get('venue') or item.get('room_number') or 'SJT Block'
                slot_comb = item.get('slotCombination') or item.get('slot') or ''
                credits_val = float(item.get('credits', 3.0))

                if not course_code or not slot_comb:
                    continue

                # Validate slot combination with FFCS parser
                try:
                    resolved_slots = FFCSSlotParser.parse_combination(slot_comb)
                except ValueError as err:
                    return Response({'error': f"Course {course_code} has invalid slot combination: {str(err)}"}, status=status.HTTP_400_BAD_REQUEST)

                for slot in resolved_slots:
                    tc = TimetableClass.objects.create(
                        timetable=new_timetable,
                        course_code=course_code,
                        course_name=course_name,
                        faculty=faculty,
                        venue=venue,
                        slot_combination=slot_comb,
                        day=slot.day,
                        start_time=f"08:00 AM" if slot.period == 0 else f"0{slot.period}:00 AM" if slot.period < 6 else f"0{slot.period-6}:00 PM",
                        end_time=f"08:50 AM" if slot.period == 0 else f"0{slot.period}:50 AM" if slot.period < 6 else f"0{slot.period-6}:50 PM",
                        period=slot.period,
                        credits=credits_val
                    )
                    created_classes.append(tc)

            # Generate notifications
            NotificationService.generate_timetable_notifications(user)

        serializer = StudentTimetableSerializer(new_timetable)
        return Response({
            'message': f'Timetable v{new_timetable.version} registered successfully as active.',
            'timetable': serializer.data
        }, status=status.HTTP_201_CREATED)

class NextClassView(APIView):
    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        result = NextClassService.get_next_class(user)
        return Response(result, status=status.HTTP_200_OK)

class ProfilePhotoView(APIView):
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        photo_file = request.FILES.get('photo') or request.FILES.get('image') or request.FILES.get('file')
        if not photo_file:
            return Response({'error': 'No profile photo file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate MIME type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        content_type = photo_file.content_type.lower() if photo_file.content_type else ''
        if content_type not in allowed_types and not any(photo_file.name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            return Response({'error': 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 5MB)
        if photo_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Image file size exceeds maximum limit of 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.profile
        profile.profile_photo = photo_file.read()
        profile.profile_photo_mime_type = content_type or 'image/png'
        profile.save()

        return Response({
            'message': 'Profile photo uploaded and saved successfully.',
            'hasPhoto': True
        }, status=status.HTTP_200_OK)

    def get(self, request, user_id=None):
        request_user = get_request_user(request)

        # Security check: Student can only view their own photo unless authorized
        target_user = request_user
        if user_id:
            if str(request_user.id) != str(user_id) and not request_user.is_staff:
                return Response({'error': 'Forbidden: You cannot view another student profile photo.'}, status=status.HTTP_403_FORBIDDEN)
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(target_user, 'profile', None)
        if not profile or not profile.profile_photo:
            return Response({'error': 'No profile photo set for user.'}, status=status.HTTP_404_NOT_FOUND)

        return HttpResponse(profile.profile_photo, content_type=profile.profile_photo_mime_type or 'image/png')

class CampusNavigateView(APIView):
    def post(self, request):
        source = request.data.get('source', 'MENS_HOSTEL')
        destination = request.data.get('destination', 'SJT')

        if not source or not destination:
            return Response({'error': 'Both source and destination campus nodes are required.'}, status=status.HTTP_400_BAD_REQUEST)

        route_data = NavigationService.calculate_route(source, destination)
        if 'error' in route_data:
            return Response(route_data, status=status.HTTP_400_BAD_REQUEST)

        return Response(route_data, status=status.HTTP_200_OK)

class ClassroomAvailabilityView(APIView):
    def get(self, request):
        availabilities = ClassroomAvailability.objects.all().order_by('-date')
        if not availabilities.exists():
            # Seed default classroom availability entries
            today = date.today()
            rooms = ['SJT208', 'SJT205', 'SJT218', 'SJT223', 'SJT124', 'SJT204', 'SJT121']
            for rm in rooms:
                ClassroomAvailability.objects.create(
                    classroom=rm,
                    date=today,
                    start_time="08:00 AM",
                    end_time="05:30 PM",
                    status="UNCONFIRMED",
                    source="UNCONFIRMED",
                    notes="Awaiting admin manual verification."
                )
            availabilities = ClassroomAvailability.objects.all().order_by('-date')

        serializer = ClassroomAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

class AdminClassroomReviewView(APIView):
    def post(self, request):
        user = get_request_user(request)
        if not user or not (user.is_staff or user.is_superuser or getattr(user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Forbidden: Admin role authorization required.'}, status=status.HTTP_403_FORBIDDEN)

        availability_id = request.data.get('availabilityId')
        classroom_code = request.data.get('classroom')
        new_status = request.data.get('status', 'AVAILABLE').upper()
        notes = request.data.get('notes', '')

        if new_status not in ['AVAILABLE', 'OCCUPIED', 'UNCONFIRMED']:
            return Response({'error': 'Invalid status. Choices are AVAILABLE, OCCUPIED, UNCONFIRMED.'}, status=status.HTTP_400_BAD_REQUEST)

        item = None
        if availability_id:
            item = ClassroomAvailability.objects.filter(id=availability_id).first()
        elif classroom_code:
            item = ClassroomAvailability.objects.filter(classroom=classroom_code).first()

        if not item and classroom_code:
            item = ClassroomAvailability.objects.create(
                classroom=classroom_code,
                date=date.today(),
                start_time="08:00 AM",
                end_time="05:30 PM",
                status=new_status,
                source="ADMIN_CONFIRMED",
                updated_by=user,
                notes=notes
            )
        elif item:
            item.status = new_status
            item.source = "ADMIN_CONFIRMED"
            item.updated_by = user
            item.notes = notes
            item.save()
        else:
            return Response({'error': 'Classroom availability record not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ClassroomAvailabilitySerializer(item)
        return Response({
            'message': f'Classroom {item.classroom} status updated to {new_status} by admin.',
            'availability': serializer.data
        }, status=status.HTTP_200_OK)

class TimetableExportView(APIView):
    def get(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        entries = Timetable.objects.filter(student=user)
        serializer = TimetableSerializer(entries, many=True)
        return Response({
            'version': 1,
            'studentRegNo': getattr(getattr(user, 'profile', None), 'reg_no', user.username),
            'courses': serializer.data
        })

class TimetableImportView(APIView):
    def post(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        courses_data = request.data.get('courses')
        if not courses_data or not isinstance(courses_data, list):
            return Response({'error': 'Invalid payload: "courses" array is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Register active timetable
        reg_view = TimetableRegisterView()
        return reg_view.post(request)

class BuildingViewSet(viewsets.ModelViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class CampusLocationViewSet(viewsets.ModelViewSet):
    queryset = CampusLocation.objects.all()
    serializer_class = CampusLocationSerializer

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer

class LostItemViewSet(viewsets.ModelViewSet):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer

class DirectoryEntryViewSet(viewsets.ModelViewSet):
    queryset = DirectoryEntry.objects.all()
    serializer_class = DirectoryEntrySerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

class AvailableClassroomsView(APIView):
    def get(self, request):
        rooms = Room.objects.all()
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

class AiAssistantChatView(APIView):
    def post(self, request):
        message = request.data.get('message', '')
        return Response({
            'reply': f"VIT CampusOS Assistant: Answer for '{message}'. Navigation, timetables, and classroom tools are ready.",
            'timestamp': 'Just now'
        })
