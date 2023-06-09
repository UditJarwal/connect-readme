import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    user: "postgres",
    password: "Udit@Jarwal",
    host: "localhost",
    port: 5432,
    database: "sportnewsifydb"
});

