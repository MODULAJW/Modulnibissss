export default function _0xvg(req,res){

const _0x1=5*60*1000
const _0x2=24*60*60*1000

if(!global._0xdb){
global._0xdb={}
}

function _0xip(r){
return r.headers["x-forwarded-for"]||"unknown"
}

function _0xt(ms){
let _0xa=Math.floor(ms/1000)
let _0xb=Math.floor(_0xa/60)
let _0xc=_0xa%60
return `${_0xb}m ${_0xc}s`
}

function _0xa(){
return `
██╗   ██╗ ██████╗  █████╗     ████████╗███████╗ ██████╗██╗  ██╗
██║   ██║██╔════╝ ██╔══██╗    ╚══██╔══╝██╔════╝██╔════╝██║  ██║
██║   ██║██║  ███╗███████║       ██║   █████╗  ██║     ███████║
╚██╗ ██╔╝██║   ██║██╔══██║       ██║   ██╔══╝  ██║     ██╔══██║
 ╚████╔╝ ╚██████╔╝██║  ██║       ██║   ███████╗╚██████╗██║  ██║
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝
`
}

const _0xipaddr=_0xip(req)
const _0xnow=Date.now()

if(global._0xdb[_0xipaddr]?.b&&_0xnow<global._0xdb[_0xipaddr].b){

let _0xr=global._0xdb[_0xipaddr].b-_0xnow

return res.send(`
<pre style="color:red;font-family:monospace">

${_0xa()}

STATUS : BLOCKED
IP     : ${_0xipaddr}

BLOCK TIME LEFT
${_0xt(_0xr)}

SYSTEM : VGA TECH SECURITY

</pre>
`)
}

if(!global._0xdb[_0xipaddr]){
global._0xdb[_0xipaddr]={s:_0xnow}
}

const _0xel=_0xnow-global._0xdb[_0xipaddr].s

if(_0xel>_0x1){

global._0xdb[_0xipaddr].b=_0xnow+_0x2

return res.send(`
<pre style="color:red;font-family:monospace">

${_0xa()}

SESSION EXPIRED

YOUR IP HAS BEEN BLOCKED
FOR 24 HOURS

SYSTEM : VGA TECH SECURITY

</pre>
`)
}

const _0xrem=_0x1-_0xel

if(req.query.format==="json"){
return res.json({
access:true,
remaining:_0xt(_0xrem)
})
}

res.send(`
<pre style="color:#00ff9c;font-family:monospace">

${_0xa()}

STATUS : ACCESS GRANTED
IP     : ${_0xipaddr}

TIME LEFT
${_0xt(_0xrem)}

SYSTEM : VGA TECH ACCESS CONTROL

</pre>
`)

}
