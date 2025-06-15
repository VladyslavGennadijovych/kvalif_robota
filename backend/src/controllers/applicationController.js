import db from '../models/db.js';
import { sendMail } from '../services/emailService.js';

const applyForJob = async (req, res) => {
  const jobSeekerId = req.userId; 
  const { job_id } = req.body;
  console.log(req.userId);
  console.log(req.body);

  try {
    const [existingApplication] = await db.query('SELECT * FROM Applications WHERE job_seeker_id = ? AND job_id = ?', [jobSeekerId, job_id]);
    if (existingApplication.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const [result] = await db.query(
      'INSERT INTO Applications (job_seeker_id, job_id) VALUES (?, ?)',
      [jobSeekerId, job_id]
    );

    res.status(201).json({ message: 'Application submitted successfully.', applicationId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getJobSeekerApplications = async (req, res) => {
  const jobSeekerId = req.userId;

  try {
    const [applications] = await db.query(
      `SELECT 
         a.application_id,
         a.job_id,
         a.status,
         a.application_date,
         j.title AS job_title,
         j.location,
         j.employment_type,
         j.salary,
         j.salaryMax
       FROM Applications a
       JOIN Jobs j ON a.job_id = j.job_id
       WHERE a.job_seeker_id = ?
       ORDER BY a.application_date DESC`,
      [jobSeekerId]
    );

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


const manageApplication = async (req, res) => {
  const employerId = req.userId;
  const { application_id, status } = req.body;

  const applicationId = application_id;

  if (status !== 'accepted' && status !== 'rejected') {
    return res.status(400).json({ message: 'Invalid status. Must be either "accepted" or "rejected".' });
  }

  try {
    const [application] = await db.query('SELECT * FROM Applications WHERE application_id = ?', [applicationId]);
    if (application.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const applicationData = application[0];
    const [jobPosting] = await db.query('SELECT * FROM Jobs WHERE job_id = ?', [applicationData.job_id]);
    if (jobPosting.length === 0 || jobPosting[0].employer_id !== employerId) {
      return res.status(403).json({ message: 'You are not authorized to manage this application.' });
    }

    await db.query('UPDATE Applications SET status = ? WHERE application_id = ?', [status, applicationId]);

    // Відправка листа
    const [userRows] = await db.query('SELECT email, first_name FROM Users WHERE user_id = ?', [applicationData.job_seeker_id]);
    const user = userRows[0];
    const job = jobPosting[0];

    if (user && user.email) {
      const statusText = status === 'accepted' ? 'прийнята' : 'відхилена';
      const jobLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/job/${job.job_id}`;
      const subject = `Ваша заявка на вакансію "${job.title}" була розглянута`;
      const html = `
        <p>Ваша заявка на вакансію <b>${job.title}</b> була <b>${statusText}</b>.</p>
        <p>Детальніше ви можете переглянути за <a href="${jobLink}">цим посиланням</a>.</p>
      `;
      await sendMail({ to: user.email, subject, html });
    }

    res.json({ message: `Application ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getJobApplications = async (req, res) => {
  const employerId = req.userId;
  const { job_id } = req.params;

  try {
    // Перевіряємо, чи вакансія належить поточному роботодавцю
    const [jobRows] = await db.query(
      'SELECT * FROM Jobs WHERE job_id = ? AND employer_id = ?',
      [job_id, employerId]
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ message: 'Job not found or you are not authorized to view applications for this job.' });
    }
    const job = jobRows[0];

    // Отримуємо всі заявки на цю вакансію
    const [applications] = await db.query(
      `SELECT 
        a.application_id, a.job_seeker_id, a.status, a.application_date
      FROM Applications a
      WHERE a.job_id = ?`,
      [job_id]
    );

    // Для кожної заявки отримуємо користувача, профіль та всі його резюме
    const detailedApplications = await Promise.all(applications.map(async (app) => {
      // Інформація про користувача
      const [userRows] = await db.query(
        'SELECT user_id, first_name, last_name, email, phone FROM Users WHERE user_id = ?',
        [app.job_seeker_id]
      );
      const user = userRows[0] || {};

      // Профіль пошукача роботи
      const [profileRows] = await db.query(
        `SELECT 
          prefered_category_1, prefered_category_2, skills, experience, city, 
          experience_text, education, expectations, portfolio 
         FROM JobSeekerProfiles WHERE user_id = ?`,
        [app.job_seeker_id]
      );
      const profile = profileRows[0] || {};

      // Всі резюме користувача
      const [resumes] = await db.query(
        'SELECT resume_id, title, resume_file, upload_date FROM Resumes WHERE job_seeker_id = ?',
        [app.job_seeker_id]
      );

      return {
        application_id: app.application_id,
        status: app.status,
        application_date: app.application_date,
        user: {
          ...user,
          profile,
          resumes: resumes || []
        }
      };
    }));

    res.json({
      job,
      applications: detailedApplications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export { applyForJob, manageApplication, getJobSeekerApplications, getJobApplications };