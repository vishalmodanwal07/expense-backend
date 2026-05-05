import { config } from "dotenv";
import * as mariadb from "mariadb";

config(); 


export const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 5 ,
    supportBigNumbers: true,
    bigNumberStrings: true
});

export const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ MariaDB Connected Successfully");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
  } finally {
    if (conn) conn.release(); // always release
  }
};

/**
 * Adds `users.mobile` + unique index if missing (matches code that expects this column).
 * Safe to run on every startup; ignores "already exists" errors.
 */
export const ensureUsersMobileColumn = async () => {
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN mobile VARCHAR(16) NULL"
    );
    console.log("✅ Schema: added column users.mobile");
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || "";
    if (
      e?.errno === 1060 ||
      e?.code === "ER_DUP_FIELDNAME" ||
      /duplicate column/i.test(msg)
    ) {
      /* column already present */
    } else {
      console.warn("ensureUsersMobileColumn (ADD COLUMN):", msg);
    }
  }

  try {
    await pool.query(
      "ALTER TABLE users ADD UNIQUE INDEX uq_users_mobile (mobile)"
    );
    console.log("✅ Schema: added unique index uq_users_mobile");
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || "";
    if (
      e?.errno === 1061 ||
      /duplicate key name/i.test(msg) ||
      /already exists/i.test(msg)
    ) {
      /* index already present */
    } else {
      console.warn("ensureUsersMobileColumn (UNIQUE INDEX):", msg);
    }
  }
};

/**
 * Adds `users.role` if missing (login/profile expect this column).
 * Safe to run on every startup; ignores "already exists" errors.
 */
export const ensureUsersRoleColumn = async () => {
  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'"
    );
    console.log("✅ Schema: added column users.role");
  } catch (e) {
    const msg = e?.sqlMessage || e?.message || "";
    if (
      e?.errno === 1060 ||
      e?.code === "ER_DUP_FIELDNAME" ||
      /duplicate column/i.test(msg)
    ) {
      /* column already present */
    } else {
      console.warn("ensureUsersRoleColumn:", msg);
    }
  }
};
