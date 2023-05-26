const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "Udit@Jarwal",
    host: "localhost",
    port: 5432,
    database: "sportnewsifydb"
});

module.exports = pool;