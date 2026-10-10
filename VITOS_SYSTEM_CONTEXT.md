# VITOS (VIT Campus Operating System) — Comprehensive Project Context

> **Quick Reference Guide**: This document contains the full architecture, implementation history, database schemas, API routes, and operational instructions for VITOS. Use this document whenever resuming or extending the project.

---

## 1. Project Overview & Architecture

VITOS is a centralized campus operating system and navigation platform for **Vellore Institute of Technology (VIT Vellore)**.

### Technology Stack:
- **Frontend**:
  - React 18 + TypeScript + Vite
  - Lucide React Icons
  - Vanilla CSS / Utility classes
  - Single-page application router (`react-router-dom`)
  - Runs on: `http://localhost:5173`
- **Backend**:
  - Python 3.14 + Django 5 + Django REST Framework (DRF)
  - SQLite Database (`backend/db.sqlite3`)
  - Virtual Environment: `backend/venv`
  - Runs on: `http://localhost:8000` / `http://0.0.0.0:8000`

---

## 2. Key Modules & Implementations

### A. Authentication & Access Control
- **Email Domain Constraint**: Strict requirement for all student registrations to end with `@vitstudent.ac.in`. Validated on both frontend (`RegisterPage.tsx`) and backend (`RegisterView` in `api/views.py`).
- **Unified Login**: A single login screen (`LoginPage.tsx`) taking email/regNo and password. No separate confusing student vs admin toggles.
- **Master Admin Account**:
  - Email: `admin@vitstudent.ac.in`
  - Password: `admin123`
  - Role: `isStaff=True` (`is_staff` / `is_superuser`)
  - Protected from deletion in the Admin portal.
- **Session Tokens**: Bearer tokens formatted as `vitos_token_<user_id>_<hex>` stored in `localStorage.vitos_token` and `vitos_user`.

### B. Admin Console (`/admin` - `AdminPage.tsx`)
1. **User Directory**:
   - Lists all registered accounts sorted by registration date (`GET /api/admin/users/`).
   - Displays avatar, full name, email, reg no, programme & semester, and role.
   - **Account Deletion**: Each row features a `Trash2` delete button (protected for master admin). Triggers `DELETE /api/admin/users/<int:user_id>/` which cascades and deletes user, profile, and timetables.
2. **Slot Class Matrix**:
   - `GET /api/admin/slot-classes/?slot=<slot>` and `GET /api/admin/slots/`.
   - Inspects courses, faculties, enrolled student counts, capacity, and rooms mapped to FFCS slots (A1, B1, TA1, L1+L2, etc.).
3. **Classroom Review**:
   - Real-time room availability decisions (AVAILABLE, OCCUPIED, UNCONFIRMED).
4. **Buildings Section**:
   - Displays all campus buildings:
     - **TT** (Technology Tower - 7 Floors, 140 Rooms)
     - **SJT** (Silver Jubilee Tower - 8 Floors, 180 Rooms)
     - **SMV** (Sir M. Visvesvaraya Block - 6 Floors, 90 Rooms)
     - **MGB** (Mahatma Gandhi Block - 5 Floors, 75 Rooms)
     - **MB** (Main Building - 4 Floors, 65 Rooms)
     - **LIB** (Central Library - 6 Floors, 24 Rooms)
   - Fetches live from `GET /api/buildings/` with fallback to `mockData.ts`.

### C. Student Profile Management (`/profile` - `ProfilePage.tsx`)
- **Database Synchronization**: Updates persist in both Django `auth_user` (`first_name`, `last_name`) and `api_studentprofile` (`full_name`, `programme`, `year_semester`, `avatar_url`, `saved_locations`).
- **Endpoint**: `PATCH /api/users/profile/update/` and `POST /api/users/profile/update/`.
- **Global Context**: Handled via `updateUserProfile()` in `AuthContext.tsx`. Updating profile instantly reflects in Navbar chip, Sidebar footer, Profile Page, and Dashboard.
- **Edit Modal**: Full Name, Programme & Branch, School (SCOPE, SENSE, SITE, SELECT, SMEC, SAS, VSB), Academic Year/Semester, and Avatar presets + custom URL.

### D. FFCS Timetable Isolation (`/timetable` - `TimetablePage.tsx`)
- **Per-Student Isolation**:
  - Backend query isolation: `TimetableViewSet.get_queryset()` filters `Timetable.objects.filter(student=user)`.
  - Storage key: `vitos_timetable_${user.regNo}`.
- **Fresh Slots for New Registrations**:
  - Demo student `22BCE1024` (Chris) holds default mock course registration data.
  - Any new student registration starts with **0 courses (completely fresh/clean slot matrix)**.
  - Shows guidance banner: *"Fresh Student Timetable Matrix: You have no courses scheduled yet. Import your VTOP course registration slip to load your personalized slots."*
  - VTOP slip parser parses course codes, slots (theory & lab), venues, and maps to the grid with clash detection.

### E. AI Assistant (`/assistant` - `AiAssistantPage.tsx`)
- **Gemini 1.5 Flash Integration**:
  - API key configured via `/api/assistant/configure/`.
  - Backend service: `backend/api/services/assistant_service.py`.
- **VIT Domain Knowledge Embedded**:
  - Academic block listings (TT, SJT, PRP, SMV, MGB, MB, GDN).
  - Medical Emergency: 24/7 Medical Centre phone numbers; **Hostellers can call an ambulance directly from their hostel warden's room**.
  - 9-Pointer Attendance Rule: CGPA >= 9.00 has 100% attendance relaxation (no 75% cutoff).
  - VTOP FFCS guidance, Xerox/printing locations, Food Mall, ATM kiosks.

### F. Campus Navigation (`/map` - `MapPage.tsx`)
- **CRITICAL NOTE**: Do NOT alter the map routing engine or coordinate network in `MapPage.tsx`.
- Supports walking and driving campus routes via OpenStreetMap OSRM and backend Dijkstra graph.

---

## 3. Database Schema Overview

```
User (django.contrib.auth.models)
 ├── id, username, email, first_name, last_name, is_staff
 └── profile -> StudentProfile (OneToOne)
      ├── full_name (CharField)
      ├── reg_no (CharField)
      ├── programme (CharField)
      ├── year_semester (CharField)
      ├── avatar_url (URLField)
      ├── profile_photo (BinaryField, max 5MB)
      ├── saved_locations (JSONField)
      └── recent_searches (JSONField)

Building
 ├── name, code, lat, lng, total_floors, rooms_count
 └── rooms -> Room (ForeignKey)

Timetable
 ├── student (ForeignKey -> User, nullable)
 ├── day, slot, session_type, start_time, end_time
 ├── course_code, course_name, faculty, room_number
 └── building_code, building_name, is_next

StudentTimetable & TimetableClass (VTOP Import Engine)
 ├── StudentTimetable: user, semester, academic_year, active, version
 └── TimetableClass: timetable, course_code, course_name, faculty, venue, slot_combination, day, start_time, end_time, period, credits
```

---

## 4. API Endpoint Map

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register new student (`@vitstudent.ac.in`) |
| `POST` | `/api/auth/login/` | Unified login with email/regNo |
| `GET` | `/api/auth/me/` | Current user details |
| `GET` | `/api/admin/users/` | List all users for admin table |
| `DELETE` | `/api/admin/users/<id>/` | Delete user and related profile/timetable |
| `GET` | `/api/admin/slot-classes/` | Slot class matrix lookup |
| `GET` | `/api/admin/slots/` | List all available slot codes |
| `POST/PATCH` | `/api/users/profile/update/` | Update profile info (name, programme, year, avatar) |
| `POST` | `/api/users/profile/photo/` | Upload profile photo file |
| `GET` | `/api/buildings/` | List all campus buildings |
| `GET` | `/api/timetable/` | Student-isolated timetable entries |
| `POST` | `/api/timetable/register/` | Register VTOP timetable courses |
| `POST` | `/api/assistant/chat/` | Query Gemini AI Assistant |
| `GET` | `/api/assistant/status/` | Check Gemini engine connection |
| `POST` | `/api/assistant/configure/` | Set Gemini API key |

---

## 5. Development & Running Commands

### Starting the Servers:
```powershell
# 1. Start Django Backend (Port 8000)
cd c:\Users\chris\Documents\VITOS\backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

# 2. Start Vite Frontend (Port 5173)
cd c:\Users\chris\Documents\VITOS\frontend
npm run dev -- --host
```

### Verification Commands:
```powershell
# Validate Django DB & URLs
cd c:\Users\chris\Documents\VITOS\backend
.\venv\Scripts\python.exe manage.py check

# Build & Typecheck Frontend
cd c:\Users\chris\Documents\VITOS\frontend
npm run build
```
