# SmartTeach School Management System

A comprehensive full-stack school management system for managing pupils, staff, registrations, timetables, and more.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

### Setup Instructions

#### 1. Database Setup
1. Open **pgAdmin** or **psql**
2. Connect to your PostgreSQL server
3. Run the database setup script:
   ```sql
   -- In pgAdmin: Open Query Tool and execute database-setup.sql
   -- In psql: Run the command below
   psql -U postgres -f database-setup.sql
   ```

#### 2. Start the Application

**Option A: Using PowerShell (Recommended for Windows)**
```powershell
.\start-smartteach.ps1
```

**Option B: Using Batch File**
```cmd
start-smartteach.bat
```

**Option C: Manual Start**
```powershell
# Terminal 1 - Backend
cd school-management-system
npm install
npm run dev

# Terminal 2 - Frontend
cd school-management-system/client
npm install
npm start
```

#### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📋 Default Configuration

**Database:**
- Database Name: `smartTeach`
- Username: `school_user`
- Password: `123`
- Host: `localhost`
- Port: `5432`

**Default Login:**
You'll need to create an admin user first. See the **Initial Setup** section below.

## 🔧 Initial Setup

### Create First Admin User

After setting up the database, create your first superuser by running this SQL:

```sql
-- Connect to smartTeach database
-- Insert a staff member
INSERT INTO staff (id, first_name, last_name, staff_id, is_teaching_staff, status)
VALUES (gen_random_uuid(), 'Admin', 'User', 'ADMIN001', false, 'Active')
RETURNING id;

-- Note the returned UUID, then use it in the next query
-- Create a user account (replace 'YOUR-STAFF-UUID-HERE' with the UUID from above)
INSERT INTO users (username, password_hash, display_name, is_superuser, staff_id)
VALUES (
    'admin',
    '$2b$10$rH8qvXJZqYQxVqZ1XqJ5j.HxQVKZxZxqYQxVqZ1XqJ5j.HxQVKZxZ', -- password: admin123
    'System Administrator',
    true,
    'YOUR-STAFF-UUID-HERE'
);
```

Or use bcrypt to hash your own password:
```javascript
const bcrypt = require('bcrypt');
const password = 'your-password';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

## 📁 Project Structure

```
SmartTeach/
├── database-setup.sql           # Database creation script
├── start-smartteach.ps1         # PowerShell startup script
├── start-smartteach.bat         # Batch startup script
├── school-management-system/    # Backend (Node.js/Express)
│   ├── src/
│   │   ├── app.ts              # Main Express server
│   │   ├── db.ts               # Database connection
│   │   ├── modules/            # API modules
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── tsconfig.json
└── school-management-system/client/  # Frontend (React)
    ├── src/
    │   ├── App.tsx             # Main application
    │   ├── context/            # React context
    │   ├── modules/            # Feature modules
    │   └── utils/              # Utilities
    ├── package.json
    └── tsconfig.json
```

## 🎓 Features

- **Pupil Management** - Comprehensive student records with photos, parents/guardians
- **Staff Management** - Employee records with qualifications and schedules
- **Registration** - Daily attendance tracking with flexible codes
- **Room Management** - Buildings and classroom organization
- **Seat Planning** - Visual seating arrangements
- **Timetable Manager** - Schedule management for staff and pupils
- **Teaching Management** - Subjects, sets (classes), teacher/pupil allocation
- **Cover Management** - Staff absence tracking and cover allocation
- **Control Panel** - User management and permissions (Admin only)
- **Role-Based Access Control** - Module-level view/edit permissions

## 🔐 Security Notes

⚠️ **Important**: The default database password (`123`) is for development only. 
For production use:
1. Change the database password
2. Use environment variables for sensitive data
3. Update connection strings in backend code
4. Enable SSL for database connections

## 🛠️ Development

### Backend Development
```bash
cd school-management-system
npm install
npm run dev    # Runs with ts-node for development
npm start      # Compiles TypeScript and runs production build
```

### Frontend Development
```bash
cd school-management-system/client
npm install
npm start      # Starts development server on port 3001
npm build      # Creates production build
```

## 📝 Environment Variables (Optional)

Create a `.env` file in `school-management-system/`:

```env
PORT=3000
DB_USER=school_user
DB_HOST=localhost
DB_NAME=smartTeach
DB_PASSWORD=123
DB_PORT=5432
JWT_SECRET=your_secret_key_here
```

Then update `src/db.ts` to use these variables.

## 🐛 Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running
- Verify database exists: `psql -U postgres -l`
- Check credentials in `src/db.ts`

**Port already in use:**
- Backend: Change `PORT` in `src/app.ts`
- Frontend: Set `PORT=3002` in `client/.env`

**Missing dependencies:**
- Run `npm install` in both backend and frontend directories

**bcrypt errors on Windows:**
- Install windows-build-tools: `npm install --global windows-build-tools`
- Or use: `npm install bcrypt --build-from-source`
