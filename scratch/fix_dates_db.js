const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'smart_storage'
  });

  // Update endDate to a future date (e.g., 2026-12-31) for all ACTIVE contracts
  // so the logic matches reality.
  await conn.execute(`
    UPDATE Reservation 
    SET endDate = '2026-12-31' 
    WHERE reservationId IN (
      SELECT reservationId FROM Contract WHERE status = 'ACTIVE'
    )
  `);

  console.log("Fixed logical dates in DB!");
  conn.end();
}
run();
