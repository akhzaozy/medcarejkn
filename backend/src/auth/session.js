import {createHash,randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import {users} from '../../../shared/users.js';
export const sanitizeUser=user=>Object.fromEntries(['id','username','name','role','roleLabel','title','unit'].filter(k=>user?.[k]!==undefined).map(k=>[k,user[k]]));
export async function seedAuth(client=pool) {
  const existing=new Set((await client.query('SELECT username FROM app_users')).rows.map(r=>r.username));
  for(const user of users){
    if(existing.has(user.username))continue;
    const hash=process.env[user.role==='staff_jkn'?'JKN_STAFF_PASSWORD_HASH':'JKN_CLINICIAN_PASSWORD_HASH'];
    if(!hash||!/^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(hash))throw new Error('Konfigurasi hash akun JKN belum tersedia. Migrasi dibatalkan.');
    await client.query('INSERT INTO app_users(username,profile,password_hash) VALUES($1,$2,$3) ON CONFLICT(username) DO NOTHING',[user.username,JSON.stringify(sanitizeUser(user)),hash]);
  }
}
export async function authenticate(username,password) {
  if(typeof username!=='string'||typeof password!=='string'||!username.trim()||!password||password.length>200)return null;
  const normalized=username.trim().toLowerCase()==='staff.jkn'?'staff.ahmad':username.trim().toLowerCase();
  const result=await pool.query('SELECT profile,password_hash FROM app_users WHERE username=$1',[normalized]);
  const row=result.rows[0];if(!row||!await bcrypt.compare(password,row.password_hash))return null;
  return sanitizeUser(row.profile);
}
const hashToken=token=>createHash('sha256').update(token).digest('hex');
export async function createSession(user) {const token=randomBytes(32).toString('base64url');await pool.query("INSERT INTO auth_sessions(token_hash,username,expires_at) VALUES($1,$2,CURRENT_TIMESTAMP+INTERVAL '8 hours')",[hashToken(token),user.username]);return token;}
export async function requireSession(req,res,next) {
  try{const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{40,100})$/)?.[1];if(!token)return res.status(401).json({message:'Silakan masuk kembali.'});
    const result=await pool.query('SELECT u.profile FROM auth_sessions s JOIN app_users u USING(username) WHERE s.token_hash=$1 AND s.expires_at>CURRENT_TIMESTAMP',[hashToken(token)]);
    if(!result.rows[0])return res.status(401).json({message:'Sesi berakhir. Silakan masuk kembali.'});req.user=sanitizeUser(result.rows[0].profile);req.sessionHash=hashToken(token);next();
  }catch(e){next(e);}
}
export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({message:'Peran Anda tidak berwenang melakukan tindakan ini.'});
export async function logoutSession(req,res,next){try{await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1',[req.sessionHash]);res.json({success:true});}catch(e){next(e);}}
