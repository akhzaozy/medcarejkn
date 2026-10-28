export function errorHandler(err,req,res,next) {
  const code=err.statusCode||500;
  if(code>=500)console.error('[API]',req.method,req.path,err.code||'SERVER_ERROR');
  res.status(code).json({success:false,message:code>=500?'Layanan belum tersedia. Perubahan belum disimpan.':err.message||'Permintaan tidak valid.'});
}
