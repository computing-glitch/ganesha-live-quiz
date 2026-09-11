
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const QRCode = require("qrcode");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const questions = [
["G1","Question 1","What comes next? 4, 9, 16, 25, 36, ___",["42","49","48","45"],1,"These are square numbers: 2², 3², 4², 5², 6², so the next is 7² = 49."],
["G2","Question 2","There are 3 switches outside a room and 1 bulb inside. You may enter the room only once. How can you identify the correct switch?",["Enter twice","Turn all switches on","Guess","Turn one on, wait, turn it off; turn another on; enter and use light/heat"],3,"Use heat as well as light: one switch leaves a warm bulb, one leaves it on, and one leaves it cold/off."],
["G3","Question 3","Arun says, “Bala is truthful.” Bala says, “Charan is lying.” Charan says, “Arun and Bala are different.” Who is truthful?",["Arun","Charan","All three","Bala"],3,"Testing the statements consistently shows Bala is the truthful person."],
["A1","Question 4","Why does a metal spoon often feel colder than a wooden spoon in the same room?",["Metal has less mass","Metal conducts heat away from your hand faster","Metal is always colder","Wood creates heat"],1,"Metal is a better thermal conductor, so it transfers heat away from your hand faster."],
["A2","Question 5","On the Moon, a hammer and a feather are dropped together. What happens?",["They float forever","The feather reaches first","They reach the ground together","The hammer reaches first"],2,"With essentially no atmosphere, air resistance is negligible, so objects fall together under gravity."],
["A3","Question 6","A student claims fertilizer X makes plants grow faster. What is the best way to test the claim?",["Test only one plant","Change light and water too","Use different plant types each time","Repeat a fair test while controlling other variables"],3,"A fair repeated test changes the fertilizer while keeping other important variables controlled."],
["N1","Question 7","What comes next? 1, 4, 9, 16, 25, ___",["35","40","30","36"],3,"These are 1², 2², 3², 4², 5². The next is 6² = 36."],
["N2","Question 8","The ratio of pencils to pens is 3:5. If there are 64 items altogether, how many are pens?",["32","48","40","24"],2,"There are 8 total ratio parts. 64 ÷ 8 = 8, and 5 × 8 = 40 pens."],
["N3","Question 9","A bag has 5 red, 4 blue and 3 green balls. Two balls are taken without replacement. What is the probability both are red?",["1/6","25/144","5/33","5/22"],2,"The probability is 5/12 × 4/11 = 20/132 = 5/33."],
["E1","Question 10","Which choice best reduces waste during a school festival?",["Throw decorations away after one use","Use more single-use plastic","Reuse decorations and materials","Print everything twice"],2,"Reusing materials reduces the amount of new material needed and keeps waste out of landfill."],
["E2","Question 11","Which factors should you consider when choosing an environmentally friendly product?",["Only its price","Only the colour","Only its size","Biodegradability, durability and environmental impact"],3,"A good environmental choice considers how long it lasts, what happens after use, and its overall impact."],
["E3","Question 12","Waste is reduced from 240 kg to 180 kg, then to 135 kg. Year 3 waste is what percentage of Year 1?",["75%","56.25%","43.75%","62.5%"],1,"135 ÷ 240 × 100 = 56.25%."],
["S1","Question 13","A heartbeat recording is converted into a digital signal. Sound is first represented by what?",["Temperature","Colours only","Printed words","Vibrations changing over time"],3,"Sound is produced by vibrations, which can be captured and converted into a digital signal."],
["S2","Question 14","What mainly determines whether a sound is high-pitched or low-pitched?",["Echo","Frequency","Distance","Volume"],1,"Higher frequency produces a higher pitch; lower frequency produces a lower pitch."],
["S3","Question 15","You hear a bell, then a paper crumple, then water pouring. Which sequence matches the sounds?",["Bell → water → paper","Paper → water → bell","Water → bell → paper","Bell → paper → water"],3,"The first sound is the bell, the second is paper being crumpled, and the third is water."],
["H1","Question 16","A robot prototype fails a test. What should a designer do next?",["Analyze the failure, modify the design and test again","Ignore the result","Change everything randomly","Throw it away immediately"],0,"Engineering improves through a cycle of testing, analyzing evidence, modifying and retesting."],
["H2","Question 17","A robot starts at (0,0), moves 4 units north, 3 east and 4 south. Where does it finish?",["(4,3)","(3,0)","(3,4)","(0,3)"],1,"The 4 units north and 4 units south cancel. The robot is 3 units east: (3,0)."],
["H3","Question 18","A school needs storage boxes for 5 years. Which comparison is most useful?",["Only the purchase price","Only the colour","Long-term cost, durability and environmental impact","Only the box shape"],2,"A long-term decision should consider total cost, how well the boxes last, and environmental effects."],
["X1","Question 19","What comes next? 2, 3, 5, 8, 12, 17, ___",["24","22","23","25"],2,"The differences are +1, +2, +3, +4, +5, so the next difference is +6: 17 + 6 = 23."],
["X2","Question 20","A square has perimeter 48 cm. A rectangle has the same perimeter and length 16 cm. What is its area?",["160 cm²","128 cm²","96 cm²","144 cm²"],1,"The rectangle has 2(16+w)=48, so w=8. Area = 16 × 8 = 128 cm²."],
["X3","Question 21","There are 24 identical equally spaced pieces around a circle. What is the smallest angle of rotational symmetry?",["12°","30°","24°","15°"],3,"360° ÷ 24 = 15°, so the shape matches itself every 15°."]
];

const rooms = new Map();
function makeCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }
function room(code){ return rooms.get(code); }
function broadcast(r, msg, except){
  const data=JSON.stringify(msg);
  for(const c of r.clients) if(c!==except && c.readyState===WebSocket.OPEN) c.send(data);
}
function leaderboard(r){
  return [...r.players.values()].sort((a,b)=>b.score-a.score || a.joinOrder-b.joinOrder)
    .map((p,i)=>({rank:i+1,name:p.name,score:p.score}));
}
function lanIPs(){
  const out=[];
  for(const list of Object.values(os.networkInterfaces()))
    for(const x of (list||[]))
      if(x.family==="IPv4" && !x.internal) out.push(x.address);
  return out;
}
async function apiRoom(req,res){
  let code=makeCode(); while(rooms.has(code)) code=makeCode();
  const r={code,players:new Map(),clients:new Set(),host:null,current:null,joinOrder:0};
  rooms.set(code,r);
  const forwardedProto = (req.headers["x-forwarded-proto"] || "http").split(",")[0];
  const protocol = forwardedProto === "https" ? "https" : "http";
  const publicBase = `${protocol}://${req.headers.host}`;
  const host = `${publicBase}/host.html?room=${code}`;
  const player = `${publicBase}/player.html?room=${code}`;
  const qr = await QRCode.toDataURL(player,{width:360,margin:2});
  res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
  res.end(JSON.stringify({code,playerUrl:player,qr,ips:lanIPs()}));
}
const server=http.createServer(async(req,res)=>{
  if(req.url==="/api/room" && req.method==="POST") return apiRoom(req,res);
  let u=new URL(req.url,`http://localhost:${PORT}`);
  let file=u.pathname==="/" ? "/host.html" : u.pathname;
  if(file==="/health"){res.writeHead(200);return res.end("OK")}
  const fp=path.join(__dirname,file);
  fs.readFile(fp,(err,data)=>{
    if(err){res.writeHead(404);return res.end("Not found")}
    const ext=path.extname(fp);
    const ct={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".png":"image/png"}[ext]||"application/octet-stream";
    res.writeHead(200,{"Content-Type":ct});res.end(data);
  });
});
const wss=new WebSocket.Server({server});
wss.on("connection",ws=>{
  ws.on("message",raw=>{
    let m; try{m=JSON.parse(raw)}catch{return}
    if(m.type==="host_create"){
      let r=room(m.code); if(!r) return ws.send(JSON.stringify({type:"error",message:"Room expired. Create a new game."}));
      r.host=ws; r.clients.add(ws); ws.role="host"; ws.room=m.code;
      ws.send(JSON.stringify({type:"host_ready",questions}));
      broadcast(r,{type:"players",players:leaderboard(r)});
    }
    if(m.type==="player_join"){
      let r=room(m.code);
      if(!r) return ws.send(JSON.stringify({type:"error",message:"Invalid game PIN."}));
      const name=(m.name||"").trim().slice(0,30); if(!name) return;
      const id=Math.random().toString(36).slice(2,10);
      r.joinOrder++;
      r.players.set(id,{id,name,score:0,answered:false,joinOrder:r.joinOrder});
      r.clients.add(ws); ws.role="player"; ws.room=m.code; ws.pid=id;
      ws.send(JSON.stringify({type:"joined",id,name,code:r.code}));
      broadcast(r,{type:"players",players:leaderboard(r)});
    }
    if(m.type==="host_question"){
      let r=room(ws.room); if(!r || ws!==r.host) return;
      const q=questions[m.index]; if(!q) return;
      r.current={index:m.index,start:Date.now(),answers:new Map()};
      for(const p of r.players.values()) p.answered=false;
      broadcast(r,{type:"question",index:m.index,id:q[0],category:q[1],text:q[2],options:q[3],duration:30});
      ws.send(JSON.stringify({type:"question_host",index:m.index,id:q[0],category:q[1],text:q[2],options:q[3],duration:30}));
    }
    if(m.type==="player_answer"){
      let r=room(ws.room), p=r&&r.players.get(ws.pid);
      if(!r||!p||!r.current||p.answered) return;
      const q=questions[r.current.index]; p.answered=true;
      const elapsed=Math.min(30,(Date.now()-r.current.start)/1000);
      const correct=m.answer===q[4];
      const points=correct ? Math.round(1000 - (elapsed/30)*500) : 0;
      p.score+=points; r.current.answers.set(ws.pid,{correct,points});
      ws.send(JSON.stringify({type:"answer_result",correct,points,correctIndex:q[4],explanation:q[5]}));
      broadcast(r,{type:"leaderboard",players:leaderboard(r)});
      if(r.host) r.host.send(JSON.stringify({type:"answer_received",name:p.name,correct,points,total:p.score}));
    }
    if(m.type==="host_reveal"){
      let r=room(ws.room); if(!r||ws!==r.host||!r.current)return;
      const q=questions[r.current.index];
      broadcast(r,{type:"reveal",correctIndex:q[4],explanation:q[5],players:leaderboard(r)});
      ws.send(JSON.stringify({type:"reveal",correctIndex:q[4],explanation:q[5],players:leaderboard(r)}));
    }
    if(m.type==="host_next"){
      let r=room(ws.room); if(!r||ws!==r.host)return;
      broadcast(r,{type:"next_ready"});
    }
  });
  ws.on("close",()=>{
    if(!ws.room)return; const r=room(ws.room); if(!r)return;
    if(ws.role==="player") r.players.delete(ws.pid);
    r.clients.delete(ws);
    broadcast(r,{type:"players",players:leaderboard(r)});
  });
});
server.listen(PORT,()=>console.log(`GANESHA Live Quiz running on http://localhost:${PORT}`));
