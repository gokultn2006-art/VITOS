from django.db import models
from django.contrib.auth.models import User

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200)
    reg_no = models.CharField(max_length=30, unique=True)
    programme = models.CharField(max_length=200, default='B.Tech Computer Science and Engineering')
    year_semester = models.CharField(max_length=100, default='3rd Year (Semester VI)')
    avatar_url = models.URLField(blank=True, null=True, default='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256')
    profile_photo = models.BinaryField(blank=True, null=True)
    profile_photo_mime_type = models.CharField(max_length=50, blank=True, null=True)
    saved_locations = models.JSONField(default=list)
    recent_searches = models.JSONField(default=list)

    def __str__(self):
        return f"{self.full_name} ({self.reg_no})"

class Building(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    lat = models.FloatField()
    lng = models.FloatField()
    total_floors = models.IntegerField(default=1)
    rooms_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Room(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=50)
    floor = models.IntegerField(default=1)
    capacity = models.IntegerField(default=60)
    availability_status = models.CharField(max_length=20, choices=[
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved')
    ], default='available')
    available_until = models.CharField(max_length=100, blank=True, null=True)
    facilities = models.JSONField(default=list)
    current_course = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"{self.room_number} - {self.building.code}"

class CampusLocation(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=50)
    lat = models.FloatField()
    lng = models.FloatField()
    description = models.TextField()
    building_name = models.CharField(max_length=150, blank=True, null=True)
    opening_hours = models.CharField(max_length=100, blank=True, null=True)
    facilities = models.JSONField(default=list)
    image_url = models.URLField(blank=True, null=True)
    is_saved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} [{self.code}]"

class Timetable(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timetables', null=True, blank=True)
    day = models.CharField(max_length=20)
    slot = models.CharField(max_length=20, default='A1')
    session_type = models.CharField(max_length=20, choices=[('theory', 'Theory'), ('lab', 'Lab')], default='theory')
    start_time = models.CharField(max_length=20)
    end_time = models.CharField(max_length=20)
    course_code = models.CharField(max_length=20)
    course_name = models.CharField(max_length=200)
    faculty = models.CharField(max_length=150)
    room_number = models.CharField(max_length=50)
    building_code = models.CharField(max_length=20)
    building_name = models.CharField(max_length=150)
    walking_time_minutes = models.IntegerField(default=5)
    is_next = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.course_code} - {self.slot} ({self.day} {self.start_time})"

class StudentTimetable(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registered_timetables')
    semester = models.CharField(max_length=50, default='Winter 2026')
    academic_year = models.CharField(max_length=50, default='2025-2026')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)

    def __str__(self):
        return f"Timetable v{self.version} for {self.user.username} ({'Active' if self.active else 'Inactive'})"

class TimetableClass(models.Model):
    timetable = models.ForeignKey(StudentTimetable, on_delete=models.CASCADE, related_name='classes')
    course_code = models.CharField(max_length=30)
    course_name = models.CharField(max_length=250)
    faculty = models.CharField(max_length=200, default='VIT Faculty')
    venue = models.CharField(max_length=100, default='SJT Block')
    slot_combination = models.CharField(max_length=100)
    day = models.CharField(max_length=20) # MON, TUE, WED, THU, FRI, SAT, SUN
    start_time = models.CharField(max_length=20) # 08:00 AM
    end_time = models.CharField(max_length=20) # 08:50 AM
    period = models.IntegerField(default=0) # 0..11
    credits = models.FloatField(default=3.0)

    def __str__(self):
        return f"{self.course_code} ({self.slot_combination}) on {self.day} {self.start_time}"

class LostItem(models.Model):
    ITEM_TYPE_CHOICES = [('lost', 'Lost'), ('found', 'Found')]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lost_items')
    type = models.CharField(max_length=10, choices=ITEM_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    location_name = models.CharField(max_length=200)
    date_reported = models.DateField(auto_now_add=True)
    description = models.TextField()
    contact_name = models.CharField(max_length=150)
    contact_email = models.EmailField()
    image_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active')

    def __str__(self):
        return f"[{self.type.upper()}] {self.title}"

class DirectoryEntry(models.Model):
    ENTRY_TYPE_CHOICES = [
        ('group', 'Group'),
        ('subgroup', 'Subgroup'),
        ('entry', 'Entry')
    ]
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, default='')
    
    # Geographic location (for physical destinations)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    location_name = models.CharField(max_length=200, blank=True, default='')
    building_code = models.CharField(max_length=50, blank=True, null=True)
    building = models.CharField(max_length=150, blank=True, null=True)
    floor = models.CharField(max_length=50, blank=True, null=True)
    room_number = models.CharField(max_length=50, blank=True, null=True)
    room = models.CharField(max_length=50, blank=True, null=True)
    location_id = models.CharField(max_length=50, blank=True, null=True)

    # Contact & Access
    phone = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=150, blank=True, null=True)
    contact = models.CharField(max_length=150, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    opening_hours = models.CharField(max_length=150, blank=True, default='')

    # Hierarchy & Structure
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES, default='entry')
    
    # Metadata, Keywords & Services
    aliases = models.JSONField(default=list, blank=True)
    search_keywords = models.JSONField(default=list, blank=True)
    services = models.JSONField(default=list, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    icon_name = models.CharField(max_length=50, blank=True, null=True)

    # Verification & Source
    source_url = models.URLField(blank=True, null=True)
    source_name = models.CharField(max_length=200, blank=True, null=True)
    source_type = models.CharField(max_length=50, default='official_vit')
    last_verified = models.CharField(max_length=50, blank=True, null=True)
    osm_id = models.CharField(max_length=50, blank=True, null=True)
    osm_type = models.CharField(max_length=20, blank=True, null=True)
    osm_source_url = models.URLField(blank=True, null=True)
    last_osm_sync = models.CharField(max_length=50, blank=True, null=True)
    gender_target = models.CharField(max_length=20, blank=True, null=True)
    facility_count = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Directory Entry'
        verbose_name_plural = 'Directory Entries'

    def __str__(self):
        return f"{self.name} ({self.category})"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    timestamp = models.CharField(max_length=50)
    type = models.CharField(max_length=30, default='info')
    is_read = models.BooleanField(default=False)
    occurrence_identifier = models.CharField(max_length=255, unique=True, null=True, blank=True)

    def __str__(self):
        return self.title

class CampusNode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    lat = models.FloatField()
    lng = models.FloatField()
    node_type = models.CharField(max_length=50, choices=[
        ('building', 'Building'),
        ('junction', 'Junction'),
        ('entrance', 'Entrance'),
        ('walkway', 'Walkway')
    ], default='building')

    def __str__(self):
        return f"{self.name} [{self.code}]"

class CampusPath(models.Model):
    from_node = models.ForeignKey(CampusNode, on_delete=models.CASCADE, related_name='outgoing_paths')
    to_node = models.ForeignKey(CampusNode, on_delete=models.CASCADE, related_name='incoming_paths')
    distance_meters = models.FloatField(default=100.0)
    walkable = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.from_node.code} -> {self.to_node.code} ({self.distance_meters}m)"

class ClassroomAvailability(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('UNCONFIRMED', 'Unconfirmed')
    ]
    SOURCE_CHOICES = [
        ('TIMETABLE_DERIVED', 'Timetable Derived'),
        ('ADMIN_CONFIRMED', 'Admin Confirmed')
    ]
    classroom = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.CharField(max_length=20)
    end_time = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNCONFIRMED')
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='UNCONFIRMED')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.classroom} on {self.date} ({self.status})"

class EmailVerificationOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email} ({'Verified' if self.is_verified else 'Pending'})"

