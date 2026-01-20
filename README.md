# Poduris - Private Family Management Application

A comprehensive MERN stack application for managing family trees, events, and memories.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based with role-based access control
- **Media Storage**: Cloudinary API

## Project Structure

```
Poduris/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── familyMemberController.js
│   │   ├── announcementController.js
│   │   ├── galleryController.js
│   │   └── calendarController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── FamilyMember.js
│   │   ├── User.js
│   │   ├── Announcement.js
│   │   └── Gallery.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── familyMemberRoutes.js
│   │   ├── announcementRoutes.js
│   │   ├── galleryRoutes.js
│   │   └── calendarRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── familyRelations.js
│   │   └── uploadImage.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── CalendarCell.tsx
    │   │   ├── Layout.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── admin/
    │   │       ├── AdminFamilyMembers.tsx
    │   │       ├── AdminAnnouncements.tsx
    │   │       └── AdminGallery.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── FamilyView.tsx
    │   │   ├── Calendar.tsx
    │   │   ├── Gallery.tsx
    │   │   ├── Announcements.tsx
    │   │   └── Admin.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── utils/
    │   │   └── api.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    └── vite.config.ts
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/poduris

JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=admin@poduris.com
ADMIN_PASSWORD=admin123
```

4. Seed the admin user:

```bash
npm run seed-admin
```

5. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

### 1. Dashboard

- Total family members count
- Total generations count
- Upcoming birthdays (next 30 days)
- Upcoming anniversaries (next 30 days)

### 2. Generation-wise Family View

- Filter family members by generation
- Display members in cards with avatars
- Click to view detailed information including:
  - Bio
  - Parents
  - Spouse
  - Children

### 3. Calendar

- Monthly calendar view
- Toggle birthdays and anniversaries
- Visual indicators with animations

### 4. Gallery

- Image upload and management
- Grid layout with modal preview
- Image metadata storage

### 5. Announcements

- Category-based announcements
- Admin can add, edit, delete
- Family members can view

### 6. Admin Panel

- Protected admin-only routes
- Manage family members
- Upload avatars
- Manage announcements
- Manage gallery

## Design System

- **Color Scheme**: Black and white only
- **Accent Colors**: Blue, Orange, Yellow (for small buttons, icons, hover states only)
- **No gradients or colorful backgrounds**
- **Minimal, clean UI**

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Family Members

- `GET /api/family-members` - Get all members
- `GET /api/family-members/:id` - Get single member with relationships
- `GET /api/family-members/generation/:generation` - Get members by generation
- `GET /api/family-members/stats/dashboard` - Get dashboard statistics
- `POST /api/family-members` - Create member (Admin only)
- `PUT /api/family-members/:id` - Update member (Admin only)
- `DELETE /api/family-members/:id` - Delete member (Admin only)

### Announcements

- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (Admin only)
- `PUT /api/announcements/:id` - Update announcement (Admin only)
- `DELETE /api/announcements/:id` - Delete announcement (Admin only)

### Gallery

- `GET /api/gallery` - Get all images
- `GET /api/gallery/:id` - Get single image
- `POST /api/gallery` - Upload image (Admin only)
- `PUT /api/gallery/:id` - Update image (Admin only)
- `DELETE /api/gallery/:id` - Delete image (Admin only)

### Calendar

- `GET /api/calendar/events` - Get calendar events
  - Query params: `month`, `year`, `includeBirthdays`, `includeAnniversaries`

## Family Member Schema

```javascript
{
  _id: ObjectId,
  id: number,                // custom numeric family ID
  name: string,
  birthDate: string,         // YYYY-MM-DD
  deathDate: string | null,
  gender: "male" | "female" | "other",
  parentId: number | null,   // refers to another member's `id`
  spouseId: number | null,   // refers to another member's `id`
  generation: number,
  avatar: string,            // Cloudinary image URL
  occupation: string,
  location: string,
  bio: string
}
```

## Family Relationships

Relationships are derived dynamically using:

- `id` - Unique family member identifier
- `parentId` - Reference to parent's `id`
- `spouseId` - Reference to spouse's `id`

Helper functions in `backend/utils/familyRelations.js`:

- `getParents()` - Get parents of a member
- `getSpouse()` - Get spouse of a member
- `getChildren()` - Get children of a member
- `getSiblings()` - Get siblings of a member
- `getAnniversaryDate()` - Calculate anniversary date from spouse relationship

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization (Admin vs Family Member)
- Input validation on all endpoints
- Environment variables for sensitive data
- Protected routes on frontend

## Notes

- The application uses a black and white design system with minimal accent colors
- All family relationships are computed dynamically from the schema
- Cloudinary integration is set up but requires proper configuration
- Admin user must be seeded before first use
- MongoDB connection string must be configured in `.env`

## License

Private family management application - All rights reserved
