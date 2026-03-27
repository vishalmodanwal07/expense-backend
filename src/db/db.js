import { config } from "dotenv";
import * as mariadb from "mariadb";

config(); 



// Create a pool (synchronous)
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 5
});

// Async function to test connection
const dbConnect = async () => {
    try {
        const conn = await pool.getConnection(); // get connection
        console.log("DB connected");
        conn.release(); // release back to pool
    } catch (error) {
        console.log("Failed to connect DB:", error);
    }
};

export default dbConnect;