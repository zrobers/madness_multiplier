import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "db",
  database: "madness",
  password: "postgres",
  port: 5432,
});

export default pool;
