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
