const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ecommerce"
});

const connectWithRetry = () => {
    db.connect((err) => {
        if (err) {
            console.error("❌ Database connection failed:", err);
            console.log("🔄 Retrying in 5 seconds...");
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log("✅ Connected to MySQL");
        }
    });
};

connectWithRetry();

module.exports = db;