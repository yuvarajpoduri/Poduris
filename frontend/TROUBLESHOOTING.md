# Troubleshooting: Nothing Displaying on localhost:3000

## Quick Fixes

### 1. Install Dependencies
If you haven't installed dependencies yet:
```bash
cd frontend
npm install
```

### 2. Start the Dev Server
Make sure the dev server is running:
```bash
cd frontend
npm run dev
```

### 3. Check Browser Console
Open browser DevTools (F12) and check the Console tab for any errors.

### 4. Common Issues

#### Issue: Blank White Screen
- Check browser console for JavaScript errors
- Verify all dependencies are installed: `npm install`
- Clear browser cache and hard refresh (Ctrl+Shift+R)

#### Issue: "Cannot find module" errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

#### Issue: Theme Context Error
- Make sure `src/context/ThemeContext.tsx` exists
- Check that ThemeProvider wraps the app in `App.tsx`

#### Issue: Missing Icons
- Verify `lucide-react` is installed: `npm list lucide-react`
- If missing, install: `npm install lucide-react`

#### Issue: Framer Motion Error
- Verify `framer-motion` is installed: `npm list framer-motion`
- If missing, install: `npm install framer-motion`

### 5. Verify File Structure
Make sure these files exist:
- `src/context/ThemeContext.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/MemberSearch.tsx`
- `src/components/Layout.tsx`
- `src/App.tsx`
- `src/main.tsx`

### 6. Check Backend
Make sure the backend is running on port 5000:
```bash
cd backend
npm run dev
```

### 7. Network Issues
- Check if API calls are failing (Network tab in DevTools)
- Verify backend is accessible at `http://localhost:5000`
- Check CORS settings if API calls fail

## Still Not Working?

1. **Check the terminal** where `npm run dev` is running for any error messages
2. **Check browser console** (F12) for JavaScript errors
3. **Try a different browser** to rule out browser-specific issues
4. **Restart the dev server**: Stop it (Ctrl+C) and run `npm run dev` again













