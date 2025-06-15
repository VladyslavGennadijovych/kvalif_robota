import db from '../models/db.js';
import path from 'path';
import fs from 'fs';

const createResume = async (req, res) => {
  const userId = req.userId;
  const file = req.file;
  console.log(req.file.originalname)

  if (!file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  try {
    const fileName = `${userId}_${Date.now()}_${file.originalname}`;
    const filePath = path.join(process.cwd(), 'uploads/resumes', fileName);
    const title = file.originalname;

    fs.renameSync(file.path, filePath);

    const [result] = await db.query(
      'INSERT INTO Resumes (job_seeker_id, title, resume_file) VALUES (?, ?, ?)',
      [userId, title, fileName]
    );

    res.status(201).json({ message: 'Resume uploaded successfully.', resumeId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteResume = async (req, res) => {
  const userId = req.userId; 
  const { id } = req.params;

  try {
    const [resume] = await db.query('SELECT * FROM Resumes WHERE resume_id = ?', [id]);
    if (!resume.length) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    if (resume[0].job_seeker_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this resume.' });
    }

    const filePath = path.join(process.cwd(), 'uploads/resumes', resume[0].resume_file); // оновлено для надійності
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.query('DELETE FROM Resumes WHERE resume_id = ?', [id]);

    res.json({ message: 'Resume deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


const getResumes = async (req, res) => {
  const userId = req.userId;

  try {
    const [resumes] = await db.query('SELECT * FROM Resumes WHERE job_seeker_id = ?', [userId]);

    res.json({ resumes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getResumeFile = async (req, res) => {
  const { resume_id } = req.params;

  console.log(resume_id);

  try {
    const [resume] = await db.query('SELECT * FROM Resumes WHERE resume_id = ?', [resume_id]);

    if (!resume.length) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    const filePath = path.join(process.cwd(), 'uploads/resumes', resume[0].resume_file);
    console.log(filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found on server.' });
    }

    res.sendFile(resume[0].resume_file, {
      root: path.join(process.cwd(), 'uploads', 'resumes'),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while retrieving file.' });
  }
};

const getResume = async (req, res) => {
  const { id } = req.params;

  try {
    const [resume] = await db.query('SELECT * FROM Resumes WHERE resume_id = ?', [id]);
    if (!resume.length) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    res.json(resume[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export { createResume, deleteResume, getResumes, getResumeFile, getResume };
