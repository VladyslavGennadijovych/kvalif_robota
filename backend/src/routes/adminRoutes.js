import express from 'express';
import {
  blockUser,
  unblockUser,
  getAllJobSeekers,
  getAllEmployers,
  getAllJobs,
  blockJob,
  unblockJob,
} from '../controllers/adminController.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Користувачі
router.patch('/users/:userId/block', authMiddleware, isAdmin, blockUser);
router.patch('/users/:userId/unblock', authMiddleware, isAdmin, unblockUser);
router.get('/jobseekers', authMiddleware, isAdmin, getAllJobSeekers);
router.get('/employers', authMiddleware, isAdmin, getAllEmployers);

// Вакансії
router.get('/jobs/all', authMiddleware, isAdmin, getAllJobs);
router.patch('/jobs/:jobId/block', authMiddleware, isAdmin, blockJob);
router.patch('/jobs/:jobId/unblock', authMiddleware, isAdmin, unblockJob);

export default router;