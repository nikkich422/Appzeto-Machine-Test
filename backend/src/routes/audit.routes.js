import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAuditLogs);

export default router;
