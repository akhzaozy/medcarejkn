import app from './app.js';
import {migrate} from './scripts/migrate.js';
try {console.log('[Migration] '+JSON.stringify(await migrate()));}catch {console.error('[Startup] Backup/migrasi database belum berhasil. Server tidak dijalankan untuk mencegah keadaan parsial.');process.exit(1);}
const PORT=process.env.PORT||5174;
app.listen(PORT,()=>console.log(`[medCare JKN] Server running on port ${PORT}`));
