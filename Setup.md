# 🚀 Ministry Budget App - Local Setup Guide

Complete guide to set up and run The Voice Church Ministry Budget & Planning System on your local machine.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (PostgreSQL)](#database-setup-postgresql)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **PostgreSQL** v12 or higher ([Download](https://www.postgresql.org/download/))
- **pgAdmin** (optional, for GUI database management)
- **Git** ([Download](https://git-scm.com/))
- A code editor (VS Code, Cursor IDE, etc.)

**Verify installations:**

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
psql --version    # Should be v12+
```

---

## Database Setup (PostgreSQL)

### Step 1: Create Database

**Option A: Using Command Line**

```bash
# Create database
createdb ministry_budget

# If you need to specify user:
createdb -U postgres ministry_budget
```

**Option B: Using pgAdmin**

1. Open **pgAdmin**
2. Right-click **"Databases"** → **"Create"** → **"Database"**
3. Name: `ministry_budget`
4. Click **"Save"**

### Step 2: Run Database Schema

The database schema file is located at `database/execute.sql`.

**Option A: Using Command Line**

```bash
# Navigate to project root
cd ministry-budget-app

# Run schema
psql -U postgres -d ministry_budget -f database/execute.sql

# You'll be prompted for your PostgreSQL password
```

**Option B: Using pgAdmin**

1. In pgAdmin, right-click the `ministry_budget` database
2. Select **"Query Tool"**
3. Open the `database/execute.sql` file
4. Click the **Execute button (▶)** or press **F5**

**Expected Output:**

```
✓ Database schema created successfully!
✓ Tables created: users, ministry_forms, form_data, events, goals, approvals, audit_log
✓ Default users created
```

### Step 3: Verify Database Setup

Check that tables were created:

```bash
psql -U postgres -d ministry_budget -c "\dt"
```

You should see these tables:
- users
- ministry_forms
- form_data
- events
- goals
- approvals
- audit_log
- ministries
- event_types
- pillars

---

## Backend Setup

### Step 1: Navigate to Server Directory

```bash
cd server
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express (web server)
- PostgreSQL driver (pg)
- JWT authentication (jsonwebtoken)
- Security packages (helmet, cors)
- PDF/Word export (pdfkit, docx)
- And more...

### Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
# From server directory
touch .env
```

**Edit `.env` file with the following:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ministry_budget
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_to_something_secure_and_random

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Generate JWT_SECRET:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your JWT_SECRET.

### Step 4: Verify Backend Package.json

Your `server/package.json` should look like this:

```json
{
  "name": "voice-church-api",
  "version": "2.5.0",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## Frontend Setup

### Step 1: Navigate to Client Directory

```bash
# From project root
cd client
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- React & React DOM
- React Router (navigation)
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (API calls)
- Lucide React (icons)

### Step 3: Configure Environment Variables

Create a `.env` file in the `client` directory:

```bash
# From client directory
touch .env
```

**Edit `.env` file with the following:**

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Step 4: Verify Frontend Package.json

Your `client/package.json` should look like this:

```json
{
  "name": "ministry-budget-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend Server

```bash
# Navigate to server directory
cd server

# Start development server (with auto-reload)
npm run dev

# Or start without auto-reload:
npm start
```

**Expected Output:**

```
=================================
🚀 The Voice Church - Ministry Budget API
✓ Server running on port 3001
✓ Database connected successfully
✓ Environment: development
=================================
```

Backend will be running at: `http://localhost:3001`

### Terminal 2: Start Frontend Application

```bash
# Navigate to client directory
cd client

# Start development server
npm run dev
```

**Expected Output:**

```
VITE v6.4.1  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

Frontend will be running at: `http://localhost:5173`

### Access the Application

Open your browser and navigate to:

**http://localhost:5173**

---

## Testing

### Test 1: Health Check

Verify backend is running:

```bash
curl http://localhost:3001/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-11-21T...",
  "service": "ministry-budget-api",
  "database": "connected"
}
```

### Test 2: Login

Try logging in with default credentials:

**Default Test Accounts:**

| Role | Email | PIN | Purpose |
|------|-------|-----|---------|
| Admin | admin@thevoicechurch.org | 1234 | Full system access |
| Pastor | pastor@thevoicechurch.org | 1234 | Final approval |
| Pillar | pillar1@thevoicechurch.org | 1234 | First approval |
| Ministry Leader | worship.leader@thevoicechurch.org | 1234 | Create forms |

**Using curl:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@thevoicechurch.org","pin":"1234"}'
```

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@thevoicechurch.org",
    "role": "admin",
    "name": "System Admin"
  }
}
```

### Test 3: Full Application Flow

1. **Login** at http://localhost:5173
   - Use: admin@thevoicechurch.org / 1234

2. **Dashboard** - Should load successfully

3. **Create Form**
   - Click "Create New Form"
   - Fill in ministry information
   - Navigate through all 9 sections

4. **Add Events** (Section 4)
   - Add at least 3 events with budgets
   - Verify events are saved

5. **Add Goals** (Section 5)
   - Add 3-5 SMART goals
   - Verify goals are saved

6. **Budget Summary** (Section 7)
   - Check running totals display correctly
   - Verify budget calculations

7. **Submit Form**
   - Progress should be 80%+
   - Click "Submit for Approval"

8. **Approval Flow**
   - Login as Pillar (pillar1@thevoicechurch.org / 1234)
   - Review and approve form
   - Login as Pastor (pastor@thevoicechurch.org / 1234)
   - Review and approve form

9. **View Approved Form**
   - View form in read-only mode
   - Status should show "Approved"

10. **Export**
    - Click "Export PDF"
    - Click "Export Word"
    - Verify both downloads work

---

## Troubleshooting

### Issue: "Database connection error"

**Causes:**
- PostgreSQL is not running
- Wrong credentials in `.env`
- Database doesn't exist

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   services.msc  # Look for PostgreSQL service
   
   # Mac/Linux
   sudo systemctl status postgresql
   ```

2. **Verify credentials:**
   ```bash
   psql -U postgres -d ministry_budget
   # If this works, your credentials are correct
   ```

3. **Check .env file:**
   - Ensure no extra spaces
   - Password should match PostgreSQL password
   - Database name is correct

4. **Recreate database:**
   ```bash
   dropdb ministry_budget
   createdb ministry_budget
   psql -U postgres -d ministry_budget -f database/execute.sql
   ```

---

### Issue: "Port 3001 already in use"

**Solution 1: Change Port**

Edit `server/.env`:
```env
PORT=3002
```

Don't forget to update frontend `.env`:
```env
VITE_API_URL=http://localhost:3002
```

**Solution 2: Kill Process**

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

---

### Issue: "Cannot find module 'express'"

**Solution:**

```bash
cd server
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: "Cannot find module 'react'"

**Solution:**

```bash
cd client
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: "CORS Error" in Browser Console

**Solution:**

1. Check backend CORS_ORIGIN in `server/.env`:
   ```env
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```

2. Restart backend server:
   ```bash
   # Ctrl+C to stop, then
   npm run dev
   ```

---

### Issue: Frontend shows blank page

**Check:**

1. **Browser Console** (F12) - Look for errors
2. **Backend is running** - Should see log messages
3. **API URL correct** - Check `client/.env`
4. **Clear browser cache** - Ctrl+Shift+R (hard refresh)

**Solution:**

```bash
# Restart both servers
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

---

### Issue: "relation 'users' does not exist"

**Cause:** Database schema wasn't run properly

**Solution:**

```bash
# Run schema again
psql -U postgres -d ministry_budget -f database/execute.sql
```

---

### Issue: Login fails with "Invalid credentials"

**Check:**

1. **Using correct credentials:**
   - Email: admin@thevoicechurch.org
   - PIN: 1234

2. **Database has users:**
   ```bash
   psql -U postgres -d ministry_budget -c "SELECT email, role FROM users;"
   ```

3. **Re-run database schema** if no users found:
   ```bash
   psql -U postgres -d ministry_budget -f database/execute.sql
   ```

---

### Issue: PDF Export not working

**Check:**

1. **Backend has pdfkit installed:**
   ```bash
   cd server
   npm list pdfkit docx
   ```

2. **Install if missing:**
   ```bash
   npm install pdfkit docx
   npm run dev
   ```

3. **Check backend console** for errors when exporting

---

### Issue: Running totals not showing

**Check:**

1. **Events exist** in Section 4
2. **Navigate to Section 7** to see totals
3. **Clear browser cache** and refresh
4. **Check browser console** for errors

---

## Project Structure

```
ministry-budget-app/
├── server/                      # Backend application
│   ├── routes/                  # API route handlers
│   │   ├── admin.js            # Admin endpoints
│   │   ├── forms.js            # Form CRUD
│   │   ├── events.js           # Events management
│   │   ├── goals.js            # Goals management
│   │   ├── lov.js              # List of values
│   │   ├── export-routes.js    # PDF/Word export
│   │   └── notifications.js    # Notifications
│   ├── middleware/             # Express middleware
│   │   └── validation.js       # Input validation
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # Backend configuration
│
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login components
│   │   │   ├── Dashboard/      # Dashboard components
│   │   │   ├── Forms/          # Form components
│   │   │   │   ├── sections/   # 9 form sections
│   │   │   │   ├── FormBuilder.jsx
│   │   │   │   ├── FormCreate.jsx
│   │   │   │   ├── FormView.jsx
│   │   │   │   ├── FormApproval.jsx
│   │   │   │   └── FormExport.jsx
│   │   │   ├── Admin/          # Admin components
│   │   │   └── Common/         # Shared components
│   │   ├── context/            # React context
│   │   ├── services/           # API services
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # App entry point
│   ├── package.json            # Frontend dependencies
│   └── .env                    # Frontend configuration
│
├── database/                   # Database files
│   ├── execute.sql             # Complete database schema
│   └── MIGRATION_INSTRUCTIONS.md
│
└── public/                     # Static assets
    └── assets/
        └── tvc.png             # Church logo
```

---

## Default User Accounts

The database comes with pre-configured test accounts:

| Role | Email | PIN | Full Name |
|------|-------|-----|-----------|
| **Admin** | admin@thevoicechurch.org | 1234 | System Admin |
| **Pastor** | pastor@thevoicechurch.org | 1234 | Senior Pastor |
| **Pillar** (Children) | pillar1@thevoicechurch.org | 1234 | Children's Pillar |
| **Pillar** (Youth) | pillar2@thevoicechurch.org | 1234 | Youth Pillar |
| **Pillar** (Worship) | pillar3@thevoicechurch.org | 1234 | Worship Pillar |
| **Ministry Leader** | worship.leader@thevoicechurch.org | 1234 | Worship Leader |
| **Ministry Leader** | youth.leader@thevoicechurch.org | 1234 | Youth Leader |

**⚠️ Security Note:** Change these PINs before deploying to production!

---

## Next Steps

Once your local setup is complete:

1. ✅ **Familiarize yourself** with the application
2. ✅ **Test all features** thoroughly
3. ✅ **Create custom user accounts** for your team
4. ✅ **Customize ministries and event types** in admin panel
5. ✅ **Ready for deployment?** See `Deployment.md`

---

## Getting Help

**If you encounter issues:**

1. Check this troubleshooting section
2. Review error messages carefully
3. Check both backend and frontend console logs
4. Verify all environment variables are set correctly
5. Ensure PostgreSQL is running
6. Make sure all dependencies are installed

**Common Commands:**

```bash
# Check if backend is running
curl http://localhost:3001/health

# Check PostgreSQL connection
psql -U postgres -d ministry_budget

# Reinstall dependencies
cd server && npm install
cd client && npm install

# Clear npm cache if having issues
npm cache clean --force
```

---

## ✅ Setup Complete Checklist

- [ ] Node.js v18+ installed
- [ ] PostgreSQL installed and running
- [ ] Database `ministry_budget` created
- [ ] Schema executed successfully (`execute.sql`)
- [ ] Backend dependencies installed (`server/npm install`)
- [ ] Backend `.env` configured
- [ ] Backend starts successfully (`npm run dev`)
- [ ] Frontend dependencies installed (`client/npm install`)
- [ ] Frontend `.env` configured
- [ ] Frontend starts successfully (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Can login with default credentials
- [ ] Can create and submit a form
- [ ] Can approve forms
- [ ] Can export PDF/Word

**When all boxes are checked, your local setup is complete! 🎉**

---

*Last Updated: November 2024*
*Version: 2.5.0*

