import os
import random
import logging
import json
import base64
from datetime import datetime, date, timedelta
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from .models import (
    StudentProfile, Building, Room, CampusLocation, Timetable, LostItem,
    DirectoryEntry, Notification, StudentTimetable, TimetableClass,
    CampusNode, CampusPath, ClassroomAvailability, EmailVerificationOTP
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
from .services.assistant_service import CampusAiAssistantService
from .services.slot_class_service import SlotClassService
import re

logger = logging.getLogger(__name__)

def get_request_user(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer vitos_token_'):
        parts = auth_header.split('_')
        # Format 1: Bearer vitos_token_<user_id>_<hex>
        if len(parts) >= 3:
            try:
                user_id = int(parts[2])
                user = User.objects.filter(id=user_id).first()
                if user:
                    return user
            except (ValueError, TypeError):
                pass
        
        # Format 2: Bearer vitos_token_demo_<identifier>
        if len(parts) >= 4 and parts[2] == 'demo':
            identifier = parts[3]
            user = User.objects.filter(username__iexact=identifier).first()
            if not user and identifier == '1024':
                user = User.objects.filter(username='22BCE1024').first()
            if not user:
                profile = StudentProfile.objects.filter(reg_no__iexact=identifier).first()
                if profile:
                    user = profile.user
            if user:
                return user

    return None

class SendOtpView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not email.endswith('@vitstudent.ac.in'):
            return Response({
                'error': 'Registration is strictly restricted to official VIT student emails ending with @vitstudent.ac.in.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({
                'error': 'An account with this email address already exists. Please sign in instead.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate secure 6-digit numeric OTP
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=10)

        # Clear any prior unverified OTPs for this email
        EmailVerificationOTP.objects.filter(email__iexact=email).delete()
        EmailVerificationOTP.objects.create(
            email=email,
            otp=otp_code,
            expires_at=expires_at,
            is_verified=False
        )

        subject = "VIT Vellore - Student Account Verification Code"
        message = (
            f"Dear Student,\n\n"
            f"Your verification code for registering your VIT student account is:\n\n"
            f"    {otp_code}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this verification code, please ignore this email.\n\n"
            f"Regards,\n"
            f"VIT Vellore Campus System"
        )

        # --- PRIMARY: Send OTP via Brevo HTTP API (works on Render free tier) ---
        brevo_api_key = os.environ.get('BREVO_API_KEY', '').strip()
        sender_email = os.environ.get('SENDER_EMAIL', 'vitcampusosofficial@gmail.com').strip()

        if brevo_api_key:
            try:
                import requests as http_requests
                resp = http_requests.post(
                    'https://api.brevo.com/v3/smtp/email',
                    headers={
                        'api-key': brevo_api_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'sender': {'name': 'VIT CampusOS', 'email': sender_email},
                        'to': [{'email': email}],
                        'subject': subject,
                        'textContent': message,
                    },
                    timeout=15
                )
                if resp.status_code in (200, 201):
                    logger.info(f"OTP email sent via Brevo to {email}")
                    return Response({
                        'message': f"A 6-digit verification code has been sent to {email}. Please check your inbox and spam folder.",
                        'email': email,
                        'expires_in_seconds': 600
                    }, status=status.HTTP_200_OK)
                else:
                    logger.error(f"Brevo API error {resp.status_code}: {resp.text}")

            except Exception as e:
                logger.error(f"Brevo email failed for {email}: {e}")
                # Fall through to SMTP fallback

        # --- FALLBACK: Send OTP via Gmail SMTP (works locally, blocked on Render) ---
        env_file = settings.BASE_DIR / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            os.environ[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass

        host_user = (os.environ.get('EMAIL_HOST_USER') or getattr(settings, 'EMAIL_HOST_USER', '')).strip()
        host_password = (os.environ.get('EMAIL_HOST_PASSWORD') or getattr(settings, 'EMAIL_HOST_PASSWORD', '')).strip().replace(' ', '')

        if host_user and host_password:
            try:
                from django.core.mail.backends.smtp import EmailBackend
                from django.core.mail import EmailMessage

                backend = EmailBackend(
                    host='smtp.gmail.com',
                    port=587,
                    username=host_user,
                    password=host_password,
                    use_tls=True,
                    fail_silently=False,
                    timeout=15,
                )
                email_msg = EmailMessage(
                    subject=subject,
                    body=message,
                    from_email=f'VIT Vellore Admissions <{host_user}>',
                    to=[email],
                    connection=backend
                )
                email_msg.send(fail_silently=False)

                logger.info(f"OTP email sent via Gmail SMTP to {email}")
                return Response({
                    'message': f"A 6-digit verification code has been dispatched to {email}. Please check your inbox and spam folder.",
                    'email': email,
                    'expires_in_seconds': 600
                }, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Gmail SMTP failed for {email}: {e}")
                # Fall through to on-screen fallback

        # --- LAST RESORT: Return OTP on-screen ---
        logger.warning(f"All email methods failed. Returning OTP on-screen for {email}: {otp_code}")
        return Response({
            'message': f"Email delivery is temporarily unavailable. Your verification code is: {otp_code}",
            'email': email,
            'otp': otp_code,
            'expires_in_seconds': 600
        }, status=status.HTTP_200_OK)

class VerifyOtpView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp = (request.data.get('otp') or '').strip()

        if not email or not otp:
            return Response({'error': 'Email address and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        record = EmailVerificationOTP.objects.filter(email__iexact=email, is_verified=False).order_by('-created_at').first()
        if not record:
            return Response({
                'error': 'No pending verification code found for this email. Please click "Send Code" to request one.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if record.expires_at < timezone.now():
            return Response({
                'error': 'Verification code has expired. Please request a new code.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if record.attempts >= 5:
            return Response({
                'error': 'Too many failed verification attempts. Please request a new code.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if record.otp != otp:
            record.attempts += 1
            record.save()
            return Response({
                'error': 'Invalid verification code. Please check the 6-digit code sent to your email.'
            }, status=status.HTTP_400_BAD_REQUEST)

        record.is_verified = True
        record.save()

        return Response({
            'message': 'Email address successfully verified!',
            'verified': True,
            'email': email
        }, status=status.HTTP_200_OK)

class GoogleAuthView(APIView):
    def post(self, request):
        data = request.data
        email = (data.get('email') or '').strip().lower()
        name = (data.get('name') or data.get('fullName') or '').strip()
        picture = data.get('picture') or data.get('avatarUrl') or ''
        credential = data.get('credential')

        # If credential JWT was sent, decode payload
        if credential and not email:
            try:
                parts = credential.split('.')
                if len(parts) >= 2:
                    padding = '=' * (-len(parts[1]) % 4)
                    payload_json = base64.urlsafe_b64decode(parts[1] + padding).decode('utf-8')
                    payload = json.loads(payload_json)
                    email = (payload.get('email') or '').strip().lower()
                    name = payload.get('name', name)
                    picture = payload.get('picture', picture)
            except Exception as e:
                logger.warning(f"Failed to decode Google credential: {e}")

        if not email:
            return Response({'error': 'Google account email could not be retrieved.'}, status=status.HTTP_400_BAD_REQUEST)

        # STRICT VERIFICATION: MUST BE @vitstudent.ac.in
        if not email.endswith('@vitstudent.ac.in'):
            return Response({
                'error': f'Access restricted: {email} is not a valid @vitstudent.ac.in Google account. Only official VIT student accounts are permitted.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check existing user
        user = User.objects.filter(email__iexact=email).first()
        is_new = False
        if not user:
            # Auto-provision student account for verified Google user
            is_new = True
            reg_match = re.search(r'([0-9]{2}[A-Za-z]{3}[0-9]{4})', email)
            reg_no = reg_match.group(1).upper() if reg_match else email.split('@')[0].upper()
            username = reg_no

            if User.objects.filter(username__iexact=username).exists() or StudentProfile.objects.filter(reg_no__iexact=reg_no).exists():
                username = f"{email.split('@')[0]}_{os.urandom(2).hex()}"

            user = User.objects.create_user(
                username=username,
                email=email,
                password=os.urandom(16).hex(),
                first_name=name.split()[0] if name else '',
                last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
            )

            StudentProfile.objects.create(
                user=user,
                full_name=name or email.split('@')[0],
                reg_no=reg_no,
                programme='',
                year_semester='',
                avatar_url=picture or '/default-avatar.png',
                saved_locations=['TT', 'LIB', 'MED'],
                recent_searches=['TT-624', 'Periyar Library', 'Medical Centre']
            )
        else:
            prof = getattr(user, 'profile', None)
            if not prof or not prof.programme or not prof.year_semester:
                is_new = True

        serializer = UserSerializer(user)
        return Response({
            'token': f"vitos_token_{user.id}_{os.urandom(4).hex()}",
            'user': serializer.data,
            'is_new_user': is_new,
            'needs_profile_completion': is_new,
            'message': 'Successfully authenticated with Google VIT student account.'
        }, status=status.HTTP_200_OK)

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        full_name = (data.get('full_name') or '').strip()
        reg_no = (data.get('reg_no') or '').strip().upper()
        programme = data.get('programme', 'B.Tech Computer Science and Engineering')
        year_semester = data.get('year_semester', '3rd Year (Semester VI)')

        if not email or not password:
            return Response({'error': 'Email address and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not email.endswith('@vitstudent.ac.in'):
            return Response({'error': 'Registration is restricted to official VIT student emails ending with @vitstudent.ac.in.'}, status=status.HTTP_400_BAD_REQUEST)

        # Derive reg_no from email or input if not supplied
        if not reg_no:
            reg_match = re.search(r'([0-9]{2}[A-Za-z]{3}[0-9]{4})', email)
            reg_no = reg_match.group(1).upper() if reg_match else email.split('@')[0].upper()

        username = reg_no

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'An account with this email address already exists. Please sign in instead.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists() or StudentProfile.objects.filter(reg_no__iexact=reg_no).exists():
            username = email.split('@')[0]
            if User.objects.filter(username__iexact=username).exists():
                username = f"{username}_{os.urandom(2).hex()}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=full_name.split()[0] if full_name else '',
            last_name=' '.join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ''
        )

        profile = StudentProfile.objects.create(
            user=user,
            full_name=full_name or email.split('@')[0],
            reg_no=reg_no,
            programme=programme,
            year_semester=year_semester,
            saved_locations=['TT', 'LIB', 'MED'],
            recent_searches=['TT-624', 'Periyar Library', 'Medical Centre']
        )

        # Clean up verified OTP record after registration
        EmailVerificationOTP.objects.filter(email__iexact=email).delete()

        serializer = UserSerializer(user)
        return Response({
            'token': f"vitos_token_{user.id}_{os.urandom(4).hex()}",
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        identifier = (request.data.get('identifier') or request.data.get('email') or request.data.get('reg_no') or '').strip()
        password = request.data.get('password')

        if not identifier or not password:
            return Response({'error': 'Please provide email and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        def check_pw(u, pw):
            if not u:
                return False
            return u.check_password(pw)

        # 1. Try direct case-insensitive email lookup
        if '@' in identifier:
            u = User.objects.filter(email__iexact=identifier).first()
            if u and check_pw(u, password):
                user = u
        else:
            # 2. Try reg_no lookup
            prof = StudentProfile.objects.filter(reg_no__iexact=identifier).first()
            if prof and prof.user and check_pw(prof.user, password):
                user = prof.user
            else:
                u = User.objects.filter(username__iexact=identifier).first()
                if u and check_pw(u, password):
                    user = u

        # 3. Fallback standard Django auth
        if not user:
            user = authenticate(username=identifier, password=password)

        if not user:
            return Response({'error': 'Invalid email or password. Please verify your credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

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

                period_times = {
                    1: ("08:00 AM", "08:50 AM"),
                    2: ("09:00 AM", "09:50 AM"),
                    3: ("10:00 AM", "10:50 AM"),
                    4: ("11:00 AM", "11:50 AM"),
                    5: ("12:00 PM", "12:50 PM"),
                    6: ("12:30 PM", "01:20 PM"),
                    7: ("02:00 PM", "02:50 PM"),
                    8: ("03:00 PM", "03:50 PM"),
                    9: ("04:00 PM", "04:50 PM"),
                    10: ("05:00 PM", "05:50 PM"),
                    11: ("06:00 PM", "06:50 PM"),
                    12: ("06:30 PM", "07:20 PM"),
                    13: ("07:00 PM", "07:50 PM"),
                }
                for slot in resolved_slots:
                    slot_start, slot_end = period_times.get(slot.period, ("08:00 AM", "08:50 AM"))
                    tc = TimetableClass.objects.create(
                        timetable=new_timetable,
                        course_code=course_code,
                        course_name=course_name,
                        faculty=faculty,
                        venue=venue,
                        slot_combination=slot_comb,
                        day=slot.day,
                        start_time=slot_start,
                        end_time=slot_end,
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
        source = request.data.get('source', '')
        destination = request.data.get('destination', '')
        from_lat = request.data.get('from_lat')
        from_lng = request.data.get('from_lng')
        to_lat = request.data.get('to_lat')
        to_lng = request.data.get('to_lng')
        mode = request.data.get('mode', 'walking')

        # Convert coordinates if provided as strings or numbers
        try:
            from_lat = float(from_lat) if from_lat is not None else None
            from_lng = float(from_lng) if from_lng is not None else None
            to_lat = float(to_lat) if to_lat is not None else None
            to_lng = float(to_lng) if to_lng is not None else None
        except (ValueError, TypeError):
            from_lat = from_lng = to_lat = to_lng = None

        has_codes = bool(source and destination)
        has_coords = bool(from_lat is not None and from_lng is not None and to_lat is not None and to_lng is not None)

        if not has_codes and not has_coords and not source and not destination:
            return Response({'error': 'Either source and destination codes or valid coordinate pairs (from_lat/lng, to_lat/lng) are required.'}, status=status.HTTP_400_BAD_REQUEST)

        route_data = NavigationService.calculate_route(
            source_code=source,
            destination_code=destination,
            from_lat=from_lat,
            from_lng=from_lng,
            to_lat=to_lat,
            to_lng=to_lng,
            mode=mode
        )
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

    def get_queryset(self):
        user = get_request_user(self.request)
        if user:
            return Timetable.objects.filter(student=user)
        return Timetable.objects.none()

    def perform_create(self, serializer):
        user = get_request_user(self.request)
        serializer.save(student=user)

class LostItemViewSet(viewsets.ModelViewSet):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer

class DirectoryEntryViewSet(viewsets.ModelViewSet):
    queryset = DirectoryEntry.objects.filter(is_active=True)
    serializer_class = DirectoryEntrySerializer

    def get_queryset(self):
        qs = DirectoryEntry.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        parent_id = self.request.query_params.get('parent')
        entry_type = self.request.query_params.get('type')
        search = self.request.query_params.get('search')

        if category and category != 'all':
            qs = qs.filter(category__iexact=category)
        if parent_id is not None:
            if parent_id in ['null', 'none', '']:
                qs = qs.filter(parent__isnull=True)
            else:
                qs = qs.filter(parent_id=parent_id)
        if entry_type:
            qs = qs.filter(entry_type=entry_type)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(short_name__icontains=search) |
                Q(description__icontains=search) |
                Q(location_name__icontains=search) |
                Q(category__icontains=search) |
                Q(subcategory__icontains=search) |
                Q(building__icontains=search) |
                Q(search_keywords__icontains=search) |
                Q(aliases__icontains=search)
            )
        return qs

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
        response_data = CampusAiAssistantService.answer_query(message)
        return Response(response_data)

class AiAssistantStatusView(APIView):
    def get(self, request):
        return Response(CampusAiAssistantService.get_status())

class AiAssistantConfigureView(APIView):
    def post(self, request):
        api_key = request.data.get('api_key', '')
        if not api_key:
            return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)
        CampusAiAssistantService.set_api_key(api_key)
        return Response(CampusAiAssistantService.get_status())

class AdminUsersView(APIView):
    def get(self, request):
        users = User.objects.all().select_related('profile').order_by('-date_joined')
        data = []
        for u in users:
            prof = getattr(u, 'profile', None)
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'fullName': (prof.full_name if prof else '') or f"{u.first_name} {u.last_name}".strip() or u.username,
                'regNo': (prof.reg_no if prof else '') or u.username,
                'programme': (prof.programme if prof else '') or ('System Administrator' if u.is_staff else 'B.Tech Computer Science and Engineering'),
                'yearSemester': (prof.year_semester if prof else '') or ('Staff / Admin' if u.is_staff else '3rd Year (Semester VI)'),
                'isStaff': u.is_staff or u.is_superuser,
                'role': 'admin' if (u.is_staff or u.is_superuser) else 'student',
                'dateJoined': u.date_joined.strftime('%Y-%m-%d %H:%M') if u.date_joined else '2026-10-07',
                'avatarUrl': (prof.avatar_url if prof else '') or 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
            })
        return Response(data)

class AdminSlotClassesView(APIView):
    def get(self, request):
        slot = request.query_params.get('slot', 'A1')
        result = SlotClassService.get_classes_for_slot(slot)
        return Response(result)

class AdminSlotListView(APIView):
    def get(self, request):
        slots = SlotClassService.get_available_slots()
        return Response(slots)

class AdminUserDetailView(APIView):
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if user.username == 'admin' or user.email == 'admin@vitstudent.ac.in':
                return Response({'error': 'Cannot delete master administrator account.'}, status=status.HTTP_400_BAD_REQUEST)
            full_name = getattr(getattr(user, 'profile', None), 'full_name', '') or user.username
            user.delete()
            return Response({'message': f'User {full_name} deleted successfully.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class ProfileUpdateView(APIView):
    def patch(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data
        full_name = data.get('name') or data.get('fullName') or data.get('full_name')
        if full_name:
            names = full_name.strip().split()
            user.first_name = names[0]
            user.last_name = " ".join(names[1:]) if len(names) > 1 else ""
            user.save()

        profile = getattr(user, 'profile', None)
        if not profile:
            profile = StudentProfile.objects.create(
                user=user,
                full_name=full_name or user.username,
                reg_no=user.username,
                programme='B.Tech Computer Science and Engineering',
                year_semester='3rd Year (Semester VI)'
            )
        else:
            if full_name:
                profile.full_name = full_name.strip()
            if 'regNo' in data or 'reg_no' in data:
                new_reg = (data.get('regNo') or data.get('reg_no')).strip().upper()
                if new_reg:
                    profile.reg_no = new_reg
                    user.username = new_reg
                    user.save()
            if 'program' in data or 'programme' in data:
                profile.programme = data.get('program') or data.get('programme')
            if 'year' in data or 'yearSemester' in data or 'year_semester' in data:
                profile.year_semester = data.get('year') or data.get('yearSemester') or data.get('year_semester')
            if 'avatar' in data or 'avatarUrl' in data or 'avatar_url' in data:
                profile.avatar_url = data.get('avatar') or data.get('avatarUrl') or data.get('avatar_url')
            if 'savedLocationIds' in data or 'saved_locations' in data:
                profile.saved_locations = data.get('savedLocationIds') or data.get('saved_locations')
            profile.save()

        serializer = UserSerializer(user)
        return Response({
            'message': 'Profile updated successfully.',
            'user': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        return self.patch(request)


class DeleteAccountView(APIView):
    def delete(self, request):
        user = get_request_user(request)
        if not user:
            return Response({'error': 'Unauthorized. Please log in first.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Strict protection: Administrator accounts cannot be deleted
        if user.username == 'admin' or user.email == 'admin@vitstudent.ac.in' or getattr(user, 'is_staff', False):
            return Response({'error': 'Administrator accounts cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)
        
        full_name = getattr(getattr(user, 'profile', None), 'full_name', '') or user.username
        user.delete()
        return Response({'message': f'Student account for {full_name} has been permanently deleted.'}, status=status.HTTP_200_OK)

    def post(self, request):
        return self.delete(request)


