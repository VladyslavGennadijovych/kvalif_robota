import db from '../models/db.js';

// Блокування користувача
export const blockUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query('UPDATE Users SET blocked = TRUE WHERE user_id = ?', [userId]);
    res.json({ message: 'Користувача заблоковано.' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

// Розблокування користувача
export const unblockUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query('UPDATE Users SET blocked = FALSE WHERE user_id = ?', [userId]);
    res.json({ message: 'Користувача розблоковано.' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

// Список всіх пошукачів роботи
export const getAllJobSeekers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.blocked, u.registration_date
       FROM Users u
       WHERE u.role = 'job_seeker'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

// Список всіх роботодавців
export const getAllEmployers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.blocked, u.registration_date, e.company_name
       FROM Users u
       JOIN EmployerProfiles e ON u.user_id = e.user_id
       WHERE u.role = 'employer'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

// Блокування роботи
export const blockJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    await db.query('UPDATE Jobs SET blocked = TRUE WHERE job_id = ?', [jobId]);
    res.json({ message: 'Вакансію заблоковано.' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

// Розблокування роботи
export const unblockJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    await db.query('UPDATE Jobs SET blocked = FALSE WHERE job_id = ?', [jobId]);
    res.json({ message: 'Вакансію розблоковано.' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.job_id, j.title, j.blocked, j.status, j.posting_date, e.company_name, c.name AS category_name
       FROM Jobs j
       JOIN EmployerProfiles e ON j.employer_id = e.user_id
       JOIN JobCategories c ON j.category_id = c.category_id`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};