# 🚀 VIT CampusOS - How to Run & Operate the Project

This guide provides both **One-Click** and **Step-by-Step Manual** instructions for launching the entire application on Windows.

---

## ⚡ Option 1: One-Click Startup (Recommended)

Simply double-click the included batch file in the project root folder:

### 👉 **`run.bat`** (or `start-local.bat`)

When you run this file:
1. It automatically checks and activates the Python virtual environment in `backend/venv`.
2. It automatically verifies and installs backend & frontend dependencies if missing.
3. It applies any database migrations to `backend/db.sqlite3`.
4. It launches the **Django Backend** (port `8000`) in its own dedicated command window.
5. It launches the **React/Vite Frontend** (port `5173`) in its own dedicated command window.
6. It automatically opens your default web browser to **`http://localhost:5173`**.

---

## 🛠️ Option 2: Step-by-Step Manual Startup (Individual Parts)

If you prefer to start each part individually or inspect live terminal logs, use two command prompt or PowerShell windows:

### Part 1: Django Backend (Port 8000)

1. Open a terminal and navigate to the `backend` directory:
   ```cmd
   cd C:\Users\chris\Documents\VITOS\backend
   ```
2. *(First time only)* Create the virtual environment:
   ```cmd
   python -m venv venv
   ```
3. Activate the virtual environment:
   - In Command Prompt:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - In PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
     *(If PowerShell execution policy blocks scripts, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*
4. Install requirements:
   ```cmd
   pip install -r requirements.txt
   ```
5. Apply database migrations:
   ```cmd
   python manage.py migrate
   ```
6. *(Optional)* Seed demo campus classrooms, slots, locations, and users:
   ```cmd
   python manage.py seed_data
   ```
7. Start the backend development server:
   ```cmd
   python manage.py runserver 0.0.0.0:8000
   ```

**Backend Endpoints:**
- **REST API Base**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin Panel**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### Part 2: React & Vite Frontend (Port 5173)

1. Open a **second** terminal and navigate to the `frontend` directory:
   ```cmd
   cd C:\Users\chris\Documents\VITOS\frontend
   ```
2. *(First time only)* Install node modules:
   ```cmd
   npm install
   ```
3. Start the Vite development server:
   ```cmd
   npm run dev
   ```
4. Open your browser and visit:
   - **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configuration & Environment Files

### 1. Backend Environment: `backend/.env`
Located at `backend/.env`, controls email verification and AI features:

```env
# Gemini API Key (Campus AI Assistant)
GEMINI_API_KEY=your_gemini_api_key

# Gmail SMTP Configuration (For dispatching real 6-digit OTP verification codes)
EMAIL_HOST_USER=vitcampusosofficial@gmail.com
EMAIL_HOST_PASSWORD=voii fyun ttgj daac
```
> **Tip for Google App Passwords**:
> Google generates 16-character app passwords with spaces (e.g. `voii fyun ttgj daac`). The backend automatically handles and strips the internal spaces for Gmail SMTP authentication.

### 2. Frontend Environment: `frontend/.env`
Located at `frontend/.env`, controls Google Single Sign-On:

```env
# Google OAuth 2.0 Web Client ID from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

---

## 👥 Default Accounts for Testing

| Role | Email / Identifier | Password | Dashboard Access |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@vitstudent.ac.in` (or username `admin`) | `admin123` | Master `/admin` panel & classroom allocation |
| **Student (Chris)** | `chris.student2022@vitstudent.ac.in` (or `22BCE1024`) | `student123` | Student dashboard, timetable, map, AI assistant |
| **Student (Rahul)** | `rahul.sharma2023@vitstudent.ac.in` (or `23BCE0512`) | `student123` | Student dashboard, profile edit & delete |
| **Google Sign-In** | Any `@vitstudent.ac.in` Google Workspace account | Handled by Google SSO | Automatic account provisioning + onboarding |

---

## 🛑 How to Stop the Servers

- To stop the servers started via `run.bat`: Simply close the two opened command prompt windows (`VITOS Backend Server` and `VITOS Frontend Server`), or press **`Ctrl + C`** inside them.
