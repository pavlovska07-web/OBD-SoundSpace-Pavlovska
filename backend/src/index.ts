import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool, runStartupMigrations } from './db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'soundspace_secret_key_2026';
const ADMIN_SECRET_CODE = '12345';

const STUDIO_OPEN_TIME = '09:00';
const STUDIO_CLOSE_TIME = '22:00';
const MAX_EQUIPMENT_PER_ITEM = 4;

app.use(cors());
app.use(express.json());

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: 'user' | 'admin';
    band_id: number | null;
    admin_id: number | null;
    full_name: string;
  };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Необхідна авторизація' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Недійсний або прострочений токен' });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ дозволено лише адміністраторам' });
  }
  next();
};

const isValidFullName = (name: string): boolean => {
  const trimmed = name.trim();
  const regex = /^[А-ЯІЇЄҐA-Z][а-яіїєґa-z'’-]+(\s+[А-ЯІЇЄҐA-Z][а-яіїєґa-z'’-]+){1,2}$/;
  return regex.test(trimmed);
};

const isValidPhone = (phone: string): boolean => {
  return /^\+380 \d{2} \d{3} \d{2} \d{2}$/.test(phone.trim());
};

// ==================== ПУБЛІЧНІ МАРШРУТИ ====================

app.get('/api/public/rooms', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY room_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження кімнат' });
  }
});

app.get('/api/public/equipment', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY equipment_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження обладнання' });
  }
});

// Зайняті слоти для конкретної кімнати на обрану дату
app.get('/api/public/room-schedule', async (req: Request, res: Response) => {
  const { room_id, date } = req.query as { room_id?: string; date?: string };
  if (!room_id || !date) {
    return res.status(400).json({ message: 'Вкажіть кімнату та дату' });
  }

  try {
    const result = await pool.query(
      `SELECT booking_id, start_time, end_time, status
       FROM bookings
       WHERE room_id = $1
         AND booking_date = $2
         AND status NOT IN ('Скасовано', 'Відхилено')
       ORDER BY start_time ASC`,
      [Number(room_id), date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка завантаження розкладу кімнати' });
  }
});

// Перевірка вільних кімнат на конкретну дату та проміжок часу
app.get('/api/public/available-rooms', async (req: Request, res: Response) => {
  const { date, start_time, end_time } = req.query as {
    date?: string;
    start_time?: string;
    end_time?: string;
  };

  if (!date) {
    return res.status(400).json({ message: 'Вкажіть дату для пошуку' });
  }

  try {
    if (start_time && end_time) {
      if (start_time >= end_time) {
        return res.status(400).json({ message: 'Час завершення має бути пізнішим за час початку' });
      }
      if (start_time < STUDIO_OPEN_TIME || end_time > STUDIO_CLOSE_TIME) {
        return res.status(400).json({
          message: `Студія працює з ${STUDIO_OPEN_TIME} до ${STUDIO_CLOSE_TIME}`,
        });
      }

      const result = await pool.query(
        `SELECT * FROM rooms
         WHERE room_id NOT IN (
           SELECT room_id FROM bookings
           WHERE booking_date = $1
             AND status NOT IN ('Скасовано', 'Відхилено')
             AND start_time < $3
             AND end_time > $2
         )
         ORDER BY room_id ASC`,
        [date, start_time, end_time]
      );
      return res.json(result.rows);
    }

    const result = await pool.query(
      `SELECT * FROM rooms
       WHERE room_id NOT IN (
         SELECT room_id FROM bookings
         WHERE booking_date = $1 AND status NOT IN ('Скасовано', 'Відхилено')
       )
       ORDER BY room_id ASC`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка пошуку вільних кімнат' });
  }
});

// ==================== АВТОРИЗАЦІЯ ТА РЕЄСТРАЦІЯ ====================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { full_name, email, password, role, band_name, genre, phone, admin_code } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Заповніть усі обов’язкові поля' });
  }

  if (!isValidFullName(full_name)) {
    return res.status(400).json({
      message: 'ПІБ має містити 2 або 3 слова, і кожне слово повинно починатися з великої літери',
    });
  }

  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({
      message: 'Введіть коректний номер телефону у форматі +380 XX XXX XX XX',
    });
  }

  if (role === 'admin' && admin_code !== ADMIN_SECRET_CODE) {
    return res.status(403).json({ message: 'Невірний код доступу адміністратора' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT user_id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Користувач із таким Email вже зареєстрований' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let bandId: number | null = null;
    let adminId: number | null = null;

    if (role === 'admin') {
      const adminRes = await client.query(
        'INSERT INTO administrators (full_name, phone) VALUES ($1, $2) RETURNING admin_id',
        [full_name.trim(), phone.trim()]
      );
      adminId = adminRes.rows[0].admin_id;
    } else {
      if (!band_name?.trim()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Вкажіть назву музичного гурту' });
      }
      const bandRes = await client.query(
        'INSERT INTO bands (band_name, genre, contact_person, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING band_id',
        [band_name.trim(), genre || 'Rock', full_name.trim(), phone.trim(), email.trim().toLowerCase()]
      );
      bandId = bandRes.rows[0].band_id;
    }

    const userRole = role === 'admin' ? 'admin' : 'user';
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, band_id, admin_id, full_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, role, band_id, admin_id, full_name`,
      [email.trim().toLowerCase(), passwordHash, userRole, bandId, adminId, full_name.trim()]
    );

    await client.query('COMMIT');
    const user = userRes.rows[0];
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Помилка під час реєстрації' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, role, admin_code } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Введіть Email та пароль' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Невірний Email або пароль' });
    }

    const dbUser = result.rows[0];
    const validPass = await bcrypt.compare(password, dbUser.password_hash);
    if (!validPass) {
      return res.status(401).json({ message: 'Невірний Email або пароль' });
    }

    if (role === 'admin' || dbUser.role === 'admin') {
      if (dbUser.role !== 'admin') {
        return res.status(403).json({ message: 'Цей акаунт не має прав адміністратора' });
      }
      if (admin_code !== ADMIN_SECRET_CODE) {
        return res.status(403).json({ message: 'Невірний код доступу адміністратора' });
      }
    }

    const payload = {
      user_id: dbUser.user_id,
      email: dbUser.email,
      role: dbUser.role,
      band_id: dbUser.band_id,
      admin_id: dbUser.admin_id,
      full_name: dbUser.full_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка входу в систему' });
  }
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

// ==================== КАБІНЕТ МУЗИКАНТА ====================

app.get('/api/user/band', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user?.band_id) return res.json(null);
  const result = await pool.query('SELECT * FROM bands WHERE band_id = $1', [req.user.band_id]);
  res.json(result.rows[0] || null);
});

app.get('/api/user/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user?.band_id) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT
         b.booking_id,
         r.room_name,
         TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
         b.start_time,
         b.end_time,
         b.status,
         b.total_cost,
         COALESCE(p.payment_method, 'Не оплачено') AS payment_method,
         COALESCE(
           STRING_AGG(e.equipment_name || ' (x' || be.quantity || ')', ', '),
           'Без додаткового обладнання'
         ) AS equipment_list
       FROM bookings b
       JOIN rooms r ON b.room_id = r.room_id
       LEFT JOIN payments p ON b.booking_id = p.booking_id
       LEFT JOIN booking_equipment be ON b.booking_id = be.booking_id
       LEFT JOIN equipment e ON be.equipment_id = e.equipment_id
       WHERE b.band_id = $1
       GROUP BY b.booking_id, r.room_name, p.payment_method
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [req.user.band_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка завантаження бронювань' });
  }
});

app.post('/api/user/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  const { room_id, booking_date, start_time, end_time, equipment_items, payment_method } = req.body;

  if (!req.user?.band_id) {
    return res.status(400).json({ message: 'Профіль гурту не знайдено' });
  }
  if (!room_id || !booking_date || !start_time || !end_time) {
    return res.status(400).json({ message: 'Заповніть кімнату, дату та час репетиції' });
  }
  if (start_time >= end_time) {
    return res.status(400).json({ message: 'Час завершення оренди не може бути раніше або дорівнювати часу початку' });
  }
  if (start_time < STUDIO_OPEN_TIME || end_time > STUDIO_CLOSE_TIME) {
    return res.status(400).json({
      message: `Бронювання можливе лише в робочі години студії: з ${STUDIO_OPEN_TIME} до ${STUDIO_CLOSE_TIME}`,
    });
  }

  const items: { equipment_id: number; quantity: number }[] = Array.isArray(equipment_items) ? equipment_items : [];
  for (const item of items) {
    if (item.quantity > MAX_EQUIPMENT_PER_ITEM) {
      return res.status(400).json({
        message: `Максимальна кількість кожної одиниці обладнання — ${MAX_EQUIPMENT_PER_ITEM} шт.`,
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const overlap = await client.query(
      `SELECT booking_id FROM bookings
       WHERE room_id = $1
         AND booking_date = $2
         AND status NOT IN ('Скасовано', 'Відхилено')
         AND start_time < $4
         AND end_time > $3`,
      [room_id, booking_date, start_time, end_time]
    );

    if (overlap.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'Обрана кімната вже зайнята або має заявку на цей проміжок часу',
      });
    }

    const roomRes = await client.query('SELECT hourly_rate FROM rooms WHERE room_id = $1', [room_id]);
    if (roomRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Кімнату не знайдено' });
    }

    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
    let totalCost = Number(roomRes.rows[0].hourly_rate) * hours;

    const adminRes = await client.query('SELECT admin_id FROM administrators ORDER BY admin_id ASC LIMIT 1');
    const defaultAdminId = adminRes.rows[0]?.admin_id || 1;

    const bookingRes = await client.query(
      `INSERT INTO bookings (band_id, room_id, admin_id, booking_date, start_time, end_time, status, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, 'Очікує підтвердження', $7)
       RETURNING booking_id`,
      [req.user.band_id, room_id, defaultAdminId, booking_date, start_time, end_time, totalCost]
    );
    const bookingId = bookingRes.rows[0].booking_id;

    for (const item of items) {
      if (item.quantity > 0) {
        const eqRes = await client.query('SELECT rental_price FROM equipment WHERE equipment_id = $1', [
          item.equipment_id,
        ]);
        if (eqRes.rows.length > 0) {
          totalCost += Number(eqRes.rows[0].rental_price) * item.quantity;
          await client.query(
            'INSERT INTO booking_equipment (booking_id, equipment_id, quantity) VALUES ($1, $2, $3)',
            [bookingId, item.equipment_id, item.quantity]
          );
        }
      }
    }

    totalCost = Math.round(totalCost * 100) / 100;
    await client.query('UPDATE bookings SET total_cost = $1 WHERE booking_id = $2', [totalCost, bookingId]);

    if (payment_method) {
      await client.query(
        'INSERT INTO payments (booking_id, amount, payment_method) VALUES ($1, $2, $3)',
        [bookingId, totalCost, payment_method]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Заявку на бронювання надіслано! Очікуйте підтвердження адміністратора.',
      booking_id: bookingId,
      total_cost: totalCost,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Помилка створення бронювання' });
  } finally {
    client.release();
  }
});

// Скасування бронювання самим музикантом
app.post('/api/user/bookings/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  if (!req.user?.band_id) {
    return res.status(400).json({ message: 'Профіль гурту не знайдено' });
  }

  try {
    const check = await pool.query(
      'SELECT status FROM bookings WHERE booking_id = $1 AND band_id = $2',
      [bookingId, req.user.band_id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Бронювання не знайдено' });
    }

    const currentStatus = check.rows[0].status;
    if (!['Очікує підтвердження', 'Підтверджено'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Це бронювання вже неможливо скасувати' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'Скасовано' WHERE booking_id = $1 AND band_id = $2`,
      [bookingId, req.user.band_id]
    );

    res.json({ message: `Бронювання №${bookingId} скасовано. Часовий слот знову вільний.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка скасування бронювання' });
  }
});

// ==================== АДМІН-ПАНЕЛЬ ====================

app.get('/api/admin/analytics', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [roomsStats, equipmentStats, damagedEquipment, futureBookings] = await Promise.all([
      pool.query(`
        SELECT
          r.room_id,
          r.room_name,
          COUNT(b.booking_id)::int AS total_bookings_count,
          COALESCE(SUM(CASE WHEN b.status IN ('Підтверджено', 'Завершено') THEN b.total_cost ELSE 0 END), 0) AS total_revenue
        FROM rooms r
        LEFT JOIN bookings b ON r.room_id = b.room_id
        GROUP BY r.room_id, r.room_name
        ORDER BY total_revenue DESC
      `),
      pool.query(`
        SELECT
          e.equipment_id,
          e.equipment_name,
          e.inventory_number,
          COALESCE(SUM(be.quantity), 0)::int AS total_rented_count
        FROM equipment e
        LEFT JOIN booking_equipment be ON e.equipment_id = be.equipment_id
        GROUP BY e.equipment_id, e.equipment_name, e.inventory_number
        ORDER BY total_rented_count DESC
      `),
      pool.query(`
        SELECT * FROM (
          SELECT DISTINCT ON (ec.equipment_id)
            ec.condition_id,
            e.equipment_name,
            e.inventory_number,
            ec.condition_status,
            ec.notes,
            TO_CHAR(ec.check_date, 'YYYY-MM-DD') AS check_date,
            a.full_name AS inspector_name
          FROM equipment_conditions ec
          JOIN equipment e ON ec.equipment_id = e.equipment_id
          JOIN administrators a ON ec.admin_id = a.admin_id
          ORDER BY ec.equipment_id, ec.condition_id DESC
        ) latest
        WHERE latest.condition_status != 'Справне'
        ORDER BY latest.check_date DESC
      `),
      pool.query(`
        SELECT
          booking_id,
          band_name,
          contact_person,
          band_phone,
          room_name,
          booking_date,
          start_time,
          end_time,
          total_cost
        FROM v_future_bookings
        ORDER BY booking_date ASC, start_time ASC
      `),
    ]);

    res.json({
      roomsStats: roomsStats.rows,
      equipmentStats: equipmentStats.rows,
      damagedEquipment: damagedEquipment.rows,
      futureBookings: futureBookings.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка завантаження аналітики' });
  }
});

app.get('/api/admin/bookings', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        b.booking_id,
        bnd.band_name,
        bnd.contact_person,
        bnd.phone AS band_phone,
        r.room_name,
        TO_CHAR(b.booking_date, 'YYYY-MM-DD') AS booking_date,
        b.start_time || ' - ' || b.end_time AS time_slot,
        b.status AS booking_status,
        b.total_cost,
        COALESCE(p.payment_method, 'Не оплачено') AS payment_method,
        COALESCE(
          STRING_AGG(e.equipment_name || ' (x' || be.quantity || ')', ', '),
          'Без додаткового обладнання'
        ) AS equipment_name
      FROM bookings b
      JOIN bands bnd ON b.band_id = bnd.band_id
      JOIN rooms r ON b.room_id = r.room_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      LEFT JOIN booking_equipment be ON b.booking_id = be.booking_id
      LEFT JOIN equipment e ON be.equipment_id = e.equipment_id
      GROUP BY b.booking_id, bnd.band_name, bnd.contact_person, bnd.phone, r.room_name, p.payment_method
      ORDER BY
        CASE WHEN b.status = 'Очікує підтвердження' THEN 0 ELSE 1 END,
        b.booking_date DESC,
        b.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка завантаження журналу бронювань' });
  }
});

app.post('/api/admin/bookings/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  try {
    const adminId = req.user?.admin_id || 1;
    await pool.query(
      `UPDATE bookings SET status = 'Підтверджено', admin_id = $1 WHERE booking_id = $2`,
      [adminId, bookingId]
    );
    res.json({ message: `Бронювання #${bookingId} підтверджено!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка підтвердження бронювання' });
  }
});

app.post('/api/admin/bookings/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  try {
    const adminId = req.user?.admin_id || 1;
    await pool.query(
      `UPDATE bookings SET status = 'Відхилено', admin_id = $1 WHERE booking_id = $2`,
      [adminId, bookingId]
    );
    res.json({ message: `Бронювання #${bookingId} відхилено.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка відхилення бронювання' });
  }
});

app.post('/api/admin/bookings/:id/complete', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const bookingId = Number(req.params.id);
  const { payment_method, condition_status, notes } = req.body;
  const adminId = req.user?.admin_id || 1;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query('SELECT total_cost FROM bookings WHERE booking_id = $1', [bookingId]);
    if (bRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Бронювання не знайдено' });
    }
    const totalCost = bRes.rows[0].total_cost;

    await client.query(`UPDATE bookings SET status = 'Завершено', admin_id = $1 WHERE booking_id = $2`, [
      adminId,
      bookingId,
    ]);

    const payCheck = await client.query('SELECT payment_id FROM payments WHERE booking_id = $1', [bookingId]);
    if (payCheck.rows.length > 0) {
      await client.query('UPDATE payments SET payment_method = $1, payment_date = CURRENT_DATE WHERE booking_id = $2', [
        payment_method || 'Картка',
        bookingId,
      ]);
    } else {
      await client.query('INSERT INTO payments (booking_id, amount, payment_method) VALUES ($1, $2, $3)', [
        bookingId,
        totalCost,
        payment_method || 'Картка',
      ]);
    }

    const eqItems = await client.query('SELECT equipment_id FROM booking_equipment WHERE booking_id = $1', [bookingId]);
    for (const row of eqItems.rows) {
      await client.query(
        `INSERT INTO equipment_conditions (equipment_id, booking_id, admin_id, check_date, condition_status, notes)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
        [row.equipment_id, bookingId, adminId, condition_status || 'Справне', notes || 'Перевірено після репетиції']
      );
    }

    await client.query('COMMIT');
    res.json({ message: `Репетицію #${bookingId} успішно завершено, оплату та стан техніки зафіксовано.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Помилка під час завершення репетиції' });
  } finally {
    client.release();
  }
});

// CRUD для кімнат
app.post('/api/admin/rooms', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { room_name, area_sqm, capacity, hourly_rate, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rooms (room_name, area_sqm, capacity, hourly_rate, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [room_name, area_sqm, capacity, hourly_rate, description || 'Сучасна репетиційна кімната.']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Кімната з такою назвою вже існує' });
    }
    res.status(500).json({ message: 'Помилка додавання кімнати' });
  }
});

app.put('/api/admin/rooms/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { room_name, area_sqm, capacity, hourly_rate, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rooms
       SET room_name = $1, area_sqm = $2, capacity = $3, hourly_rate = $4, description = $5
       WHERE room_id = $6 RETURNING *`,
      [room_name, area_sqm, capacity, hourly_rate, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Кімнату не знайдено' });
    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Кімната з такою назвою вже існує' });
    }
    res.status(500).json({ message: 'Помилка оновлення кімнати' });
  }
});

app.delete('/api/admin/rooms/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  try {
    await pool.query('DELETE FROM rooms WHERE room_id = $1', [id]);
    res.json({ message: 'Кімнату видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка видалення кімнати' });
  }
});

// CRUD для обладнання
app.post('/api/admin/equipment', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { equipment_name, category, rental_price, inventory_number } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO equipment (equipment_name, category, rental_price, inventory_number)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [equipment_name, category, rental_price, inventory_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка додавання обладнання' });
  }
});

app.put('/api/admin/equipment/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { equipment_name, category, rental_price, inventory_number } = req.body;
  try {
    const result = await pool.query(
      `UPDATE equipment
       SET equipment_name = $1, category = $2, rental_price = $3, inventory_number = $4
       WHERE equipment_id = $5 RETURNING *`,
      [equipment_name, category, rental_price, inventory_number, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Обладнання не знайдено' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка оновлення обладнання' });
  }
});

app.delete('/api/admin/equipment/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  try {
    await pool.query('DELETE FROM equipment WHERE equipment_id = $1', [id]);
    res.json({ message: 'Обладнання видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка видалення обладнання' });
  }
});

// Журнал та створення планових техоглядів
app.get('/api/admin/conditions', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ec.condition_id,
        e.equipment_name,
        e.inventory_number,
        ec.condition_status,
        ec.notes,
        TO_CHAR(ec.check_date, 'YYYY-MM-DD') AS check_date,
        a.full_name AS inspector_name
      FROM equipment_conditions ec
      JOIN equipment e ON ec.equipment_id = e.equipment_id
      JOIN administrators a ON ec.admin_id = a.admin_id
      ORDER BY ec.condition_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження журналу техоглядів' });
  }
});

app.post('/api/admin/conditions', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { equipment_id, condition_status, notes, check_date } = req.body;
  const adminId = req.user?.admin_id || 1;

  if (!equipment_id || !condition_status) {
    return res.status(400).json({ message: 'Оберіть обладнання та його стан' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO equipment_conditions (equipment_id, booking_id, admin_id, check_date, condition_status, notes)
       VALUES ($1, NULL, $2, COALESCE($3::date, CURRENT_DATE), $4, $5)
       RETURNING *`,
      [
        Number(equipment_id),
        adminId,
        check_date || null,
        condition_status,
        notes?.trim() || 'Плановий технічний огляд адміністратором',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка збереження запису техогляду' });
  }
});

app.get('/api/admin/bands', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM bands ORDER BY band_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Помилка завантаження списку гуртів' });
  }
});

runStartupMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`SoundSpace Backend запущено на http://localhost:${PORT}`);
  });
});