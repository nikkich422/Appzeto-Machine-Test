import { Router } from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  addMember,
  removeMember,
} from '../controllers/organization.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createOrganization);
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
