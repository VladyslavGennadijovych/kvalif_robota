import db from '../models/db.js';

// GET /api/analysis/applications?category=ID_Категорії (опціонально)
const getApplicationsStats = async (req, res) => {
  try {
    const { category } = req.query;

    let query, params = [];

    if (category) {
      // Статистика по одній категорії
      query = `
        SELECT 
          jc.category_id AS category_id,
          jc.name AS category,
          SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
          SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending
        FROM JobCategories jc
        LEFT JOIN Jobs j ON j.category_id = jc.category_id
        LEFT JOIN Applications a ON a.job_id = j.job_id
        WHERE jc.category_id = ?
        GROUP BY jc.category_id, jc.name
      `;
      params.push(category);
    } else {
      // Загальна статистика по всіх категоріях
      query = `
        SELECT 
          SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
          SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending
        FROM Applications a
      `;
    }

    const [rows] = await db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export { getApplicationsStats };