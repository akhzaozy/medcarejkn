import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync(new URL('../../../outputs/runtime-auth/qa.json',import.meta.url),'utf8'));
process.env.DB_NAME=config.database;
process.env.PORT='5175';
const {default:app}=await import('../app.js');
app.listen(5175,'127.0.0.1',()=>console.log('Staging PRD tersedia pada port 5175 (database uji).'));
