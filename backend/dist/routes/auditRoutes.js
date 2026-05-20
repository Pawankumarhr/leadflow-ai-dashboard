"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const roles_1 = __importDefault(require("../middleware/roles"));
const auditController_1 = require("../controllers/auditController");
const router = express_1.default.Router();
router.use(auth_1.default, (0, roles_1.default)(['admin']));
router.get('/', auditController_1.listAuditLogs);
exports.default = router;
