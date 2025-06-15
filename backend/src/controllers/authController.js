import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../services/emailService.js';
import { generateToken } from '../utils/tokenUtils.js';
import db from '../models/db.js'; 

const register = async (req, res) => {
  const { first_name, last_name, email, password, role } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUser] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Цей email вже зареєстровано.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();

    await connection.query(
      'INSERT INTO Users (first_name, last_name, email, password, role, verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, role, false, verificationToken]
    );

    await sendVerificationEmail(email, verificationToken);

    await connection.commit();

    res.status(201).json({ message: 'Користувача зареєстровано. Будь ласка, підтвердіть email.' });
  } catch (error) {
    await connection.rollback();

    console.error(error);
    res.status(500).json({ message: 'Помилка сервера.' });
  } finally {
    connection.release();
  }
};

const registerEmployer = async (req, res) => {
  const { first_name, last_name, email, password, company_name, logo, company_description } = req.body;
  const role = 'employer';

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUser] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Цей email вже зареєстровано.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();

    const [userResult] = await connection.query(
      'INSERT INTO Users (first_name, last_name, email, password, role, verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, role, false, verificationToken]
    );

    const user_id = userResult.insertId;

    await connection.query(
      'INSERT INTO EmployerProfiles (user_id, company_name, logo, company_description) VALUES (?, ?, ?, ?)',
      [user_id, company_name, logo, company_description]
    );

    await sendVerificationEmail(email, verificationToken);

    await connection.commit();

    res.status(201).json({ message: 'Роботодавця зареєстровано. Будь ласка, підтвердіть email.' });
  } catch (error) {
    await connection.rollback();

    console.error(error);
    res.status(500).json({ message: 'Помилка сервера.' });
  } finally {
    connection.release();
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const [userRows] = await db.query('SELECT * FROM Users WHERE verification_token = ?', [token]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Недійсний або прострочений токен.' });
    }

    const user = userRows[0];
    await db.query('UPDATE Users SET verified = ?, verification_token = ? WHERE user_id = ?', [true, null, user.user_id]);

    res.json({ message: 'Email успішно підтверджено.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [userRows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Невірний email або пароль.' });
    }

    const user = userRows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Невірний email або пароль.' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Ваш акаунт заблоковано. Зверніться до адміністратора.' });
    }

    if (!user.verified) {
      return res.status(400).json({ message: 'Будь ласка, підтвердіть свій email.' });
    }

    const jwtToken = jwt.sign(
      { userId: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: jwtToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера.' });
  }
};

export { register, registerEmployer, verifyEmail, login };
