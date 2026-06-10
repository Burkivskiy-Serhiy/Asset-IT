import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_XfkSt5mCL3yO@ep-twilight-fog-agivn2yg-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
async function run() {
  try {
    const totalValueResult = await sql`SELECT SUM(price) as "totalValue" FROM assets`;
    console.log("Total Value Result:", totalValueResult);
    const statusResult = await sql`SELECT status, COUNT(*) as count FROM assets GROUP BY status`;
    console.log("Status Result:", statusResult);
    const licenseResult = await sql`SELECT SUM("usedSeats") as used, SUM("totalSeats") as total FROM licenses`;
    console.log("License Result:", licenseResult);
  } catch (err) {
    console.error(err);
  }
}
run();
