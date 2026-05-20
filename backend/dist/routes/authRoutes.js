"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const bootstrapController_1 = require("../controllers/bootstrapController");
const validate_1 = __importDefault(require("../middleware/validate"));
const authSchemas_1 = require("../validation/authSchemas");
const userSchemas_1 = require("../validation/userSchemas");
const router = express_1.default.Router();
router.post('/register', (0, validate_1.default)(authSchemas_1.registerSchema), authController_1.register);
router.post('/login', (0, validate_1.default)(authSchemas_1.loginSchema), authController_1.login);
router.post('/bootstrap', (0, validate_1.default)(authSchemas_1.registerSchema), bootstrapController_1.bootstrapAdmin);
router.post('/refresh', (0, validate_1.default)(userSchemas_1.refreshSchema), authController_1.refresh);
router.post('/logout', (0, validate_1.default)(userSchemas_1.refreshSchema), authController_1.logout);
exports.default = router;
