import express from 'express';
import { applyForJob, manageApplication, getJobSeekerApplications, getJobApplications } from '../controllers/applicationController.js';
import { authMiddleware, isEmployer, isJobSeeker } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/apply', authMiddleware, isJobSeeker, applyForJob);
router.post('/manage', authMiddleware, isEmployer, manageApplication);
router.get('/my', authMiddleware, isJobSeeker, getJobSeekerApplications);
router.get('/:job_id', authMiddleware, isEmployer, getJobApplications);

export default router;
