   const { Client } = require('pg');
   
   // PASTE YOUR EXACT DATABASE_URL STRING HERE (remove the quotes)
   const connectionString = "postgresql://neondb_owner:npg_ZogDrsE6J8im@ep-flat-forest-axpfd9n9.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

   const client = new Client({ connectionString });

   client.connect()
     .then(() => {
       console.log("✅ SUCCESS! Connected to Neon database.");
       client.end();
     })
     .catch((err) => {
       console.error("❌ FAILED to connect:", err.message);
       client.end();
     });