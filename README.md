# VIT CampusOS — Smart Navigation & Student Assistance Platform

**VIT CampusOS** is an AI-powered smart navigation and campus assistance platform built for **VIT Vellore**.

---

## 🌟 Key Modules (Review 1 Foundation)

1. **Smart Campus Navigation (`/map`)**: Interactive Leaflet.js map centred at VIT Vellore (`12.9692, 79.1559`) featuring building markers (TT, SJT, MB, Library, FC, Hostels), route calculation, step-by-step walking guidance, distance in meters, and estimated walking time.
2. **AI Campus Assistant (`/assistant`)**: Modern AI chat interface powered by Google Gemini API & campus data engine. Answers questions like *"Where is TT-624?"*, *"Where is Medical Centre?"*, *"Find free classroom"*, and *"What is my next class?"* with interactive map links.
3. **Smart Timetable (`/timetable`)**: Class schedule dashboard highlighting next upcoming class, room number, faculty, countdown, and one-click *"Navigate to Class"*.
4. **Empty Classroom Finder (`/classrooms`)**: Search & filter available classrooms across TT, SJT, and MB by block, floor, capacity, and facilities (Projector, AC, Smart Board, Wi-Fi).
5. **Lost & Found (`/lost-found`)**: Student item recovery desk for reporting & claiming lost ID cards, calculators, electronics, and wallets.
6. **Campus Directory (`/directory`)**: Searchable directory for Medical Centre, Central Library, Printing Cell, ATMs, Examination Cell, Placement Office, and Cafeterias.
7. **User Profile (`/profile`)**: Student identity card preview (Registration No: `22BCE1024`), saved places, and recent search logs.
8. **Admin Panel (`/admin`)**: Staff administration console for managing campus buildings, rooms, directory entries, lost items, and timetable schedules.

---

## 🎨 Visual Design Palette

- **Primary Dark Teal**: `#005F73`
- **Secondary Teal**: `#0A9396`
- **Teal Accents**: `#94D2BD`, `#E8F6F6`

---

## 🚀 Quick Start Guide

### 1. Frontend Setup (Vite + React 18 + Tailwind CSS + Leaflet)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend Setup (Django REST Framework)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations api
python manage.py migrate
python manage.py seed_data
python manage.py runserver 0.0.0.0:8000
```
Open [http://localhost:8000/api/](http://localhost:8000/api/) to view Django REST endpoints.

### 3. One-Click Launcher (Windows)
Double-click `start-local.bat` or run:
```powershell
.\start-local.ps1
```
This automatically boots both Django (port 8000) and Vite (port 5173).

---

## 📊 Application Navigation Routes

| Route | Description |
|---|---|
| `/login` | Student & Admin Login Portal |
| `/dashboard` | Main Student Landing Page |
| `/map` | Leaflet.js Interactive Campus Map & Navigation |
| `/assistant` | AI Assistant Chat Interface |
| `/timetable` | Smart Timetable & Next Class Countdown |
| `/classrooms` | Empty Classroom Finder & Filters |
| `/lost-found` | Campus Lost & Found Recovery Desk |
| `/directory` | Campus Services & Facilities Directory |
| `/profile` | Student Profile & Saved Locations |
| `/admin` | Staff Management Console |
