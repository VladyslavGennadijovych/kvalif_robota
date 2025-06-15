import db from '../models/db.js';

const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM JobCategories');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Оновлення категорій
const updateCategories = async (req, res) => {
  try {
    const { categories } = req.body; // масив рядків

    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: 'Categories must be an array.' });
    }

    // Отримати всі поточні категорії з БД
    const [currentRows] = await db.query('SELECT name FROM JobCategories');
    const current = currentRows.map(row => row.name);

    // Нові категорії для додавання
    const toAdd = categories.filter(cat => !current.includes(cat));
    // Категорії для видалення
    const toDelete = current.filter(cat => !categories.includes(cat));

    // Додаємо нові
    for (const name of toAdd) {
      await db.query('INSERT INTO JobCategories (name) VALUES (?)', [name]);
    }

    // Видаляємо ті, яких немає у новому списку
    for (const name of toDelete) {
      await db.query('DELETE FROM JobCategories WHERE name = ?', [name]);
    }

    res.json({ added: toAdd, deleted: toDelete });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export { getCategories, updateCategories };
