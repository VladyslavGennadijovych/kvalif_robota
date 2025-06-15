import express from 'express';
import { upsertJobSeekerProfile, upsertEmployerProfile, getJobSeekerProfile, getEmployerProfile } from '../controllers/profileController.js';
import { authMiddleware, isEmployer, isJobSeeker } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/jobseeker', authMiddleware, isJobSeeker, upsertJobSeekerProfile);
router.post('/employer', authMiddleware, isEmployer, upsertEmployerProfile);
router.get('/jobseeker', authMiddleware, isJobSeeker, getJobSeekerProfile);
router.get('/employer', authMiddleware, isEmployer, getEmployerProfile);

export default router;