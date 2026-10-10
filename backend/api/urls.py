from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, CurrentUserView, SendOtpView, VerifyOtpView, GoogleAuthView,
    TimetableExportView, TimetableImportView, TimetableRegisterView, NextClassView,
    ProfilePhotoView, CampusNavigateView, ClassroomAvailabilityView, AdminClassroomReviewView,
    BuildingViewSet, RoomViewSet, CampusLocationViewSet,
    TimetableViewSet, LostItemViewSet, DirectoryEntryViewSet, NotificationViewSet,
    AvailableClassroomsView, AiAssistantChatView,
    AiAssistantStatusView, AiAssistantConfigureView,
    AdminUsersView, AdminUserDetailView, AdminSlotClassesView, AdminSlotListView,
    ProfileUpdateView, DeleteAccountView
)

router = DefaultRouter()
router.register(r'buildings', BuildingViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'locations', CampusLocationViewSet)
router.register(r'timetable', TimetableViewSet)
router.register(r'lost-found', LostItemViewSet)
router.register(r'directory', DirectoryEntryViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/send-otp/', SendOtpView.as_view(), name='auth-send-otp'),
    path('auth/verify-otp/', VerifyOtpView.as_view(), name='auth-verify-otp'),
    path('auth/google/', GoogleAuthView.as_view(), name='auth-google'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/slot-classes/', AdminSlotClassesView.as_view(), name='admin-slot-classes'),
    path('admin/slots/', AdminSlotListView.as_view(), name='admin-slots'),
    path('timetable/export/', TimetableExportView.as_view(), name='timetable-export'),
    path('timetable/import/', TimetableImportView.as_view(), name='timetable-import'),
    path('timetable/register/', TimetableRegisterView.as_view(), name='timetable-register'),
    path('timetable/next/', NextClassView.as_view(), name='timetable-next'),
    path('users/profile/photo/', ProfilePhotoView.as_view(), name='profile-photo'),
    path('users/profile/photo/<int:user_id>/', ProfilePhotoView.as_view(), name='profile-photo-user'),
    path('users/profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('users/delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('locations/navigate/', CampusNavigateView.as_view(), name='campus-navigate'),
    path('classrooms/availability/', ClassroomAvailabilityView.as_view(), name='classroom-availability'),
    path('admin/availability/review/', AdminClassroomReviewView.as_view(), name='admin-availability-review'),
    path('', include(router.urls)),
    path('classrooms/available/', AvailableClassroomsView.as_view(), name='available-classrooms'),
    path('assistant/chat/', AiAssistantChatView.as_view(), name='assistant-chat'),
    path('assistant/status/', AiAssistantStatusView.as_view(), name='assistant-status'),
    path('assistant/configure/', AiAssistantConfigureView.as_view(), name='assistant-configure'),
]
