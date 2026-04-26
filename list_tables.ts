
import { sql } from "./lib/db";

async function listTables() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
}

listTables();
