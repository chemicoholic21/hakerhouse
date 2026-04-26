
import { sql } from "./lib/db";

async function inspectTable() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leaderboard'
    `;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
}

inspectTable();
