const { Pool } = require('pg');
// The path must be correct. Since db.js is in 'config', we point up one level.
require('dotenv').config({ path: './.env' }); 

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Debugging line: This will print the password to the terminal so you can verify it's loaded.
// Remove this line after it works!
console.log("Loaded Password:", process.env.DB_PASSWORD); 

module.exports = pool;