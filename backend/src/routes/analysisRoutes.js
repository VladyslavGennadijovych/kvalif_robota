import express from 'express';
import { getApplicationsStats } from '../controllers/analysisController.js';

const router = express.Router();

router.get('/applications', getApplicationsStats);

export default router;