# ChatApp - SQLite

## Run Locally

### Backend
```
cd backend
npm install
node server.js
```
Server runs on http://localhost:10000

### Frontend (new terminal)
```
cd frontend
npm install --legacy-peer-deps
npm start
```
App opens at http://localhost:3000

## Environment Variables

### Backend (backend/.env) - already created
- PORT=10000
- JWT_SECRET=your_secret_here

### Frontend (frontend/.env) - already created
- DISABLE_ESLINT_PLUGIN=true
- REACT_APP_API_URL=http://localhost:10000

## Deploy
- Backend → Render.com (set FRONTEND_URL env var to your Vercel URL)
- Frontend → Vercel (set REACT_APP_API_URL to your Render URL)
