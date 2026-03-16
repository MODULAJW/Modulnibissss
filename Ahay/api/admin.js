
export default function handler(req,res){

if(!global.ipdb){
global.ipdb = {}
}

const action = req.query.action

if(action === "list"){
return res.json(global.ipdb)
}

if(action === "reset"){
global.ipdb = {}
return res.json({status:"reset_success"})
}

res.json({
endpoints:{
list:"/api/admin?action=list",
reset:"/api/admin?action=reset"
}
})

}
