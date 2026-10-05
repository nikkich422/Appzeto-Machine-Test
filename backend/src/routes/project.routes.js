import { Router } from 'express';
import { createProject, getProjects, getProjectById } from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);

export default router;
