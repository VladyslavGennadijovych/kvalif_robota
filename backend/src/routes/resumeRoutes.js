import express from 'express';
import multer from 'multer';
import { createResume, deleteResume, getResumes, getResumeFile, getResume } from '../controllers/resumeController.js';
import { authMiddleware, isJobSeeker } from '../middlewares/authMiddleware.js';

const router = express.Router();

const upload = multer({ dest: 'temp/' });

router.post('/', authMiddleware, isJobSeeker, upload.single('resumeFile'), createResume);
router.get('/:resume_id/file', getResumeFile);
router.get('/:id', getResume);
router.get('/', authMiddleware, isJobSeeker, getResumes);
//router.post('/', authMiddleware, isJobSeeker, createResume);
router.delete('/:id', authMiddleware, isJobSeeker, deleteResume);

export default router;
