// ============================================
// API Configuration
// ============================================
// IMPORTANT: Update this URL after deploying backend to Render
// Example: const API_URL = 'https://your-backend-name.onrender.com/api';
const API_URL = 'https://YOUR_BACKEND_URL.onrender.com/api';

// ============================================
// Utility Functions
// ============================================

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user info
function getUser() {
    return {
        email: localStorage.getItem('userEmail'),
        isAdmin: localStorage.getItem('isAdmin') === 'true'
    };
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Check if admin is logged in
function isAdmin() {
    return getUser().isAdmin;
}

// Set auth data
function setAuth(token, email, isAdmin = false) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isAdmin', isAdmin.toString());
}

// Clear auth data
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
}

// Redirect helper
function redirect(url) {
    window.location.href = url;
}

// Show message
function showMessage(elementId, message, isError = true) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${isError ? 'message-error' : 'message-success'}`;
        element.style.display = 'block';
    }
}

// Hide message
function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// API Calls
// ============================================

// Generic API call
async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }

    const config = {
        method,
        headers
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
    }

    return result;
}

// ============================================
// Auth Functions
// ============================================

// User Registration
async function registerUser(email, password) {
    return apiCall('/auth/register', 'POST', { email, password });
}

// User Login
async function loginUser(email, password) {
    const result = await apiCall('/auth/login', 'POST', { email, password });
    setAuth(result.token, result.email, false);
    return result;
}

// Admin Login
async function loginAdmin(email, password) {
    const result = await apiCall('/auth/admin-login', 'POST', { email, password });
    setAuth(result.token, result.email, true);
    return result;
}

// Logout
function logout() {
    clearAuth();
    redirect('index.html');
}

// ============================================
// Job Functions
// ============================================

// Get all jobs
async function getJobs() {
    return apiCall('/jobs');
}

// Get single job
async function getJob(jobId) {
    return apiCall(`/jobs/${jobId}`);
}

// Create job (admin)
async function createJob(jobData) {
    return apiCall('/jobs', 'POST', jobData, true);
}

// Delete job (admin)
async function deleteJob(jobId) {
    return apiCall(`/jobs/${jobId}`, 'DELETE', null, true);
}

// ============================================
// Application Functions
// ============================================

// Apply to job
async function applyToJob(jobId) {
    return apiCall('/applications', 'POST', { jobId }, true);
}

// Get user's applications
async function getMyApplications() {
    return apiCall('/applications/my', 'GET', null, true);
}

// Get applicants for job (admin)
async function getJobApplicants(jobId) {
    return apiCall(`/applications/job/${jobId}`, 'GET', null, true);
}

// Check if applied
async function checkIfApplied(jobId) {
    return apiCall(`/applications/check/${jobId}`, 'GET', null, true);
}

// ============================================
// UI Rendering Functions
// ============================================

// Render navbar based on auth state
function renderNavbar() {
    const navLinksContainer = document.getElementById('nav-links');
    if (!navLinksContainer) return;

    let html = '';

    if (isLoggedIn()) {
        if (isAdmin()) {
            html = `
                <span class="user-email">${getUser().email}</span>
                <a href="admin-dashboard.html">Dashboard</a>
                <a href="#" onclick="logout(); return false;" class="btn-nav">Logout</a>
            `;
        } else {
            html = `
                <span class="user-email">${getUser().email}</span>
                <a href="index.html">Jobs</a>
                <a href="my-applications.html">My Applications</a>
                <a href="#" onclick="logout(); return false;" class="btn-nav">Logout</a>
            `;
        }
    } else {
        html = `
            <a href="index.html">Jobs</a>
            <a href="login.html">User Login</a>
            <a href="register.html">Register</a>
            <a href="admin-login.html">Admin Login</a>
        `;
    }

    navLinksContainer.innerHTML = html;
}

// Render job card
function renderJobCard(job, userAppliedJobs = []) {
    const hasApplied = userAppliedJobs.includes(job._id);
    const isUserLoggedIn = isLoggedIn() && !isAdmin();

    let actionButton = '';
    if (isUserLoggedIn) {
        if (hasApplied) {
            actionButton = `<span class="applied-badge">✓ Applied</span>`;
        } else {
            actionButton = `<button class="btn btn-success btn-sm" onclick="handleApply('${job._id}')">Apply Now</button>`;
        }
    } else if (!isLoggedIn()) {
        actionButton = `<a href="login.html" class="btn btn-primary btn-sm">Login to Apply</a>`;
    }

    return `
        <div class="job-card" id="job-${job._id}">
            <div class="job-card-header">
                <div>
                    <h3>${escapeHtml(job.title)}</h3>
                    <span class="company">${escapeHtml(job.company)}</span>
                </div>
                <span class="job-type-badge">${escapeHtml(job.type)}</span>
            </div>
            <div class="job-meta">
                <span>📍 ${escapeHtml(job.location)}</span>
                <span>💰 ${escapeHtml(job.salary)}</span>
                <span>📅 ${formatDate(job.createdAt)}</span>
            </div>
            <p class="job-description">${escapeHtml(job.description)}</p>
            <div class="job-card-actions">
                ${actionButton}
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Page Specific Functions
// ============================================

// Load jobs for index page
async function loadJobs() {
    const jobsContainer = document.getElementById('jobs-container');
    const jobsCount = document.getElementById('jobs-count');

    if (!jobsContainer) return;

    try {
        jobsContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading jobs...</p></div>';

        const jobs = await getJobs();

        // Get user's applied jobs if logged in
        let appliedJobIds = [];
        if (isLoggedIn() && !isAdmin()) {
            try {
                const applications = await getMyApplications();
                appliedJobIds = applications.map(app => app.jobId?._id || app.jobId);
            } catch (e) {
                console.log('Could not fetch applications');
            }
        }

        if (jobs.length === 0) {
            jobsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No Jobs Available</h3>
                    <p>Check back later for new opportunities!</p>
                </div>
            `;
            if (jobsCount) jobsCount.textContent = '0 Jobs';
            return;
        }

        jobsContainer.innerHTML = jobs.map(job => renderJobCard(job, appliedJobIds)).join('');
        if (jobsCount) jobsCount.textContent = `${jobs.length} Job${jobs.length !== 1 ? 's' : ''}`;

    } catch (error) {
        jobsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Jobs</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Handle job application
async function handleApply(jobId) {
    if (!isLoggedIn()) {
        redirect('login.html');
        return;
    }

    try {
        await applyToJob(jobId);

        // Update the job card UI
        const jobCard = document.getElementById(`job-${jobId}`);
        if (jobCard) {
            const actionsDiv = jobCard.querySelector('.job-card-actions');
            actionsDiv.innerHTML = `<span class="applied-badge">✓ Applied</span>`;
        }

        alert('Application submitted successfully!');
    } catch (error) {
        alert(error.message);
    }
}

// Load my applications
async function loadMyApplications() {
    const container = document.getElementById('applications-container');
    const countEl = document.getElementById('applications-count');

    if (!container) return;

    try {
        container.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading applications...</p></div>';

        const applications = await getMyApplications();

        if (applications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Applications Yet</h3>
                    <p>You haven't applied to any jobs yet.</p>
                    <a href="index.html" class="btn btn-primary">Browse Jobs</a>
                </div>
            `;
            if (countEl) countEl.textContent = '0 Applications';
            return;
        }

        container.innerHTML = applications.map(app => {
            const job = app.jobId;
            if (!job) {
                return `
                    <div class="application-card">
                        <div class="application-info">
                            <h3>Job No Longer Available</h3>
                            <p class="applied-date">Applied on ${formatDate(app.appliedAt)}</p>
                        </div>
                        <span class="application-status">Applied</span>
                    </div>
                `;
            }
            return `
                <div class="application-card">
                    <div class="application-info">
                        <h3>${escapeHtml(job.title)}</h3>
                        <span class="company">${escapeHtml(job.company)}</span>
                        <p class="applied-date">Applied on ${formatDate(app.appliedAt)}</p>
                    </div>
                    <span class="application-status">Applied</span>
                </div>
            `;
        }).join('');

        if (countEl) countEl.textContent = `${applications.length} Application${applications.length !== 1 ? 's' : ''}`;

    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Applications</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// Admin Functions
// ============================================

// Load admin jobs
async function loadAdminJobs() {
    const container = document.getElementById('admin-jobs-list');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

        const jobs = await getJobs();

        if (jobs.length === 0) {
            container.innerHTML = '<p class="no-applicants">No jobs created yet.</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="admin-job-item" id="admin-job-${job._id}">
                <div class="admin-job-info">
                    <h4>${escapeHtml(job.title)}</h4>
                    <span>${escapeHtml(job.company)} • ${formatDate(job.createdAt)}</span>
                </div>
                <div class="admin-job-actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewApplicants('${job._id}', '${escapeHtml(job.title)}')">
                        View Applicants
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="handleDeleteJob('${job._id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<p class="no-applicants">Error: ${error.message}</p>`;
    }
}

// Handle create job form
async function handleCreateJob(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        hideMessage('create-job-message');

        const jobData = {
            title: form.title.value.trim(),
            company: form.company.value.trim(),
            location: form.location.value.trim(),
            description: form.description.value.trim(),
            salary: form.salary.value.trim() || 'Not specified',
            type: form.type.value
        };

        await createJob(jobData);

        showMessage('create-job-message', 'Job created successfully!', false);
        form.reset();
        loadAdminJobs();

    } catch (error) {
        showMessage('create-job-message', error.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle delete job
async function handleDeleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This will also remove all applications.')) {
        return;
    }

    try {
        await deleteJob(jobId);

        const jobElement = document.getElementById(`admin-job-${jobId}`);
        if (jobElement) {
            jobElement.remove();
        }

    } catch (error) {
        alert(error.message);
    }
}

// View applicants modal
async function viewApplicants(jobId, jobTitle) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (!overlay) return;

    modalTitle.textContent = `Applicants for: ${jobTitle}`;
    modalBody.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    overlay.classList.add('active');

    try {
        const applicants = await getJobApplicants(jobId);

        if (applicants.length === 0) {
            modalBody.innerHTML = '<p class="no-applicants">No applicants yet.</p>';
            return;
        }

        modalBody.innerHTML = applicants.map(app => `
            <div class="applicant-item">
                <span class="applicant-email">${escapeHtml(app.userEmail)}</span>
                <span class="applicant-date">${formatDate(app.appliedAt)}</span>
            </div>
        `).join('');

    } catch (error) {
        modalBody.innerHTML = `<p class="no-applicants">Error: ${error.message}</p>`;
    }
}

// Close modal
function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================
// Form Handlers
// ============================================

// Handle user registration form
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        hideMessage('register-message');

        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        await registerUser(email, password);

        showMessage('register-message', 'Registration successful! Redirecting to login...', false);

        setTimeout(() => {
            redirect('login.html');
        }, 1500);

    } catch (error) {
        showMessage('register-message', error.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle user login form
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        hideMessage('login-message');

        const email = form.email.value.trim();
        const password = form.password.value;

        await loginUser(email, password);

        showMessage('login-message', 'Login successful! Redirecting...', false);

        setTimeout(() => {
            redirect('index.html');
        }, 1000);

    } catch (error) {
        showMessage('login-message', error.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle admin login form
async function handleAdminLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        hideMessage('admin-login-message');

        const email = form.email.value.trim();
        const password = form.password.value;

        await loginAdmin(email, password);

        showMessage('admin-login-message', 'Admin login successful! Redirecting...', false);

        setTimeout(() => {
            redirect('admin-dashboard.html');
        }, 1000);

    } catch (error) {
        showMessage('admin-login-message', error.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============================================
// Page Protection
// ============================================

// Protect user-only pages
function requireAuth() {
    if (!isLoggedIn()) {
        redirect('login.html');
        return false;
    }
    return true;
}

// Protect admin-only pages
function requireAdmin() {
    if (!isLoggedIn() || !isAdmin()) {
        redirect('admin-login.html');
        return false;
    }
    return true;
}

// ============================================
// Initialize on page load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Render navbar on all pages
    renderNavbar();
});
