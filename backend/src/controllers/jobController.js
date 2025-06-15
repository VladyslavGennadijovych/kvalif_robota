import db from '../models/db.js';

const createJob = async (req, res) => {
  const { title, description, requirements, salary, salaryMax, employment_type, location, category_id } = req.body;
  const employer_id = req.userId;

  if (!title || !description || !requirements || !salary || !employment_type || !location || !category_id) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Jobs (employer_id, category_id, title, description, requirements, salary, salaryMax, employment_type, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employer_id, category_id, title, description, requirements, salary, salaryMax, employment_type, location, 'draft']
    );

    res.status(201).json({ message: 'Job posting created successfully.', jobId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


const updateJob = async (req, res) => {
  const { id } = req.params;
  const employerId = req.userId;
  const { title, description, requirements, salary, salaryMax, employment_type, location, category_id, status } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM Jobs WHERE job_id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Job posting not found.' });
    }

    if (existing[0].employer_id !== employerId) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this job posting.' });
    }

    await db.query(
      `UPDATE Jobs 
       SET status = ?, title = ?, description = ?, requirements = ?, salary = ?, salaryMax = ?, employment_type = ?, location = ?, category_id = ?
       WHERE job_id = ?`,
      [status, title, description, requirements, salary, salaryMax, employment_type, location, category_id, id]
    );

    res.json({ message: 'Job posting updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateJobStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const employerId = req.userId;

  const allowedStatuses = ['open', 'closed', 'draft'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM Jobs WHERE job_id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Job posting not found.' });
    }

    if (existing[0].employer_id !== employerId) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this job posting.' });
    }

    await db.query(
      'UPDATE Jobs SET status = ? WHERE job_id = ?',
      [status, id]
    );

    res.json({ message: 'Job posting status updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getEmployerJobs = async (req, res) => {
  const employerId = req.userId;

  try {
    const [postings] = await db.query(
      `SELECT j.job_id, j.blocked, j.category_id, j.title, j.description, j.salary, j.salaryMax, j.employment_type, j.location, j.status, j.posting_date, jc.name AS category_name, 
              (SELECT COUNT(*) FROM Applications a WHERE a.job_id = j.job_id AND a.status = 'pending') AS pending_applications
       FROM Jobs j 
       JOIN JobCategories jc ON j.category_id = jc.category_id
       WHERE j.employer_id = ?`,
      [employerId]
    );

    console.log(postings);
    console.log("sgs");

    if (postings.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this employer.' });
    }

    res.json(postings); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getJobsByCategory = async (req, res) => {
  let categoryId = req.params.id;

  console.log(categoryId);

  try {
    let query = `
      SELECT j.job_id, j.category_id, j.title, j.description, j.salary, j.salaryMax, 
             j.employment_type, j.location, j.status, j.posting_date,
             e.company_name, jc.name AS category_name
      FROM Jobs j
      JOIN EmployerProfiles e ON j.employer_id = e.user_id
      JOIN JobCategories jc ON j.category_id = jc.category_id
      WHERE j.status = 'open' and j.blocked = false
    `;
    let params = [];

    if (categoryId !== "0") {
      query += ` AND j.category_id = ${categoryId}`;
    }

    const [jobs] = await db.query(query, params);

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


const getJobById = async (req, res) => {
  let id = req.params.id;

  try {
    let query = `
      SELECT j.job_id, j.blocked, j.category_id, j.title, j.description, j.salary, j.salaryMax, 
             j.employment_type, j.location, j.status, j.posting_date,
             e.company_name, jc.name AS category_name
      FROM Jobs j
      JOIN EmployerProfiles e ON j.employer_id = e.user_id
      JOIN JobCategories jc ON j.category_id = jc.category_id
      WHERE j.job_id = ?`;
    let params = [id];

    const [jobs] = await db.query(query, params);

    if (jobs.length === 0) {
      res.json({});
      return;
    }

    res.json(jobs[0])
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getLatestJobs = async (req, res) => {
  const userId = req.userId;
  console.log(userId);

  try {
    let query = `
      SELECT j.job_id, j.title, j.description, j.salary, j.salaryMax,
             j.employment_type, j.location, j.status, j.posting_date,
             e.company_name, jc.name AS category_name
      FROM Jobs j
      JOIN EmployerProfiles e ON j.employer_id = e.user_id
      JOIN JobCategories jc ON j.category_id = jc.category_id
      WHERE j.status = 'open' and j.blocked = false
    `;
    let params = [];

    if (userId) {
      const [preferences] = await db.query(
        `SELECT prefered_category_1, prefered_category_2 FROM JobSeekerProfiles WHERE user_id = ?`,
        [userId]
      );

      if (preferences.length > 0) {
        const { prefered_category_1, prefered_category_2 } = preferences[0];

        const categoryConditions = [];
        if (prefered_category_1) categoryConditions.push(`j.category_id = ${prefered_category_1}`);
        if (prefered_category_2 && prefered_category_2 !== prefered_category_1)
          categoryConditions.push(`j.category_id = ${prefered_category_2}`);

        if (categoryConditions.length > 0) {
          query += ` AND (${categoryConditions.join(" OR ")})`;
        }
      }
    }

    query += ` ORDER BY j.posting_date DESC LIMIT 10`;

    const [jobs] = await db.query(query, params);
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

export {
  createJob,
  updateJob,
  updateJobStatus,
  getEmployerJobs,
  getJobsByCategory,
  getJobById,
  getLatestJobs
};
