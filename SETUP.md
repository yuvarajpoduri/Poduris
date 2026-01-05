# Quick Setup Guide

## Step 1: Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

4. Edit `.env` file with your configuration:

   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Set Cloudinary credentials (get from https://cloudinary.com)
   - Set admin email and password

5. Seed admin user:

```bash
npm run seed-admin
```

6. Start backend server:

```bash
npm run dev
```

Backend should be running on `http://localhost:5000`

## Step 2: Frontend Setup

1. Open a new terminal and navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start frontend development server:

```bash
npm run dev
```

Frontend should be running on `http://localhost:3000`

## Step 3: Access the Application

1. Open browser and go to `http://localhost:3000`
2. Register a new account or login with admin credentials
3. Start using the application!

## Important Notes

- Make sure MongoDB is running before starting the backend
- Cloudinary credentials are required for image uploads
- Admin user must be seeded before first use
- Default admin credentials are set in `.env` file

## Troubleshooting

### Backend won't start

- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 5000 is available

### Frontend won't connect to backend

- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env` (if used)
- Check browser console for CORS errors

### Image uploads not working

- Verify Cloudinary credentials in backend `.env`
- Check Cloudinary dashboard for API limits
- Ensure images are under 10MB

### Authentication issues

- Make sure admin user is seeded
- Check JWT_SECRET is set in backend `.env`
- Clear browser localStorage and try again
