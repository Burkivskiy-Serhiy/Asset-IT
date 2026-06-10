import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
const sql = neon(process.env.DATABASE_URL);
async function testPut() {
  try {
    const id = "fc19e126-c4c1-4095-9abd-de5d79e63636"; 
    const location = JSON.stringify({ office: "Філіал 1", floor: "2", room: "20" });
    const updatedAsset = await sql`
      UPDATE assets 
      SET 
        location = COALESCE(${location || null}, location),
        "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;
    console.log("Updated via neon:", updatedAsset);
  } catch (err) {
    console.error(err);
  }
}
testPut();
