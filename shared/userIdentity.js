export function publicUser(user) {return Object.fromEntries(['id','username','name','role','roleLabel','title','unit'].filter(k=>user?.[k]!==undefined).map(k=>[k,user[k]]));}
export function initials(name='') {return name.replace(/^dr\.\s*/i,'').split(/[\s,]+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()||'U';}
