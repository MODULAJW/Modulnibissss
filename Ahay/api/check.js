
export default function handler(req, res) {

const ACCESS_TIME = 7 * 24 * 60 * 60 * 1000
const BLOCK_TIME = 24 * 60 * 60 * 1000

if(!global.ipdb){
  global.ipdb = {}
}

function getIP(req){
  return req.headers["x-forwarded-for"] || "unknown"
}

function formatTime(ms){
  let total = Math.floor(ms/1000)
  let m = Math.floor(total/60)
  let s = total % 60
  return `${m}m ${s}s`
}

function ascii(){
return `
██╗   ██╗ ██████╗  █████╗     ████████╗███████╗ ██████╗██╗  ██╗
██║   ██║██╔════╝ ██╔══██╗    ╚══██╔══╝██╔════╝██╔════╝██║  ██║
██║   ██║██║  ███╗███████║       ██║   █████╗  ██║     ███████║
╚██╗ ██╔╝██║   ██║██╔══██║       ██║   ██╔══╝  ██║     ██╔══██║
 ╚████╔╝ ╚██████╔╝██║  ██║       ██║   ███████╗╚██████╗██║  ██║
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝
`
}

const ip = getIP(req)
const now = Date.now()

if(global.ipdb[ip]?.blockedUntil && now < global.ipdb[ip].blockedUntil){

const remain = global.ipdb[ip].blockedUntil - now

return res.send(`
<pre style="color:red;font-family:monospace">

${ascii()}

STATUS : BLOCKED
IP     : ${ip}

BLOCK TIME LEFT
${formatTime(remain)}

SYSTEM : VGA TECH SECURITY

</pre>
`)
}

if(!global.ipdb[ip]){
global.ipdb[ip] = { start: now }
}

const elapsed = now - global.ipdb[ip].start

if(elapsed > ACCESS_TIME){

global.ipdb[ip].blockedUntil = now + BLOCK_TIME

return res.send(`
<pre style="color:red;font-family:monospace">

${ascii()}

SESSION EXPIRED

YOUR IP HAS BEEN BLOCKED
FOR 24 HOURS

SYSTEM : VGA TECH SECURITY

</pre>
`)
}

const remaining = ACCESS_TIME - elapsed

if(req.query.format === "json"){
return res.json({
access:true,
remaining:formatTime(remaining)
})
}

res.send(`
<pre style="color:#00ff9c;font-family:monospace">

${ascii()}

STATUS : ACCESS GRANTED
IP     : ${ip}

TIME LEFT
${formatTime(remaining)}

SYSTEM : VGA TECH ACCESS CONTROL

</pre>
`)

}
