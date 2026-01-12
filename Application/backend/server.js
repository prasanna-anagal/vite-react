const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// ============================================
// CONFIGURATION (Environment Variables)
// ============================================

// MongoDB Atlas Connection String (set in Render Environment Variables)
const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb+srv://01fe23bcs097_db_user:H922BeawQCP9ZKYD@cluster0.25p2rly.mongodb.net/?appName=Cluster0";

// JWT Secret Key (set in Render Environment Variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@jobportal.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());

// ============================================
// HEALTH ENDPOINT
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Job Posting API is running!' });
});

// Auth Middleware - Verify JWT Token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Admin Middleware - Check if user is admin
const adminMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// ============================================
// MONGOOSE MODELS
// ============================================

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Job Schema
const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    salary: { type: String },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Remote'], default: 'Full-time' },
    createdAt: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', jobSchema);

// Application Schema
const applicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    userEmail: { type: String, required: true },
    jobTitle: { type: String, required: true },
    jobCompany: { type: String, required: true },
    jobLocation: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate applications
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

// ============================================
// AUTH ROUTES
// ============================================

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        // Store password as plain text (for college project)
        const user = new User({
            email: email.toLowerCase(),
            password: password
        });

        await user.save();

        res.status(201).json({ message: 'Registration successful. Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Check password (plain text for college project)
        if (password !== user.password) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: false },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, email: user.email, message: 'Login successful.' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Check admin credentials
        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
            return res.status(400).json({ error: 'Invalid admin credentials.' });
        }

        // Generate admin token
        const token = jwt.sign(
            { email: ADMIN_EMAIL, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, email: ADMIN_EMAIL, message: 'Admin login successful.' });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ============================================
// JOB ROUTES
// ============================================

// Get all jobs (public)
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get single job (public)
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found.' });
        }
        res.json(job);
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Create job (admin only)
app.post('/api/jobs', adminMiddleware, async (req, res) => {
    try {
        const { title, company, location, description, salary, type } = req.body;

        if (!title || !company || !location || !description) {
            return res.status(400).json({ error: 'Title, company, location, and description are required.' });
        }

        const job = new Job({
            title,
            company,
            location,
            description,
            salary: salary || 'Not specified',
            type: type || 'Full-time'
        });

        await job.save();
        res.status(201).json({ message: 'Job created successfully.', job });
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Delete job (admin only)
app.delete('/api/jobs/:id', adminMiddleware, async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        // Also delete all applications for this job
        await Application.deleteMany({ jobId: req.params.id });

        res.json({ message: 'Job deleted successfully.' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// APPLICATION ROUTES
// ============================================

// Apply to a job (user only)
app.post('/api/applications', authMiddleware, async (req, res) => {
    try {
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required.' });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        // Check for duplicate application
        const existingApplication = await Application.findOne({
            userId: req.user.userId,
            jobId: jobId
        });

        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied to this job.' });
        }

        // Create application with job details
        const application = new Application({
            userId: req.user.userId,
            jobId: jobId,
            userEmail: req.user.email,
            jobTitle: job.title,
            jobCompany: job.company,
            jobLocation: job.location
        });

        await application.save();
        res.status(201).json({ message: 'Application submitted successfully.' });
    } catch (error) {
        console.error('Apply error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'You have already applied to this job.' });
        }
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get user's applications
app.get('/api/applications/my', authMiddleware, async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user.userId })
            .populate('jobId')
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get applicants for a job (admin only)
app.get('/api/applications/job/:jobId', adminMiddleware, async (req, res) => {
    try {
        const applications = await Application.find({ jobId: req.params.jobId })
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error) {
        console.error('Get job applicants error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Check if user has applied to a job
app.get('/api/applications/check/:jobId', authMiddleware, async (req, res) => {
    try {
        const application = await Application.findOne({
            userId: req.user.userId,
            jobId: req.params.jobId
        });

        res.json({ hasApplied: !!application });
    } catch (error) {
        console.error('Check application error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    });
