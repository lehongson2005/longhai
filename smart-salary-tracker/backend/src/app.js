require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { getStorageInfo } = require('./database/db');
const authRoutes = require('./routes/auth.routes');
const shiftRoutes = require('./routes/shift.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const expenseRoutes = require('./routes/expense.routes');
const adjustmentRoutes = require('./routes/adjustment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
    const storage = getStorageInfo();
    res.json({ status: 'ok', database: storage.driver, persistent: storage.persistent });
});

const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    app.use((req, res, next) => {
        if (
            req.method !== 'GET' ||
            req.path === '/api' ||
            req.path.startsWith('/api/') ||
            req.path.startsWith('/assets/')
        ) {
            return next();
        }
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

module.exports = app;
