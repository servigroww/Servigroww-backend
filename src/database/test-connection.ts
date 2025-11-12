import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Shyam@123',
  database: 'servigroww',
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    
    // Test PostGIS
    const geoResult = await pool.query(`
      SELECT ST_AsText(ST_MakePoint(77.5946, 12.9716)) as bangalore;
    `);
    console.log('✅ PostGIS working!');
    console.log('Bangalore coordinates:', geoResult.rows[0].bangalore);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();