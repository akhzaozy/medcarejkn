import {authenticate,createSession,sanitizeUser} from '../auth/session.js';
import {users} from '../../../shared/users.js';
export async function login(req,res,next){try{const user=await authenticate(req.body?.username,req.body?.password);if(!user)return res.status(401).json({success:false,message:'Username atau kata sandi tidak cocok.'});res.json({success:true,data:{user:sanitizeUser(user),token:await createSession(user),expiresIn:28800}});}catch(e){next(e);}}
export async function getRolesInfo(req,res){res.json({success:true,data:users.map(sanitizeUser)});}
