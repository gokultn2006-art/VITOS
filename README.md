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
## SCM & CI/CD Demonstration Guide

This section explains how to run VITOS, execute the Jenkins CI/CD pipeline, create a Django administrator account, and verify the deployment.

### 1. Project Overview

VITOS is a campus mapping and navigation web application. The project uses Docker to containerize the frontend and backend, and Jenkins to automate building, testing, deployment, and verification.

**Technologies used**
- Frontend: React, TypeScript, Vite, and Nginx
- Backend: Django and Django REST Framework
- Database: SQLite with a persistent Docker volume
- Containerization: Docker and Docker Compose
- CI/CD: Jenkins
- Version control: Git and GitHub

### 2. Prerequisites

Install and configure the following tools:

- Git
- Docker Desktop
- Docker Compose
- Jenkins
- A web browser

Ensure Docker Desktop is running and Jenkins is accessible.

### 3. Run VITOS Using Docker Compose

Clone the repository and navigate to the project directory:

```powershell
git clone https://github.com/zCr1z/VITOS.git
cd VITOS
```

Build the images and start the containers:

```powershell
docker-compose up --build -d
```

Check the container status:

```powershell
docker-compose ps
```

View the backend logs:

```powershell
docker-compose logs --tail 50 backend
```

View the frontend logs:

```powershell
docker-compose logs --tail 50 frontend
```

**Application URLs**

- VITOS frontend: http://localhost:8080
- Django administration: http://localhost:8080/admin/

The frontend is served through Nginx, which forwards API and administration requests to the Django backend.

### 4. Create a Django Superuser

A Django superuser account allows an administrator to log in to the Django administration interface.

First, ensure the backend container is running:

```powershell
docker-compose ps
```

Create the account:

```powershell
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts to enter a username, email address, and password.

If Django reports that the username already exists, use the existing account or choose another username.

Open the administration interface:

http://localhost:8080/admin/

Log in using the credentials created above.

**Important:** The superuser is stored in the database used by that backend container. The local development database and Docker database may contain different users. The Docker database is persisted using the `vitos_database` volume.

Do not run `docker-compose down -v` during the demonstration, as removing volumes can delete the persistent database and its administrator account.

### 5. Run the Jenkins CI/CD Pipeline

Open Jenkins:

http://localhost:8085

1. Sign in using your Jenkins account.
2. Open the **VITOS Docker CI-CD** job.
3. Click **Build Now** to start a pipeline execution.
4. Open the latest build.
5. Select **Console Output** to inspect the execution logs.
6. Confirm that the pipeline finishes with `Finished: SUCCESS`.

The pipeline demonstrates the following stages:

1. **Checkout:** Retrieves the source code from the GitHub repository.
2. **Docker Check:** Verifies that Docker and Docker Compose are available.
3. **Backend Build:** Builds the Django backend image.
4. **Backend Checks and Tests:** Runs Django system checks and automated tests.
5. **Build Images:** Builds the backend and frontend images.
6. **Deploy:** Starts or updates the application using Docker Compose.
7. **Verify:** Checks that the frontend and Django administration endpoint return successful HTTP responses.

The successful pipeline run also reported that all 20 backend tests passed.

### 6. Demonstrate Source Code Integration

To demonstrate the source-control workflow:

1. Make a small, harmless change to the README.
2. Commit and push the change to the `main` branch.
3. Open Jenkins and click **Build Now**.
4. Inspect the console output to confirm that Jenkins checks out the updated commit.
5. Verify that the pipeline completes successfully.

The current demonstration uses a manually triggered Jenkins build. Automatic builds on every push require a configured GitHub webhook or polling mechanism.

### 7. Verify the Deployment

After a successful build, perform these checks:

- Open http://localhost:8080 and verify that the VITOS frontend loads.
- Test the available campus map and navigation features.
- Open http://localhost:8080/admin/ and verify that the Django administration login page loads.
- Log in using the Docker database's superuser credentials.
- Run `docker-compose ps` and confirm that the frontend and backend containers are running.
- Inspect the Jenkins console output for successful tests, deployment, and HTTP verification.

To check database persistence, restart the containers without deleting their volumes:

```powershell
docker-compose restart
docker-compose ps
```

Verify that the application is available again and that the administrator account still works.

### 8. Evidence to Capture for Evaluation

Capture screenshots showing:

1. The GitHub repository and committed Docker/CI configuration files.
2. The Jenkins job and successful pipeline stages.
3. Console output showing the Django system check and passing tests.
4. Console output showing successful HTTP verification.
5. Docker Compose output showing the running frontend and backend containers.
6. The VITOS application running in the browser.
7. The Django administration page after successful login.
8. A subsequent Jenkins build after a README change has been pushed.

### 9. Troubleshooting

**Backend container is not running**

```powershell
docker-compose logs --tail 100 backend
```

**Frontend is unavailable**

```powershell
docker-compose logs --tail 100 frontend
```

**Jenkins build fails**

Open the failed build's Console Output and inspect the first error message. Check that Docker Desktop is running, the repository is accessible, and the Jenkins pipeline configuration is correct.

**Superuser login fails**

Ensure that the account was created inside the Docker backend using `docker-compose exec backend python manage.py createsuperuser`. Creating an account in the local development environment does not automatically create it in the Docker database.

---

**Expected outcome:** VITOS runs through Docker Compose, Jenkins successfully builds and tests the application, the deployment is verified through HTTP checks, and an administrator can access the Django administration interface.
