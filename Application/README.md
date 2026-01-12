# Job Posting Application - Render Deployment

This folder contains a **ready-to-deploy** version of the Job Posting application for [Render](https://render.com).

## 📁 Folder Structure

```
Application/
├── backend/          → Node.js Express API (Deploy as Web Service)
│   ├── server.js
│   └── package.json
├── frontend/         → Static HTML/CSS/JS (Deploy as Static Site)
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── admin-login.html
│   ├── admin-dashboard.html
│   ├── my-applications.html
│   ├── app.js
│   └── style.css
└── README.md
```

---

## 🚀 Deployment Steps

### Step 1: Set Up MongoDB Atlas (Free Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new **Free Cluster** (M0 Sandbox)
3. Click **Connect** → **Connect your application**
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jobportal`)
5. Replace `<password>` with your actual password
6. Save this URL for later

---

### Step 2: Deploy Backend (Web Service)

1. Go to [Render](https://render.com) and sign up/login
2. Click **New** → **Web Service**
3. Connect your GitHub repository or use **Manual Deploy**

**If using GitHub:**
- Connect your repo
- Set **Root Directory** to: `Application/backend`

**If using Manual Deploy:**
- Upload the `Application/backend` folder

4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `job-posting-api` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Add **Environment Variables** (click "Advanced"):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://01fe23bcs097_db_user:H922BeawQCP9ZKYD@cluster0.25p2rly.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | `your-secret-key-12345` |
| `ADMIN_EMAIL` | `admin@jobportal.com` |
| `ADMIN_PASSWORD` | `Admin@123` |

6. Click **Create Web Service**
7. Wait for deployment (takes 2-5 minutes)
8. **Copy your backend URL** (e.g., `https://job-posting-api.onrender.com`)

---

### Step 3: Update Frontend API URL

1. Open `Application/frontend/app.js`
2. Find line 4 and update the API_URL:

```javascript
// BEFORE
const API_URL = 'https://YOUR_BACKEND_URL.onrender.com/api';

// AFTER (use your actual backend URL)
const API_URL = 'https://job-posting-api.onrender.com/api';
```

3. Save the file

---

### Step 4: Deploy Frontend (Static Site)

1. Go to Render Dashboard
2. Click **New** → **Static Site**
3. Connect your GitHub repository or use **Manual Deploy**

**If using GitHub:**
- Connect your repo
- Set **Root Directory** to: `Application/frontend`

**If using Manual Deploy:**
- Upload the `Application/frontend` folder

4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `job-posting-frontend` |
| **Build Command** | Leave empty (no build needed) |
| **Publish Directory** | `.` |

5. Click **Create Static Site**
6. Wait for deployment (takes 1-2 minutes)
7. Your site is live! 🎉

---

## 🔗 Your URLs After Deployment

| Component | URL |
|-----------|-----|
| **Frontend** | `https://job-posting-frontend.onrender.com` |
| **Backend API** | `https://job-posting-api.onrender.com` |
| **Health Check** | `https://job-posting-api.onrender.com/health` |

---

## 👤 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@jobportal.com` | `Admin@123` |
| **Users** | Register new users via the Register page |

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Cold Starts**: Free services "spin down" after 15 minutes of inactivity. First request may take 30-60 seconds.
- **Database**: MongoDB Atlas M0 has 512MB storage limit (plenty for demo)

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens |
| `ADMIN_EMAIL` | Optional | Admin login email (default: admin@jobportal.com) |
| `ADMIN_PASSWORD` | Optional | Admin login password (default: Admin@123) |
| `PORT` | No | Server port (Render sets this automatically) |

---

## 🧪 Testing Your Deployment

1. **Health Check**: Visit `https://your-backend.onrender.com/health`
   - Should return: `{"status":"healthy",...}`

2. **Frontend**: Visit `https://your-frontend.onrender.com`
   - Homepage should load with jobs

3. **Admin Login**: Go to Admin Login page
   - Use: `admin@jobportal.com` / `Admin@123`
   - Create some job postings

4. **User Registration**: Register a new user and apply to jobs

---

## 🔧 Troubleshooting

### "Error loading jobs" on frontend
- Make sure you updated `API_URL` in `app.js` with your actual backend URL
- Check backend logs in Render dashboard

### "MongoDB connection error" in backend logs
- Verify your MongoDB Atlas connection string is correct
- Make sure your IP is whitelisted (Atlas → Network Access → Add `0.0.0.0/0`)

### Backend takes long to respond
- This is normal on free tier (cold start). Wait 30-60 seconds for first request.

---

## 📝 Service Model Classification

| Layer | Component | Service Model |
|-------|-----------|---------------|
| Frontend | Static Site on Render | **PaaS** |
| Backend | Web Service on Render | **PaaS** |
| Database | MongoDB Atlas | **DBaaS** (Database as a Service) |

Render is a **PaaS (Platform as a Service)** provider - you deploy your code and they handle the infrastructure.

---

**Enjoy your deployed Job Portal! 🎉**
