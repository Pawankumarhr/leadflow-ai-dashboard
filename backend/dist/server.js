"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check route (before DB connection)
app.get('/health', (_req, res) => {
    res.json({ status: 'Server is running' });
});
// Placeholder routes
app.get('/api/test', (_req, res) => {
    res.json({ message: 'Backend API is working' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/leads', leadRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/audit-logs', auditRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start server and connect to DB
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
console.log('Connecting to MongoDB...');
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
})
    .catch((err) => {
    console.log('❌ MongoDB connection failed:', err.message);
});
exports.default = app;
