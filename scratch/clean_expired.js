const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'smart_storage'
  });

  // Convert TERMINATED/EXPIRED/OVERDUE to ACTIVE and adjust dates to be valid
  await conn.execute("UPDATE Contract SET status = 'ACTIVE', terminatedAt = NULL, activatedAt = NOW() WHERE status IN ('TERMINATED', 'EXPIRED', 'OVERDUE')");
  
  // Also update corresponding Reservations
  await conn.execute("UPDATE Reservation SET status = 'CONFIRMED', endDate = '2026-12-31' WHERE status = 'EXPIRED'");

  console.log("Cleaned up expired contracts!");
  conn.end();
}
run();
