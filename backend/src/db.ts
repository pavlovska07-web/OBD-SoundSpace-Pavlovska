import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'studio_admin',
  password: process.env.DB_PASSWORD || 'studio_password_2026',
  database: process.env.DB_NAME || 'rehearsal_studio',
});

export async function runStartupMigrations() {
  const client = await pool.connect();
  try {
    // 1. Оновлюємо допустимі статуси бронювань
    await client.query(`
      ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
      ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('Очікує підтвердження', 'Підтверджено', 'Відхилено', 'Завершено', 'Скасовано'));
    `);

    // 2. Дозволяємо проводити плановий техогляд обладнання поза межами конкретного бронювання
    await client.query(`
      ALTER TABLE equipment_conditions ALTER COLUMN booking_id DROP NOT NULL;
    `);

    // 3. Розширюємо парк музичного обладнання до 10 базових позицій
    const newEquipment = [
      ['Gibson Les Paul Standard', 'Електрогітара', 180.0, 'INV-EQ-006'],
      ['Fender American Jazz Bass', 'Бас-гітара', 170.0, 'INV-EQ-007'],
      ['Roland SPD-SX Sampling Pad', 'Перкусія та семплери', 160.0, 'INV-EQ-008'],
      ['Sennheiser e935 Vocal Set', 'Вокальний мікрофон', 80.0, 'INV-EQ-009'],
      ['Pioneer DJM-900NXS2 Mixer', 'DJ та студійний пульт', 250.0, 'INV-EQ-010'],
    ];

    for (const [name, category, price, inv] of newEquipment) {
      await client.query(
        `INSERT INTO equipment (equipment_name, category, rental_price, inventory_number)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (
           SELECT 1 FROM equipment WHERE inventory_number = $4
         )`,
        [name, category, price, inv]
      );
    }
  } catch (err) {
    console.error('Помилка міграції БД при старті:', err);
  } finally {
    client.release();
  }
}