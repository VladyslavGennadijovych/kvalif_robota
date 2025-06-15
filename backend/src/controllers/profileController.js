import db from '../models/db.js';

const upsertJobSeekerProfile = async (req, res) => {
  const {
    education,
    experience,
    experience_text,
    skills,
    city,
    expectations,
    portfolio,
    prefered_category_1,
    prefered_category_2,
  } = req.body;
  const userId = req.userId;

  try {
    const [existingProfile] = await db.query(
      'SELECT * FROM JobSeekerProfiles WHERE user_id = ?',
      [userId]
    );

    if (existingProfile.length > 0) {
      await db.query(
        `UPDATE JobSeekerProfiles
         SET education = ?, experience = ?, experience_text = ?, skills = ?, city = ?, expectations = ?, portfolio = ?, prefered_category_1 = ?, prefered_category_2 = ?
         WHERE user_id = ?`,
        [
          education,
          experience,
          experience_text,
          skills,
          city,
          expectations,
          portfolio,
          prefered_category_1,
          prefered_category_2,
          userId,
        ]
      );
      return res.json({ message: 'Job seeker profile updated successfully.' });
    } else {
      await db.query(
        `INSERT INTO JobSeekerProfiles
         (user_id, education, experience, experience_text, skills, city, expectations, portfolio, prefered_category_1, prefered_category_2)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          education,
          experience,
          experience_text,
          skills,
          city,
          expectations,
          portfolio,
          prefered_category_1,
          prefered_category_2,
        ]
      );
      return res.status(201).json({ message: 'Job seeker profile created successfully.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const upsertEmployerProfile = async (req, res) => {
  const { company_name, logo, company_description } = req.body;
  const userId = req.userId;

  try {
    const [existingProfile] = await db.query('SELECT * FROM EmployerProfiles WHERE user_id = ?', [userId]);

    if (existingProfile.length > 0) {
      await db.query(
        'UPDATE EmployerProfiles SET company_name = ?, logo = ?, company_description = ? WHERE user_id = ?',
        [company_name, logo, company_description, userId]
      );
      return res.json({ message: 'Employer profile updated successfully.' });
    } else {
      await db.query(
        'INSERT INTO EmployerProfiles (user_id, company_name, logo, company_description) VALUES (?, ?, ?, ?)',
        [userId, company_name, logo, company_description]
      );
      return res.status(201).json({ message: 'Employer profile created successfully.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getJobSeekerProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const [profile] = await db.query(`
      SELECT 
        p.*,
        c1.name AS prefered_category_1_name,
        c2.name AS prefered_category_2_name
      FROM JobSeekerProfiles p
      LEFT JOIN JobCategories c1 ON p.prefered_category_1 = c1.category_id
      LEFT JOIN JobCategories c2 ON p.prefered_category_2 = c2.category_id
      WHERE p.user_id = ?
    `, [userId]);

    if (profile.length === 0) {
      await db.query('INSERT INTO JobSeekerProfiles (user_id) VALUES (?)', [userId]);

      const [newProfile] = await db.query('SELECT * FROM JobSeekerProfiles WHERE user_id = ?', [userId]);
      return res.status(201).json(newProfile[0]);
    }

    res.json(profile[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getEmployerProfile = async (req, res) => {
  const userId = req.userId;

  try {
    const [profileRows] = await db.query(
      `SELECT 
        e.*, 
        u.first_name, u.last_name, u.email, u.phone, u.verified, u.registration_date, u.role
      FROM EmployerProfiles e
      JOIN Users u ON e.user_id = u.user_id
      WHERE e.user_id = ?`,
      [userId]
    );

    if (profileRows.length === 0) {
      await db.query('INSERT INTO EmployerProfiles (user_id) VALUES (?)', [userId]);
      const [newProfileRows] = await db.query(
        `SELECT 
          e.*, 
          u.first_name, u.last_name, u.email, u.phone, u.verified, u.registration_date, u.role
        FROM EmployerProfiles e
        JOIN Users u ON e.user_id = u.user_id
        WHERE e.user_id = ?`,
        [userId]
      );
      return res.status(201).json(newProfileRows[0]);
    }

    res.json(profileRows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export { upsertJobSeekerProfile, upsertEmployerProfile, getJobSeekerProfile, getEmployerProfile };