import { Router } from 'express';
import { createJob, updateJob, updateJobStatus, getEmployerJobs, getJobsByCategory, getJobById, getLatestJobs } from '../controllers/jobController.js';
import { authMiddleware, authMiddlewareNotReq, isEmployer } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/suggested', authMiddlewareNotReq, getLatestJobs);
router.get('/my', authMiddleware, isEmployer, getEmployerJobs);
router.get('/:id', getJobById);
router.post('/', authMiddleware, isEmployer, createJob);
router.put('/:id', authMiddleware, isEmployer, updateJob);
router.put('/:id/status', authMiddleware, isEmployer, updateJobStatus);
router.get('/category/:id', getJobsByCategory);

export default router;