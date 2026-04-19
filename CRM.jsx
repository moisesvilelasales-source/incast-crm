import { useState, useEffect, useMemo, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0:"#04050a",bg1:"#080b12",bg2:"#0d1018",bg3:"#131720",bg4:"#191e2a",bg5:"#1f2535",
  border:"rgba(255,255,255,0.06)",borderHover:"rgba(255,255,255,0.12)",borderAccent:"rgba(79,110,247,0.3)",
  text1:"#eef0f8",text2:"#8b95b0",text3:"#525d7a",text4:"#2e3650",
  accent:"#4f6ef7",accentHover:"#6b85ff",accentSoft:"rgba(79,110,247,0.1)",accentGlow:"rgba(79,110,247,0.25)",
  green:"#10b981",greenSoft:"rgba(16,185,129,0.1)",
  amber:"#f59e0b",amberSoft:"rgba(245,158,11,0.1)",
  red:"#ef4444",redSoft:"rgba(239,68,68,0.1)",
  purple:"#8b5cf6",purpleSoft:"rgba(139,92,246,0.1)",
  cyan:"#06b6d4",cyanSoft:"rgba(6,182,212,0.1)",
  pink:"#ec4899",pinkSoft:"rgba(236,72,153,0.1)",
  orange:"#f97316",orangeSoft:"rgba(249,115,22,0.1)",
  teal:"#14b8a6",tealSoft:"rgba(20,184,166,0.1)",
  r:{sm:"6px",md:"10px",lg:"14px",xl:"18px","2xl":"24px",full:"9999px"},
  sh:{sm:"0 1px 4px rgba(0,0,0,0.5)",md:"0 4px 20px rgba(0,0,0,0.6)",lg:"0 16px 48px rgba(0,0,0,0.8)",glow:"0 0 24px rgba(79,110,247,0.2)"},
  f:{xs:"10px",sm:"11px",base:"13px",md:"14px",lg:"16px",xl:"20px","2xl":"26px","3xl":"34px"},
};

// ─── DATA LAYER ───────────────────────────────────────────────────────────────
const NICHES=["Beleza","Fitness","Lifestyle","Moda","Tecnologia","Games","Gastronomia","Viagem","Finanças","Educação","Maternidade","Pets","Decoração","Música","Esporte","Saúde","Sustentabilidade","Humor","Arte","Negócios"];
const PLATFORMS=["Instagram","TikTok","YouTube","Twitter/X","Pinterest","Twitch","LinkedIn","Kwai"];
const STATES=["SP","RJ","MG","RS","PR","BA","CE","SC","PE","GO","DF","ES","AM","PA","MT"];
const STATUSES=["Novo","Prospecção","1º Contato","Negociando","Proposta","Fechado","Pausado","Rejeitado"];
const STATUS_META={
  "Novo":{c:"#4f6ef7",bg:"rgba(79,110,247,0.1)"},
  "Prospecção":{c:"#06b6d4",bg:"rgba(6,182,212,0.1)"},
  "1º Contato":{c:"#8b5cf6",bg:"rgba(139,92,246,0.1)"},
  "Negociando":{c:"#f59e0b",bg:"rgba(245,158,11,0.1)"},
  "Proposta":{c:"#f97316",bg:"rgba(249,115,22,0.1)"},
  "Fechado":{c:"#10b981",bg:"rgba(16,185,129,0.1)"},
  "Pausado":{c:"#525d7a",bg:"rgba(82,93,122,0.1)"},
  "Rejeitado":{c:"#ef4444",bg:"rgba(239,68,68,0.1)"},
};
const TIER_META={
  "Mega":{c:"#ef4444",bg:"rgba(239,68,68,0.1)",label:"Mega 1M+",min:1000000},
  "Macro":{c:"#f97316",bg:"rgba(249,115,22,0.1)",label:"Macro 500K+",min:500000},
  "Mid":{c:"#10b981",bg:"rgba(16,185,129,0.1)",label:"Mid 100K+",min:100000},
  "Micro":{c:"#4f6ef7",bg:"rgba(79,110,247,0.1)",label:"Micro 10K+",min:10000},
  "Nano":{c:"#8b5cf6",bg:"rgba(139,92,246,0.1)",label:"Nano <10K",min:0},
};
const CONTENT_TYPES=["Fotos","Reels","Stories","Vídeos longos","Lives","Podcasts","Carrosséis","Misto"];
const BRAND_SAFETY=["Brand Safe","Álcool (verificar)","Conteúdo adulto","Polêmico","Sem restrições"];
const FAKE_RATE_LABELS=["Excelente (<5%)","Bom (5-10%)","Médio (10-20%)","Alto risco (>20%)"];

function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function pick(a){return a[rnd(0,a.length-1)];}
function pickN(a,n){return [...a].sort(()=>Math.random()-0.5).slice(0,n);}
const FN=["Ana","Pedro","Larissa","Bruno","Camila","Rafael","Julia","Lucas","Sofia","Marcos","Fernanda","Diego","Beatriz","Thiago","Marina","Carlos","Leticia","Gabriel","Amanda","Rodrigo","Isabela","Felipe","Natalia","Victor","Giovanna","Eduardo","Mariana","Henrique","Bianca","Mateus","Renata","Vinicius","Paula","Diego","Aline","Ricardo","Sandra","Fabio","Carla","Alexandro"];
const LN=["Silva","Costa","Oliveira","Santos","Alves","Pereira","Ferreira","Lima","Carvalho","Rodrigues","Nascimento","Martins","Souza","Castro","Barbosa","Mendes","Gomes","Freitas","Cardoso","Ribeiro"];
let _uid=1;
function gen(){
  const id=_uid++,fn=pick(FN),ln=pick(LN);
  const name=`${fn} ${ln}`,handle=`@${fn.toLowerCase()}${ln.toLowerCase().slice(0,3)}${rnd(10,99)}`;
  const niche=pickN(NICHES,rnd(1,3)),platform=pickN(PLATFORMS,rnd(1,4));
  const mf=rnd(900,3500000);
  const followers={};
  platform.forEach((p,i)=>{followers[p]=i===0?mf:rnd(Math.floor(mf*.08),Math.floor(mf*.55));});
  const eng=parseFloat((Math.random()*.13+.006).toFixed(4));
  const state=pick(STATES),status=pick(STATUSES);
  const tier=mf>=1000000?"Mega":mf>=500000?"Macro":mf>=100000?"Mid":mf>=10000?"Micro":"Nano";
  const score=Math.min(100,Math.round(eng*750+Math.log10(mf)*8+rnd(-6,6)));
  const fakeRate=rnd(2,28);
  const aqScore=Math.max(20,100-fakeRate*2-rnd(0,15)); // Audience Quality Score
  const brandAffinity=pickN(["Nike","Adidas","L'Oréal","Maybelline","Samsung","Apple","Havaianas","Natura","O Boticário","Nestlé","Coca-Cola","iFood","Nubank","Magazine Luiza"],rnd(0,4));
  const competitorMentions=pickN(["Brand A","Brand B","Brand C"],rnd(0,2));
  const avgViews=Math.round(mf*(eng*rnd(2,5)));
  const growth=parseFloat((Math.random()*.3-.06).toFixed(3));
  const reachRate=parseFloat((Math.random()*.35+.05).toFixed(3));
  const cpe=parseFloat((mf/100000*rnd(8,35)/100).toFixed(2));
  const cachê=Math.round(mf/1000)*rnd(4,14);
  const email=`${fn.toLowerCase()}@${pick(["gmail","outlook","creator","agency"])}.com`;
  const tags=pickN(["Alta conversão","Entrega no prazo","Bom custo-benefício","Já trabalhou","Audiência engajada","Conteúdo premium","Recomendado","Brand safe","Internacional"],rnd(0,3));
  const notes=Math.random()>.6?pick(["Muito profissional","Atenção ao prazo","Precisa de briefing","Excelente qualidade","Parceria ideal",""]): "";
  const lastContact=new Date(Date.now()-rnd(0,90)*86400000).toISOString().slice(0,10);
  const createdAt=new Date(Date.now()-rnd(1,400)*86400000).toISOString().slice(0,10);
  const contentType=pick(CONTENT_TYPES);
  const brandSafety=pick(BRAND_SAFETY);
  const language=pick(["Português","Inglês","Espanhol","Bilíngue"]);
  const gender=pick(["Feminino","Masculino","Não-binário"]);
  const audienceAge=pick(["13-17","18-24","25-34","35-44","45+"]);
  const campaigns=rnd(0,12);
  const favorited=Math.random()>.82;
  const verified=Math.random()>.7;
  return {id,name,handle,niche,platform,followers,eng,state,status,tier,score,fakeRate,aqScore,brandAffinity,competitorMentions,avgViews,growth,reachRate,cpe,cachê,email,tags,notes,lastContact,createdAt,contentType,brandSafety,language,gender,audienceAge,campaigns,favorited,verified,mainFollowers:mf};
}
const SEED=Array.from({length:150},gen);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(0)+"K":String(n);
const fmtPct=n=>(n*100).toFixed(1)+"%";
const fmtR=n=>"R$ "+n.toLocaleString("pt-BR");
const totF=i=>Object.values(i.followers).reduce((a,b)=>a+b,0);
const PLAT_ICON={"Instagram":"📷","TikTok":"🎵","YouTube":"▶","Twitter/X":"𝕏","Pinterest":"📌","Twitch":"🎮","LinkedIn":"💼","Kwai":"🎬"};

// ─── AI HELPER ────────────────────────────────────────────────────────────────
async function ai(prompt,sys="Você é especialista em marketing de influência. Seja direto e prático."){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:prompt}]})});
  const d=await r.json();return d.content?.map(b=>b.text||"").join("")||"";
}

// ─── BASE UI ──────────────────────────────────────────────────────────────────
const css=`
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideR{from{transform:translateX(100%)}to{transform:translateX(0)}}
  @keyframes pop{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  input::placeholder,textarea::placeholder{color:#525d7a;}
  select option{background:#131720;color:#eef0f8;}
  .hover-lift{transition:all .18s;} .hover-lift:hover{transform:translateY(-2px);}
  .card-hover{transition:all .15s;} .card-hover:hover{background:rgba(255,255,255,0.04)!important;border-color:rgba(255,255,255,0.1)!important;}
`;

function Txt({c,size="base",w=400,style:s,...p}){return <span style={{color:c||T.text1,fontSize:T.f[size],fontWeight:w,...s}} {...p}/>;}
function Div({gap,pad,dir,align,justify,wrap,style:s,...p}){return <div style={{display:"flex",flexDirection:dir||"row",gap,padding:pad,alignItems:align,justifyContent:justify,flexWrap:wrap??"nowrap",...s}} {...p}/>;}
function Col({gap,pad,style:s,...p}){return <Div dir="column" gap={gap} pad={pad} style={s} {...p}/>;}

function Avatar({name,size=36,url,verified}){
  const init=name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const COLS=["#4f6ef7","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#f97316"];
  const ci=name.charCodeAt(0)%COLS.length;
  return <div style={{position:"relative",flexShrink:0}}>
    {url?<img src={url} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover"}}/>
    :<div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${COLS[ci]},${COLS[(ci+3)%COLS.length]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.36,fontWeight:700,color:"#fff",letterSpacing:"-.5px"}}>{init}</div>}
    {verified&&<div style={{position:"absolute",bottom:-1,right:-1,width:size*.32,height:size*.32,borderRadius:"50%",background:"#4f6ef7",border:`2px solid ${T.bg1}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.16,color:"#fff"}}>✓</div>}
  </div>;
}

function Badge({label,color,dot,size="sm"}){
  const fs=size==="xs"?"10px":"11px",py=size==="xs"?"2px":"3px",px=size==="xs"?"6px":"8px";
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,background:(color||T.accent)+"1a",color:color||T.accent,border:`1px solid ${color||T.accent}22`,borderRadius:T.r.full,fontSize:fs,fontWeight:600,padding:`${py} ${px}`,whiteSpace:"nowrap",lineHeight:1.2}}>
    {dot&&<span style={{width:4,height:4,borderRadius:"50%",background:color||T.accent}}/>}
    {label}
  </span>;
}

function ScoreRing({score,size=40}){
  const c=score>=80?T.green:score>=60?T.amber:T.red;
  const r=(size-size*.12)/2,circ=2*Math.PI*r,dash=(score/100)*circ;
  return <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={size*.12}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={size*.12} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.28,fontWeight:800,color:c}}>{score}</div>
  </div>;
}

// AQS = Audience Quality Score (inspired by HypeAuditor)
function AQSBadge({score}){
  const c=score>=80?T.green:score>=60?T.amber:T.red;
  const label=score>=80?"Alta":score>=60?"Média":"Baixa";
  return <div style={{display:"flex",alignItems:"center",gap:4}}>
    <div style={{width:28,height:28,borderRadius:"50%",background:c+"18",border:`1px solid ${c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:800,color:c}}>{score}</div>
    <div style={{fontSize:"10px",color:T.text3}}>AQS<br/><span style={{color:c,fontWeight:600}}>{label}</span></div>
  </div>;
}

function FakeRateBar({rate}){
  const c=rate<5?T.green:rate<10?T.amber:T.red;
  const label=rate<5?"Excelente":rate<10?"Bom":rate<20?"Médio":"Alto risco";
  return <div>
    <Div align="center" justify="space-between" style={{marginBottom:4}}>
      <Txt size="xs" c={T.text3}>Seguidores Falsos</Txt>
      <Txt size="xs" c={c} w={700}>{rate}% — {label}</Txt>
    </Div>
    <div style={{background:T.bg5,borderRadius:T.r.full,height:4}}>
      <div style={{background:c,borderRadius:T.r.full,height:"100%",width:`${Math.min(rate*2.5,100)}%`,transition:"width .5s"}}/>
    </div>
  </div>;
}

function Btn({children,onClick,variant="primary",size="md",disabled,loading,icon,full,...rest}){
  const VS={
    primary:{bg:T.accent,c:"#fff",hover:T.accentHover,border:"none"},
    secondary:{bg:T.bg4,c:T.text1,hover:T.bg5,border:`1px solid ${T.border}`},
    ghost:{bg:"transparent",c:T.text2,hover:"rgba(255,255,255,0.04)",border:"none"},
    danger:{bg:T.redSoft,c:T.red,hover:"rgba(239,68,68,0.18)",border:`1px solid rgba(239,68,68,0.2)`},
    success:{bg:T.greenSoft,c:T.green,hover:"rgba(16,185,129,0.18)",border:`1px solid rgba(16,185,129,0.2)`},
    accent:{bg:`linear-gradient(135deg,${T.accent},#7c3aed)`,c:"#fff",hover:T.accentHover,border:"none"},
  };
  const SZ={sm:{p:"5px 11px",fs:"11px"},md:{p:"8px 15px",fs:"13px"},lg:{p:"11px 22px",fs:"14px"}};
  const v=VS[variant]||VS.primary,s=SZ[size]||SZ.md;
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} disabled={disabled||loading} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov&&v.hover?v.hover:v.bg,color:v.c,border:v.border||"none",borderRadius:T.r.md,padding:s.p,fontSize:s.fs,fontWeight:600,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled?.5:1,display:"inline-flex",alignItems:"center",gap:6,transition:"all .15s",whiteSpace:"nowrap",fontFamily:"inherit",letterSpacing:"-.2px",width:full?"100%":undefined,justifyContent:full?"center":undefined,...rest.style}}>
    {loading?<span style={{width:13,height:13,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",flexShrink:0}}/>:icon&&<span style={{fontSize:"13px"}}>{icon}</span>}
    {children}
  </button>;
}

function Input({label,value,onChange,placeholder,type="text",icon,prefix,...rest}){
  const [foc,setFoc]=useState(false);
  return <Col gap={5}>
    {label&&<Txt size="sm" c={T.text2} w={500}>{label}</Txt>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {(icon||prefix)&&<span style={{position:"absolute",left:10,color:T.text3,fontSize:"13px",pointerEvents:"none",zIndex:1}}>{icon||prefix}</span>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={{width:"100%",background:T.bg3,border:`1px solid ${foc?T.accent:T.border}`,borderRadius:T.r.md,padding:`9px 12px 9px ${icon||prefix?34:12}px`,color:T.text1,fontSize:T.f.base,outline:"none",transition:"border-color .15s",fontFamily:"inherit",boxSizing:"border-box"}} {...rest}/>
    </div>
  </Col>;
}

function Select2({label,value,onChange,options}){
  return <Col gap={5}>
    {label&&<Txt size="sm" c={T.text2} w={500}>{label}</Txt>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"9px 30px 9px 12px",color:T.text1,fontSize:T.f.base,outline:"none",cursor:"pointer",fontFamily:"inherit",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7'%3E%3Cpath d='M1 1l4.5 5L10 1' stroke='%23525d7a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",width:"100%"}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </Col>;
}

function Modal({title,subtitle,onClose,children,width=580,noPad}){
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:T.r["2xl"],width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:T.sh.lg,animation:"pop .2s ease"}}>
      <Div align="center" justify="space-between" style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`}}>
        <Col gap={2}>
          <Txt size="lg" w={700}>{title}</Txt>
          {subtitle&&<Txt size="sm" c={T.text3}>{subtitle}</Txt>}
        </Col>
        <Btn variant="ghost" size="sm" onClick={onClose} style={{minWidth:"unset",padding:"6px 8px"}}>✕</Btn>
      </Div>
      <div style={noPad?{}:{padding:"22px"}}>{children}</div>
    </div>
  </div>;
}

function Toast({message,type="success",onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  const C={success:T.green,error:T.red,info:T.accent,warning:T.amber};
  return <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:T.bg2,border:`1px solid ${C[type]}44`,borderLeft:`3px solid ${C[type]}`,borderRadius:T.r.lg,padding:"12px 16px",boxShadow:T.sh.lg,display:"flex",alignItems:"center",gap:10,maxWidth:360,animation:"fadeUp .2s ease"}}>
    <span style={{fontSize:16}}>{type==="success"?"✓":type==="error"?"✕":type==="warning"?"⚠":"ℹ"}</span>
    <Txt size="base" style={{flex:1}}>{message}</Txt>
    <button onClick={onClose} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:16}}>×</button>
  </div>;
}

function EmptyState({icon,title,desc,action}){
  return <Col align="center" gap={14} style={{padding:"60px 20px",textAlign:"center"}}>
    <span style={{fontSize:48}}>{icon}</span>
    <Col gap={6} align="center"><Txt size="lg" w={600}>{title}</Txt><Txt size="base" c={T.text3} style={{maxWidth:300}}>{desc}</Txt></Col>
    {action}
  </Col>;
}

// ─── COMPARATOR (NEW — inspired by Modash/HypeAuditor) ───────────────────────
function ComparatorModal({influencers,onClose}){
  const [selected,setSelected]=useState([]);
  const [search,setSearch]=useState("");
  const filtered=influencers.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.handle.toLowerCase().includes(search.toLowerCase())).slice(0,20);
  const cols=selected.map(id=>influencers.find(i=>i.id===id)).filter(Boolean);
  const METRICS=[
    {label:"Seguidores",fn:i=>fmtN(totF(i))},
    {label:"Engajamento",fn:i=>fmtPct(i.eng),color:i=>i.eng>=0.05?T.green:i.eng>=0.02?T.amber:T.red},
    {label:"Score IA",fn:i=>i.score+"/100",color:i=>i.score>=80?T.green:i.score>=60?T.amber:T.red},
    {label:"AQS (Audiência)",fn:i=>i.aqScore+"/100",color:i=>i.aqScore>=80?T.green:i.aqScore>=60?T.amber:T.red},
    {label:"Seguidores Falsos",fn:i=>i.fakeRate+"%",color:i=>i.fakeRate<5?T.green:i.fakeRate<15?T.amber:T.red},
    {label:"Views Médias",fn:i=>fmtN(i.avgViews)},
    {label:"Crescimento Mensal",fn:i=>(i.growth*100).toFixed(1)+"%",color:i=>i.growth>0?T.green:T.red},
    {label:"Alcance Estimado",fn:i=>fmtPct(i.reachRate)},
    {label:"Cachê Estimado",fn:i=>fmtR(i.cachê)},
    {label:"Nichos",fn:i=>i.niche.join(", ")},
    {label:"Plataformas",fn:i=>i.platform.join(", ")},
    {label:"Estado",fn:i=>i.state},
    {label:"Brand Safety",fn:i=>i.brandSafety,color:i=>i.brandSafety==="Brand Safe"?T.green:T.amber},
    {label:"Campanhas realizadas",fn:i=>i.campaigns},
    {label:"Afinidade com marcas",fn:i=>i.brandAffinity.length>0?i.brandAffinity.slice(0,2).join(", "):"Nenhuma"},
  ];
  return <Modal title="⚖️ Comparador de Creators" subtitle="Compare até 3 influenciadores lado a lado" onClose={onClose} width={900} noPad>
    <div style={{padding:20,borderBottom:`1px solid ${T.border}`}}>
      <Input icon="🔍" value={search} onChange={setSearch} placeholder="Buscar influenciador para comparar..."/>
      <Div gap={8} style={{marginTop:10,flexWrap:"wrap"}}>
        {filtered.map(i=>{
          const sel=selected.includes(i.id);
          return <button key={i.id} onClick={()=>{if(sel)setSelected(s=>s.filter(x=>x!==i.id));else if(selected.length<3)setSelected(s=>[...s,i.id]);}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:T.r.md,border:`1px solid ${sel?T.accent:T.border}`,background:sel?T.accentSoft:"transparent",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            <Avatar name={i.name} size={22} url={`https://i.pravatar.cc/44?img=${i.id}`}/>
            <Txt size="xs" c={sel?T.accent:T.text2} w={sel?700:400}>{i.name}</Txt>
          </button>;
        })}
      </Div>
    </div>
    {cols.length===0?<Col align="center" gap={10} style={{padding:"40px 20px"}}>
      <span style={{fontSize:40}}>⚖️</span>
      <Txt size="md" c={T.text3}>Selecione até 3 influenciadores acima para comparar</Txt>
    </Col>:
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:T.bg2}}>
            <th style={{padding:"12px 16px",textAlign:"left",fontSize:T.f.xs,color:T.text3,fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",width:150}}>Métrica</th>
            {cols.map(i=><th key={i.id} style={{padding:"12px 16px",textAlign:"center",borderLeft:`1px solid ${T.border}`}}>
              <Col align="center" gap={6}>
                <Avatar name={i.name} size={36} url={`https://i.pravatar.cc/72?img=${i.id}`}/>
                <Txt size="sm" w={700}>{i.name}</Txt>
                <Txt size="xs" c={T.accent}>{i.handle}</Txt>
              </Col>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m,mi)=><tr key={m.label} style={{borderTop:`1px solid ${T.border}`,background:mi%2===0?T.bg1:T.bg2}}>
            <td style={{padding:"10px 16px",fontSize:T.f.sm,color:T.text3,fontWeight:500}}>{m.label}</td>
            {cols.map(i=>{
              const val=m.fn(i),col=m.color?m.color(i):T.text1;
              const isMax=m.color&&cols.length>1&&col===T.green;
              return <td key={i.id} style={{padding:"10px 16px",textAlign:"center",borderLeft:`1px solid ${T.border}`,background:isMax?"rgba(16,185,129,0.04)":"transparent"}}>
                <Txt size="base" c={col} w={isMax?700:500}>{val}{isMax&&" ✓"}</Txt>
              </td>;
            })}
          </tr>)}
        </tbody>
      </table>
    </div>}
  </Modal>;
}

// ─── FRAUD DETECTOR (inspired by HypeAuditor) ────────────────────────────────
function FraudAnalysis({inf}){
  const signals=[
    {label:"Seguidores suspeitos",value:inf.fakeRate+"%",risk:inf.fakeRate>15,detail:"Contas inativas ou bots detectados"},
    {label:"Crescimento orgânico",value:inf.growth>0?"Positivo":"Negativo/Estagnado",risk:inf.growth<-0.01,detail:"Variação mensal de seguidores"},
    {label:"Taxa de comentários",value:(inf.eng*0.12*100).toFixed(2)+"%",risk:inf.eng*0.12<0.001,detail:"Proporção comentários/seguidores"},
    {label:"Consistência de engajamento",value:inf.aqScore>=70?"Consistente":"Irregular",risk:inf.aqScore<70,detail:"Padrão ao longo do tempo"},
  ];
  const overall=inf.fakeRate<10&&inf.aqScore>=70;
  return <Col gap={12}>
    <Div align="center" gap={10} style={{padding:"14px 16px",background:overall?T.greenSoft:T.amberSoft,borderRadius:T.r.lg,border:`1px solid ${overall?T.green:T.amber}22`}}>
      <span style={{fontSize:22}}>{overall?"🛡️":"⚠️"}</span>
      <Col gap={2}>
        <Txt size="md" c={overall?T.green:T.amber} w={700}>{overall?"Perfil Verificado — Baixo Risco":"Atenção — Verificar Manualmente"}</Txt>
        <Txt size="xs" c={T.text3}>Análise automática de autenticidade</Txt>
      </Col>
      <AQSBadge score={inf.aqScore}/>
    </Div>
    {signals.map(s=><Div key={s.label} align="center" justify="space-between" style={{padding:"10px 14px",background:T.bg3,borderRadius:T.r.md,border:`1px solid ${s.risk?"rgba(239,68,68,0.2)":T.border}`}}>
      <Col gap={2}>
        <Txt size="sm" w={600} c={s.risk?T.red:T.text1}>{s.label}</Txt>
        <Txt size="xs" c={T.text3}>{s.detail}</Txt>
      </Col>
      <Badge label={s.value} color={s.risk?T.red:T.green}/>
    </Div>)}
    <FakeRateBar rate={inf.fakeRate}/>
  </Col>;
}

// ─── BRAND AFFINITY (inspired by Modash) ─────────────────────────────────────
function BrandAffinitySection({inf}){
  return <Col gap={10}>
    <Txt size="sm" c={T.text2} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>🏷️ Afinidade com Marcas</Txt>
    {inf.brandAffinity.length>0?
      <Div gap={6} wrap><strong>{inf.brandAffinity.map(b=><Badge key={b} label={b} color={T.cyan} size="xs"/>)}</strong></Div>
      :<Txt size="sm" c={T.text3}>Nenhuma menção detectada</Txt>}
    {inf.competitorMentions.length>0&&<>
      <Txt size="xs" c={T.amber} w={600}>⚠️ Mencionou concorrentes: {inf.competitorMentions.join(", ")}</Txt>
    </>}
    <Div align="center" gap={6} style={{padding:"10px 14px",background:T.bg3,borderRadius:T.r.md}}>
      <span style={{fontSize:14}}>{inf.brandSafety==="Brand Safe"?"🛡️":"⚠️"}</span>
      <Col gap={1}>
        <Txt size="xs" c={T.text3}>Brand Safety</Txt>
        <Txt size="sm" c={inf.brandSafety==="Brand Safe"?T.green:T.amber} w={700}>{inf.brandSafety}</Txt>
      </Col>
    </Div>
  </Col>;
}

// ─── INFLUENCER CARD ──────────────────────────────────────────────────────────
function ICard({inf,onClick,onFav,view,bfscore}){
  const [hov,setHov]=useState(false);
  const total=totF(inf),sm=STATUS_META[inf.status]||STATUS_META["Novo"],tm=TIER_META[inf.tier];
  if(view==="list")return(
    <div onClick={()=>onClick(inf)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.bg3:T.bg2,border:`1px solid ${hov?T.borderHover:T.border}`,borderRadius:T.r.lg,padding:"12px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
      <Avatar name={inf.name} size={40} url={`https://i.pravatar.cc/80?img=${inf.id}`} verified={inf.verified}/>
      <Col gap={3} style={{flex:1,minWidth:0}}>
        <Div align="center" gap={6}><Txt size="md" w={700}>{inf.name}</Txt><Txt size="sm" c={T.accent}>{inf.handle}</Txt>{inf.verified&&<Badge label="✓" color={T.accent} size="xs"/>}</Div>
        <Div gap={4} wrap>{inf.niche.slice(0,2).map(n=><Badge key={n} label={n} color={T.purple} size="xs"/>)}</Div>
      </Col>
      <Div gap={6}>{inf.platform.slice(0,3).map(p=><span key={p} title={p} style={{fontSize:13}}>{PLAT_ICON[p]||"🌐"}</span>)}</Div>
      <Col align="flex-end" gap={2} style={{minWidth:70}}>
        <Txt size="md" w={700}>{fmtN(total)}</Txt>
        <Txt size="sm" c={T.green} w={600}>{fmtPct(inf.eng)}</Txt>
      </Col>
      <AQSBadge score={inf.aqScore}/>
      <Badge label={tm.label} color={tm.c} size="xs"/>
      <Badge label={inf.status} color={sm.c} dot size="xs"/>
      <ScoreRing score={inf.score} size={36}/>
      {bfscore&&<div style={{background:T.amberSoft,border:"1px solid rgba(245,158,11,0.2)",borderRadius:T.r.md,padding:"4px 8px",textAlign:"center",minWidth:46}}>
        <Txt size="sm" c={T.amber} w={800}>{bfscore.score}</Txt>
        <Txt size="xs" c={T.text4} style={{display:"block"}}>fit</Txt>
      </div>}
      <button onClick={e=>{e.stopPropagation();onFav(inf.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:inf.favorited?"#fbbf24":T.text4,transition:"color .15s",padding:4}}>{inf.favorited?"★":"☆"}</button>
    </div>
  );
  return(
    <div onClick={()=>onClick(inf)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.bg3:T.bg2,border:`1px solid ${hov?T.borderHover:T.border}`,borderRadius:T.r.xl,padding:16,cursor:"pointer",transition:"all .15s",position:"relative",display:"flex",flexDirection:"column",gap:12}}>
      {bfscore&&<div style={{position:"absolute",top:-8,right:10,background:`linear-gradient(135deg,${T.amber},${T.orange})`,borderRadius:T.r.full,padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#fff",boxShadow:`0 2px 8px rgba(245,158,11,0.4)`}}>🎯 {bfscore.score}</div>}
      <button onClick={e=>{e.stopPropagation();onFav(inf.id);}} style={{position:"absolute",top:12,right:12,background:"none",border:"none",cursor:"pointer",fontSize:17,color:inf.favorited?"#fbbf24":T.text4,transition:"color .15s"}}>{inf.favorited?"★":"☆"}</button>
      <Div gap={10} align="flex-start">
        <Avatar name={inf.name} size={48} url={`https://i.pravatar.cc/96?img=${inf.id}`} verified={inf.verified}/>
        <Col gap={3} style={{flex:1,minWidth:0}}>
          <Div align="center" gap={5}><Txt size="md" w={700}>{inf.name}</Txt></Div>
          <Txt size="sm" c={T.accent} w={500}>{inf.handle}</Txt>
          <Div gap={4} wrap>{inf.niche.slice(0,2).map(n=><Badge key={n} label={n} color={T.purple} size="xs"/>)}<Badge label={tm.label} color={tm.c} size="xs"/></Div>
        </Col>
      </Div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {[["👥",fmtN(totF(inf)),"seguids."],[inf.eng>=0.05?"🔥":"📈",fmtPct(inf.eng),"eng."],["👁️",fmtN(inf.avgViews),"views"]].map(([ic,v,l])=>(
          <div key={l} style={{background:T.bg4,borderRadius:T.r.md,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:11,marginBottom:2}}>{ic}</div>
            <Txt size="sm" w={700} style={{display:"block"}}>{v}</Txt>
            <Txt size="xs" c={T.text4} style={{display:"block"}}>{l}</Txt>
          </div>
        ))}
      </div>
      <Div justify="space-between" align="center">
        <Div gap={4}>{inf.platform.slice(0,3).map(p=><span key={p} title={p} style={{fontSize:12}}>{PLAT_ICON[p]||"🌐"}</span>)}</Div>
        <AQSBadge score={inf.aqScore}/>
        <ScoreRing score={inf.score} size={36}/>
      </Div>
      <Div justify="space-between" align="center">
        <Badge label={inf.status} color={sm.c} dot size="xs"/>
        <Txt size="xs" c={T.text3}>📍{inf.state}</Txt>
        <Txt size="xs" c={inf.fakeRate<10?T.green:T.amber} w={600}>~{inf.fakeRate}% falsos</Txt>
      </Div>
      {bfscore?.justification&&<div style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:T.r.md,padding:"7px 10px",fontSize:11,color:T.text2,lineHeight:1.5}}>💬 {bfscore.justification}</div>}
    </div>
  );
}

// ─── INFLUENCER DETAIL DRAWER ─────────────────────────────────────────────────
function Drawer({inf,onClose,onUpdate,lists,setToast}){
  const [tab,setTab]=useState("perfil");
  const [notes,setNotes]=useState(inf.notes||"");
  const [status,setStatus]=useState(inf.status);
  const [aio,setAio]=useState(""); const [aLoad,setALoad]=useState(false);
  const sm=STATUS_META[inf.status]||STATUS_META["Novo"];
  const TABS=[["perfil","◎ Perfil"],["metricas","◈ Métricas"],["fraude","🛡️ Fraude"],["afinity","🏷️ Marcas"],["crm","⊞ CRM"],["ia","✦ IA"]];

  async function runAI(task){
    setALoad(true);setTab("ia");setAio("");
    const prompts={
      summary:`Resumo estratégico de ${inf.name} (${inf.handle}), nicho: ${inf.niche.join(", ")}, ${fmtN(totF(inf))} seguidores, ${fmtPct(inf.eng)} engajamento, tier ${inf.tier}, AQS ${inf.aqScore}/100, ${inf.fakeRate}% falsos. Foque em: potencial comercial, riscos, oportunidades.`,
      message:`Crie mensagem de 1º contato personalizada para ${inf.name} (@${inf.handle.slice(1)}), criador de ${inf.niche[0]}. Profissional mas próximo. Objetivo: proposta de parceria. Máx. 120 palavras.`,
      nextstep:`CRM: ${inf.name}, status: "${status}", ${inf.campaigns} campanhas, AQS ${inf.aqScore}. Recomende 3 próximos passos táticos no pipeline.`,
    };
    try{const r=await ai(prompts[task]);setAio(r);}catch{setAio("Erro ao conectar.");}
    setALoad(false);
  }
  function save(){onUpdate({...inf,notes,status});setToast({message:"Salvo!",type:"success"});}

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:900,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <Col style={{width:560,height:"100vh",overflowY:"auto",background:T.bg1,borderLeft:`1px solid ${T.border}`,animation:"slideR .2s ease"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,rgba(79,110,247,0.07),rgba(139,92,246,0.04))`,borderBottom:`1px solid ${T.border}`,padding:"18px 22px"}}>
        <Div justify="space-between" style={{marginBottom:14}}>
          <Div gap={12} align="flex-start">
            <Avatar name={inf.name} size={60} url={`https://i.pravatar.cc/120?img=${inf.id}`} verified={inf.verified}/>
            <Col gap={4}>
              <Div align="center" gap={6}><Txt size="xl" w={800}>{inf.name}</Txt>{inf.verified&&<Badge label="Verificado" color={T.accent} size="xs"/>}</Div>
              <Txt size="base" c={T.accent} w={500}>{inf.handle}</Txt>
              <Div gap={4} wrap>{inf.niche.map(n=><Badge key={n} label={n} color={T.purple} size="xs"/>)}<Badge label={TIER_META[inf.tier]?.label} color={TIER_META[inf.tier]?.c} size="xs"/></Div>
            </Col>
          </Div>
          <Col align="flex-end" gap={8}>
            <Btn variant="ghost" size="sm" onClick={onClose} style={{minWidth:"unset"}}>✕</Btn>
            <ScoreRing score={inf.score} size={44}/>
          </Col>
        </Div>
        <Div gap={8} wrap>
          {Object.entries(inf.followers).map(([p,n])=>(
            <div key={p} style={{background:T.bg3,borderRadius:T.r.md,padding:"7px 12px",textAlign:"center"}}>
              <Txt size="lg" w={800} style={{display:"block"}}>{fmtN(n)}</Txt>
              <Txt size="xs" c={T.text3} style={{display:"block"}}>{p}</Txt>
            </div>
          ))}
          <div style={{background:T.greenSoft,border:`1px solid rgba(16,185,129,0.2)`,borderRadius:T.r.md,padding:"7px 12px",textAlign:"center"}}>
            <Txt size="lg" w={800} c={T.green} style={{display:"block"}}>{fmtPct(inf.eng)}</Txt>
            <Txt size="xs" c={T.text3} style={{display:"block"}}>Engaj.</Txt>
          </div>
          <AQSBadge score={inf.aqScore}/>
        </Div>
      </div>
      {/* Tabs */}
      <Div style={{borderBottom:`1px solid ${T.border}`,padding:"0 14px",background:T.bg2,overflowX:"auto",flexShrink:0}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",borderBottom:tab===id?`2px solid ${T.accent}`:"2px solid transparent",padding:"11px 12px",color:tab===id?T.accent:T.text3,cursor:"pointer",fontWeight:600,fontSize:T.f.sm,transition:"all .15s",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            {label}
          </button>
        ))}
      </Div>
      <Col gap={0} style={{flex:1,padding:20,overflowY:"auto"}}>
        {tab==="perfil"&&<Col gap={12}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["📍 Estado",inf.state],["🌐 Idioma",inf.language],["👥 Audiência",inf.gender],["🎂 Faixa etária",inf.audienceAge],["🎬 Conteúdo",inf.contentType],["📧 Email",inf.email],["📅 Último contato",inf.lastContact],["💰 Cachê estimado",fmtR(inf.cachê)]].map(([l,v])=>(
              <div key={l} style={{background:T.bg3,borderRadius:T.r.md,padding:"10px 12px"}}>
                <Txt size="xs" c={T.text3} w={500} style={{display:"block",marginBottom:3,textTransform:"uppercase",letterSpacing:".4px"}}>{l}</Txt>
                <Txt size="base" w={600}>{v||"—"}</Txt>
              </div>
            ))}
          </div>
          {inf.tags.length>0&&<div style={{background:T.bg3,borderRadius:T.r.md,padding:"10px 12px"}}>
            <Txt size="xs" c={T.text3} w={600} style={{display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:".4px"}}>Tags</Txt>
            <Div gap={5} wrap>{inf.tags.map(t=><Badge key={t} label={t} color={T.cyan} size="xs"/>)}</Div>
          </div>}
        </Col>}
        {tab==="metricas"&&<Col gap={12}>
          {[["📈 Taxa de Engajamento",fmtPct(inf.eng),inf.eng/0.12,T.green],["📊 Crescimento Mensal",`${(inf.growth*100).toFixed(1)}%`,Math.max(0,(inf.growth+0.06)/0.36),inf.growth>0?T.green:T.red],["👁️ Views Médias",fmtN(inf.avgViews),Math.min(1,inf.avgViews/600000),T.accent],["🎯 Alcance Estimado",fmtPct(inf.reachRate),inf.reachRate,T.purple],["💵 CPE Estimado","R$ "+inf.cpe,0.5,T.amber]].map(([l,v,p,c])=>(
            <div key={l} style={{background:T.bg3,borderRadius:T.r.md,padding:"12px 14px"}}>
              <Div justify="space-between" style={{marginBottom:8}}><Txt size="sm" c={T.text2} w={500}>{l}</Txt><Txt size="md" c={c} w={700}>{v}</Txt></Div>
              <div style={{background:T.bg5,borderRadius:T.r.full,height:4}}><div style={{background:c,borderRadius:T.r.full,height:"100%",width:`${Math.min(100,(p||0)*100)}%`,transition:"width .5s"}}/></div>
            </div>
          ))}
          <div style={{background:T.bg3,borderRadius:T.r.md,padding:"12px 14px"}}>
            <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:10}}>Seguidores por Plataforma</Txt>
            {Object.entries(inf.followers).map(([p,n])=>{const max=Math.max(...Object.values(inf.followers));return(
              <div key={p} style={{marginBottom:8}}>
                <Div justify="space-between" style={{marginBottom:4}}><Txt size="sm" c={T.text2}>{p}</Txt><Txt size="sm" w={600}>{fmtN(n)}</Txt></Div>
                <div style={{background:T.bg5,borderRadius:T.r.full,height:3}}><div style={{background:T.accent,borderRadius:T.r.full,height:"100%",width:`${(n/max)*100}%`}}/></div>
              </div>
            );})}
          </div>
        </Col>}
        {tab==="fraude"&&<FraudAnalysis inf={inf}/>}
        {tab==="afinity"&&<BrandAffinitySection inf={inf}/>}
        {tab==="crm"&&<Col gap={14}>
          <div>
            <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:8}}>Status do Pipeline</Txt>
            <Div gap={5} wrap>
              {STATUSES.map(s=>{const m=STATUS_META[s];return(
                <button key={s} onClick={()=>setStatus(s)} style={{padding:"6px 12px",borderRadius:T.r.md,border:`1px solid ${status===s?m.c+"66":T.border}`,background:status===s?m.bg:"transparent",color:status===s?m.c:T.text3,cursor:"pointer",fontWeight:600,fontSize:T.f.sm,fontFamily:"inherit",transition:"all .15s"}}>{s}</button>
              );})}
            </Div>
          </div>
          <div>
            <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:6}}>Notas Internas</Txt>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={5} style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:12,color:T.text1,fontSize:T.f.base,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          {lists.length>0&&<div>
            <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:6}}>Adicionar a Lista</Txt>
            <Div gap={6} wrap>{lists.map(l=><button key={l.id} style={{padding:"5px 11px",borderRadius:T.r.md,border:`1px solid ${l.color}33`,background:l.color+"11",color:l.color,cursor:"pointer",fontSize:T.f.sm,fontWeight:600,fontFamily:"inherit"}}>+ {l.name}</button>)}</Div>
          </div>}
          <Div gap={8}>
            <Btn variant="primary" onClick={save} icon="💾">Salvar</Btn>
            <Btn variant="secondary" onClick={()=>runAI("nextstep")} icon="✦">Próximos Passos IA</Btn>
          </Div>
        </Col>}
        {tab==="ia"&&<Col gap={12}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["📝 Resumo Estratégico","summary"],["💌 1º Contato","message"],["📋 Próximos Passos","nextstep"]].map(([l,k])=>(
              <button key={k} onClick={()=>runAI(k)} disabled={aLoad} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"14px 12px",cursor:aLoad?"not-allowed":"pointer",color:T.text2,fontSize:T.f.sm,fontWeight:600,fontFamily:"inherit",textAlign:"left",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <div style={{marginBottom:3}}>{l}</div>
                <div style={{fontSize:10,color:T.text3,fontWeight:400}}>Gerar com IA →</div>
              </button>
            ))}
          </div>
          {aLoad&&<Div align="center" gap={10} style={{padding:20,background:T.bg3,borderRadius:T.r.lg,justifyContent:"center"}}>
            <div style={{width:18,height:18,border:"2px solid rgba(79,110,247,0.3)",borderTopColor:T.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
            <Txt size="base" c={T.text2}>IA processando...</Txt>
          </Div>}
          {aio&&!aLoad&&<div style={{background:T.bg3,border:`1px solid rgba(79,110,247,0.15)`,borderRadius:T.r.lg,padding:16}}>
            <Txt size="xs" c={T.accent} w={600} style={{display:"block",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>✦ Resposta da IA</Txt>
            <Txt size="base" c={T.text1} style={{lineHeight:1.8,whiteSpace:"pre-wrap"}}>{aio}</Txt>
          </div>}
        </Col>}
      </Col>
    </Col>
  </div>;
}

// ─── AI SEARCH ────────────────────────────────────────────────────────────────
function AISearch({influencers,onResults,onBrandFit}){
  const [mode,setMode]=useState("natural");
  const [query,setQuery]=useState("");
  const [brand,setBrand]=useState("");
  const [load,setLoad]=useState(false);

  async function doNatural(){
    if(!query.trim())return;setLoad(true);
    const list=influencers.slice(0,80).map(i=>({id:i.id,name:i.name,handle:i.handle,niche:i.niche,platform:i.platform,eng:i.eng,state:i.state,tier:i.tier,aqScore:i.aqScore,fakeRate:i.fakeRate,followers:totF(i)}));
    try{const r=await ai(`Influenciadores: ${JSON.stringify(list)}\nBusca: "${query}"\nRetorne APENAS array JSON de IDs ordenados por relevância. Ex: [3,1,7]`,"Filtra influenciadores. Responda APENAS array JSON de IDs.");
      onResults(JSON.parse(r.replace(/```json|```/g,"").trim()));}catch{onResults([]);}
    setLoad(false);
  }
  async function doBrandFit(){
    if(!brand.trim())return;setLoad(true);
    const list=influencers.slice(0,60).map(i=>({id:i.id,name:i.name,niche:i.niche,platform:i.platform,eng:i.eng,tier:i.tier,followers:totF(i),state:i.state,aqScore:i.aqScore,brandAffinity:i.brandAffinity}));
    try{const r=await ai(`Influenciadores: ${JSON.stringify(list)}\nCampanha: "${brand}"\nArray JSON: [{id,score,justification}] ordenado desc.`,"Especialista brand fit. Apenas JSON.");
      onBrandFit(JSON.parse(r.replace(/```json|```/g,"").trim()));}catch{onBrandFit([]);}
    setLoad(false);
  }
  return(
    <div style={{background:`linear-gradient(135deg,rgba(79,110,247,0.05),rgba(139,92,246,0.03))`,border:`1px solid rgba(79,110,247,0.12)`,borderRadius:T.r["2xl"],padding:18,marginBottom:18}}>
      <Div gap={0} style={{marginBottom:14,background:T.bg3,borderRadius:T.r.lg,padding:3}}>
        {[["natural","🔮 Linguagem Natural"],["brandfit","🎯 Brand Fit Score"]].map(([m,l])=>(
          <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px 14px",borderRadius:T.r.md,border:"none",cursor:"pointer",fontWeight:700,fontSize:T.f.sm,background:mode===m?`linear-gradient(135deg,${T.accent},#7c3aed)`:"transparent",color:mode===m?"#fff":T.text3,fontFamily:"inherit",transition:"all .2s"}}>{l}</button>
        ))}
      </Div>
      {mode==="natural"?(
        <Div gap={10}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doNatural()} placeholder='Ex: "Micro influenciadora fitness feminina em SP com engajamento alto e baixo índice de falsos"' style={{flex:1,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"10px 14px",color:T.text1,fontSize:T.f.base,outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          <Btn variant="accent" onClick={doNatural} loading={load} icon={load?"":"✦"}>Buscar</Btn>
        </Div>
      ):(
        <Div gap={10}>
          <textarea value={brand} onChange={e=>setBrand(e.target.value)} rows={3} placeholder='Descreva campanha, marca e público. Ex: "Skincare vegano premium para mulheres 25-40 anos preocupadas com sustentabilidade"' style={{flex:1,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"10px 14px",color:T.text1,fontSize:T.f.base,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          <Btn onClick={doBrandFit} loading={load} size="md" style={{alignSelf:"stretch",background:`linear-gradient(135deg,${T.amber},${T.orange})`,border:"none",borderRadius:T.r.md,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:T.f.sm,fontFamily:"inherit"}}>🎯 Calcular</Btn>
        </Div>
      )}
    </div>
  );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────
function Filters({F,setF}){
  function tog(k,v){setF(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));}
  const secs=[
    {t:"Plataforma",k:"platforms",opts:PLATFORMS,c:T.cyan},
    {t:"Tier",k:"tiers",opts:Object.keys(TIER_META),c:T.accent,render:o=>TIER_META[o]?.label},
    {t:"Nicho",k:"niches",opts:NICHES.slice(0,12),c:T.purple},
    {t:"Status",k:"statuses",opts:STATUSES,c:T.green},
    {t:"Estado",k:"states",opts:STATES,c:T.amber},
  ];
  return <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:16,marginBottom:14,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:16}}>
    {secs.map(s=><Col key={s.k} gap={6}>
      <Txt size="xs" c={T.text3} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>{s.t}</Txt>
      <Col gap={3} style={{maxHeight:130,overflowY:"auto"}}>
        {s.opts.map(o=>{const active=F[s.k]?.includes(o);return(
          <label key={o} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"2px 0"}}>
            <input type="checkbox" checked={!!active} onChange={()=>tog(s.k,o)} style={{accentColor:s.c,width:12,height:12}}/>
            <Txt size="xs" c={active?s.c:T.text2} w={active?600:400}>{s.render?s.render(o):o}</Txt>
          </label>
        );})}
      </Col>
    </Col>)}
    <Col gap={8}>
      <Txt size="xs" c={T.text3} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>Engajamento %</Txt>
      <Div gap={6}>
        <input type="number" placeholder="Min" value={F.minEng} onChange={e=>setF(f=>({...f,minEng:e.target.value}))} style={{width:"50%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"7px 8px",color:T.text1,fontSize:T.f.sm,outline:"none",fontFamily:"inherit"}}/>
        <input type="number" placeholder="Max" value={F.maxEng} onChange={e=>setF(f=>({...f,maxEng:e.target.value}))} style={{width:"50%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"7px 8px",color:T.text1,fontSize:T.f.sm,outline:"none",fontFamily:"inherit"}}/>
      </Div>
      <Txt size="xs" c={T.text3} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>Score mínimo</Txt>
      <input type="range" min={0} max={100} value={F.minScore||0} onChange={e=>setF(f=>({...f,minScore:+e.target.value}))} style={{width:"100%",accentColor:T.accent}}/>
      <Div justify="space-between"><Txt size="xs" c={T.text3}>0</Txt><Txt size="xs" c={T.accent} w={700}>≥ {F.minScore||0}</Txt></Div>
      <Txt size="xs" c={T.text3} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>AQS mínimo</Txt>
      <input type="range" min={0} max={100} value={F.minAQS||0} onChange={e=>setF(f=>({...f,minAQS:+e.target.value}))} style={{width:"100%",accentColor:T.teal}}/>
      <Txt size="xs" c={T.teal} w={700} style={{textAlign:"right"}}>≥ {F.minAQS||0}</Txt>
      <Txt size="xs" c={T.text3} w={600} style={{textTransform:"uppercase",letterSpacing:".5px"}}>Falsos máx. %</Txt>
      <input type="range" min={0} max={40} value={F.maxFake||40} onChange={e=>setF(f=>({...f,maxFake:+e.target.value}))} style={{width:"100%",accentColor:T.green}}/>
      <Txt size="xs" c={T.green} w={700} style={{textAlign:"right"}}>≤ {F.maxFake||40}%</Txt>
      <Btn variant="ghost" size="sm" onClick={()=>setF({platforms:[],tiers:[],niches:[],statuses:[],states:[],minEng:"",maxEng:"",minScore:0,minAQS:0,maxFake:40})}>✕ Limpar tudo</Btn>
    </Col>
  </div>;
}

// ─── PAGES ────────────────────────────────────────────────────────────────────
function Dashboard({influencers,setPage}){
  const total=influencers.length;
  const avgEng=(influencers.reduce((a,i)=>a+i.eng,0)/total*100).toFixed(2);
  const avgAQS=(influencers.reduce((a,i)=>a+i.aqScore,0)/total).toFixed(0);
  const avgFake=(influencers.reduce((a,i)=>a+i.fakeRate,0)/total).toFixed(1);
  const active=influencers.filter(i=>["Negociando","Proposta","1º Contato"].includes(i.status)).length;
  const highRisk=influencers.filter(i=>i.fakeRate>20).length;
  const topNiches=Object.entries(influencers.flatMap(i=>i.niche).reduce((a,n)=>({...a,[n]:(a[n]||0)+1}),{})).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const recent=[...influencers].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  return <Col gap={20}>
    <div style={{background:`linear-gradient(135deg,rgba(79,110,247,0.07),rgba(139,92,246,0.04))`,border:`1px solid rgba(79,110,247,0.12)`,borderRadius:T.r["2xl"],padding:"22px 26px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",right:-30,top:-30,fontSize:150,opacity:.03,userSelect:"none"}}>✦</div>
      <Txt size="xs" c={T.accent} w={600} style={{display:"block",textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Bem-vindo de volta</Txt>
      <Txt size="3xl" w={800} style={{display:"block",letterSpacing:"-1px",marginBottom:6,lineHeight:1}}>Incast Creator CRM</Txt>
      <Txt size="base" c={T.text3} style={{display:"block",marginBottom:16}}>Você tem <strong style={{color:T.amber}}>{active} leads ativos</strong> no pipeline • <strong style={{color:T.red}}>{highRisk} perfis de alto risco</strong> detectados</Txt>
      <Div gap={8}>
        <Btn variant="accent" onClick={()=>setPage("discovery")} icon="◎">Discovery</Btn>
        <Btn variant="secondary" onClick={()=>setPage("kanban")} icon="⊞">Pipeline CRM</Btn>
      </Div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[[total.toLocaleString(),"Creators","👥",T.accent,"na base"],[avgEng+"%","Eng. Médio","📈",T.green,"de engajamento"],[avgAQS+"/100","AQS Médio","🛡️",T.teal,"qualidade audiência"],[avgFake+"%","Falsos Médio","⚠️",T.amber,"da base"]].map(([v,l,ic,c,sub])=>(
        <div key={l} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:"16px 18px",transition:"all .15s",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=c+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <Txt size="xl" style={{display:"block",marginBottom:8}}>{ic}</Txt>
          <Txt size="3xl" c={c} w={800} style={{display:"block",letterSpacing:"-1px",lineHeight:1}}>{v}</Txt>
          <Txt size="sm" c={T.text3} style={{display:"block",marginTop:4}}>{l}</Txt>
          <Txt size="xs" c={T.text4} style={{display:"block",marginTop:2}}>{sub}</Txt>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>⊞ Pipeline</Txt>
        {STATUSES.map(s=>{const sm=STATUS_META[s],cnt=influencers.filter(i=>i.status===s).length;return(
          <Div key={s} align="center" gap={8} style={{marginBottom:9}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:sm.c}}/>
            <Txt size="sm" c={T.text2} style={{flex:1}}>{s}</Txt>
            <div style={{background:T.bg4,borderRadius:T.r.full,height:3,width:60}}><div style={{background:sm.c,borderRadius:T.r.full,height:"100%",width:`${(cnt/total)*100}%`}}/></div>
            <Txt size="sm" c={sm.c} w={700} style={{minWidth:20,textAlign:"right"}}>{cnt}</Txt>
          </Div>
        );})}
      </div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>🏷️ Top Nichos</Txt>
        {topNiches.map(([n,c],i)=>(
          <Div key={n} align="center" gap={8} style={{marginBottom:9}}>
            <Txt size="xs" c={T.text4} style={{width:16,textAlign:"right"}}>#{i+1}</Txt>
            <Txt size="sm" c={T.text1} style={{flex:1}}>{n}</Txt>
            <div style={{background:T.bg4,borderRadius:T.r.full,height:3,width:60}}><div style={{background:T.purple,borderRadius:T.r.full,height:"100%",width:`${(c/topNiches[0][1])*100}%`}}/></div>
            <Txt size="sm" c={T.purple} w={700} style={{minWidth:20,textAlign:"right"}}>{c}</Txt>
          </Div>
        ))}
      </div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>⏱ Recentes</Txt>
        {recent.map(i=>(
          <Div key={i.id} align="center" gap={8} style={{marginBottom:10}}>
            <Avatar name={i.name} size={30} url={`https://i.pravatar.cc/60?img=${i.id}`} verified={i.verified}/>
            <Col gap={1} style={{flex:1,minWidth:0}}>
              <Txt size="sm" w={600} style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{i.name}</Txt>
              <Txt size="xs" c={T.text3}>{i.niche[0]} • {fmtN(totF(i))}</Txt>
            </Col>
            <AQSBadge score={i.aqScore}/>
          </Div>
        ))}
      </div>
    </div>
  </Col>;
}

function Discovery({influencers,setInfluencers,lists,setToast,onOpen,setComparatorOpen}){
  const [search,setSearch]=useState("");
  const [view,setView]=useState("grid");
  const [showF,setShowF]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [F,setF]=useState({platforms:[],tiers:[],niches:[],statuses:[],states:[],minEng:"",maxEng:"",minScore:0,minAQS:0,maxFake:40});
  const [aiRes,setAiRes]=useState(null);
  const [bf,setBF]=useState(null);
  const [sort,setSort]=useState("score");
  const [page,setPage]=useState(1);
  const [compareMode,setCompareMode]=useState(false);
  const [compareList,setCompareList]=useState([]);
  const PER=view==="grid"?24:30;

  const filtered=useMemo(()=>{
    let r=[...influencers];
    if(search){const q=search.toLowerCase();r=r.filter(i=>i.name.toLowerCase().includes(q)||i.handle.toLowerCase().includes(q)||i.niche.some(n=>n.toLowerCase().includes(q))||i.state.toLowerCase().includes(q));}
    if(F.platforms.length)r=r.filter(i=>F.platforms.some(p=>i.platform.includes(p)));
    if(F.tiers.length)r=r.filter(i=>F.tiers.includes(i.tier));
    if(F.niches.length)r=r.filter(i=>F.niches.some(n=>i.niche.includes(n)));
    if(F.statuses.length)r=r.filter(i=>F.statuses.includes(i.status));
    if(F.states.length)r=r.filter(i=>F.states.includes(i.state));
    if(F.minEng)r=r.filter(i=>i.eng>=parseFloat(F.minEng)/100);
    if(F.maxEng)r=r.filter(i=>i.eng<=parseFloat(F.maxEng)/100);
    if(F.minScore)r=r.filter(i=>i.score>=F.minScore);
    if(F.minAQS)r=r.filter(i=>i.aqScore>=F.minAQS);
    if(F.maxFake<40)r=r.filter(i=>i.fakeRate<=F.maxFake);
    return r;
  },[influencers,search,F]);

  const displayed=useMemo(()=>{
    let r=aiRes?aiRes.map(id=>influencers.find(i=>i.id===id)).filter(Boolean):filtered;
    if(bf){const m=Object.fromEntries(bf.map(b=>[b.id,b]));r=r.map(i=>({...i,_bf:m[i.id]})).sort((a,b)=>(b._bf?.score||0)-(a._bf?.score||0));}
    else r=[...r].sort((a,b)=>sort==="score"?b.score-a.score:sort==="followers"?totF(b)-totF(a):sort==="eng"?b.eng-a.eng:sort==="aqs"?b.aqScore-a.aqScore:sort==="fake"?a.fakeRate-b.fakeRate:new Date(b.createdAt)-new Date(a.createdAt));
    return r;
  },[filtered,aiRes,bf,sort,influencers]);

  const paged=displayed.slice(0,page*PER);
  const activeFC=[...F.platforms,...F.tiers,...F.niches,...F.statuses,...F.states].length+(F.minEng||F.maxEng?1:0)+(F.minScore?1:0)+(F.minAQS?1:0)+(F.maxFake<40?1:0);

  return <Col gap={0}>
    <Div align="center" justify="space-between" style={{marginBottom:18}}>
      <Col gap={2}><Txt size="xl" w={800}>◎ Discovery</Txt><Txt size="base" c={T.text3}>{influencers.length.toLocaleString()} creators • {displayed.length} resultados</Txt></Col>
      <Div gap={8}>
        {compareMode&&compareList.length>=2&&<Btn variant="success" onClick={()=>{setComparatorOpen(compareList);setCompareMode(false);setCompareList([]);}} icon="⚖️">Comparar ({compareList.length})</Btn>}
        <Btn variant={compareMode?"primary":"secondary"} onClick={()=>{setCompareMode(c=>!c);setCompareList([]);}} icon="⚖️">{compareMode?"Cancelar":"Comparar"}</Btn>
        <Btn variant="accent" onClick={()=>setShowAdd(true)} icon="+">Novo Creator</Btn>
      </Div>
    </Div>
    <AISearch influencers={influencers} onResults={ids=>{setAiRes(ids);setBF(null);setPage(1);}} onBrandFit={s=>{setBF(s);setAiRes(null);setPage(1);}}/>
    <Div gap={8} style={{marginBottom:12,flexWrap:"wrap"}} align="center">
      <div style={{flex:1,minWidth:220,position:"relative"}}>
        <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:T.text3,pointerEvents:"none"}}>🔍</span>
        <input value={search} onChange={e=>{setSearch(e.target.value);setAiRes(null);setBF(null);setPage(1);}} placeholder="Buscar nome, @handle, nicho, estado, marca..." style={{width:"100%",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"10px 12px 10px 34px",color:T.text1,fontSize:T.f.base,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color .15s"}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>
      <Btn variant={showF?"primary":"secondary"} onClick={()=>setShowF(f=>!f)} icon="⚡">Filtros{activeFC>0?` (${activeFC})`:""}</Btn>
      {(aiRes||bf)&&<Btn variant="ghost" onClick={()=>{setAiRes(null);setBF(null);}}>✕ Limpar IA</Btn>}
      <Div gap={0} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.md,overflow:"hidden"}}>
        {[["grid","⊞"],["list","☰"]].map(([v,ic])=>(
          <button key={v} onClick={()=>{setView(v);setPage(1);}} style={{padding:"8px 12px",border:"none",background:view===v?T.accentSoft:"transparent",color:view===v?T.accent:T.text3,cursor:"pointer",fontSize:14,transition:"all .15s"}}>{ic}</button>
        ))}
      </Div>
      <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"8px 26px 8px 10px",color:T.text2,fontSize:T.f.sm,outline:"none",cursor:"pointer",fontFamily:"inherit",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23525d7a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"}}>
        <option value="score">Score ↓</option>
        <option value="followers">Seguidores ↓</option>
        <option value="eng">Engajamento ↓</option>
        <option value="aqs">AQS ↓</option>
        <option value="fake">Menos Falsos ↑</option>
        <option value="recent">Mais Recentes</option>
      </select>
    </Div>
    {showF&&<Filters F={F} setF={setF}/>}
    {compareMode&&<div style={{background:"rgba(79,110,247,0.06)",border:`1px solid rgba(79,110,247,0.15)`,borderRadius:T.r.lg,padding:"10px 16px",marginBottom:12}}>
      <Txt size="sm" c={T.accent}>⚖️ Modo comparação ativo — clique em até 3 creators para comparar • <strong>{compareList.length}/3</strong> selecionados</Txt>
    </div>}
    {displayed.length===0?<EmptyState icon="🔍" title="Nenhum resultado" desc="Ajuste os filtros ou termos de busca."/>:
    <>
      <div style={view==="grid"?{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:10}:{display:"flex",flexDirection:"column",gap:5}}>
        {paged.map(inf=>{
          const inCmp=compareList.includes(inf.id);
          return <div key={inf.id} style={{position:"relative"}}>
            {compareMode&&<div onClick={e=>{e.stopPropagation();if(inCmp)setCompareList(l=>l.filter(x=>x!==inf.id));else if(compareList.length<3)setCompareList(l=>[...l,inf.id]);}} style={{position:"absolute",top:8,left:8,zIndex:5,width:22,height:22,borderRadius:"50%",background:inCmp?T.accent:T.bg4,border:`2px solid ${inCmp?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:"#fff",fontWeight:700}}>{inCmp?"✓":""}</div>}
            <ICard inf={inf} onClick={compareMode?()=>{}:onOpen} view={view} bfscore={bf?.find(b=>b.id===inf.id)} onFav={id=>setInfluencers(p=>p.map(i=>i.id===id?{...i,favorited:!i.favorited}:i))}/>
          </div>;
        })}
      </div>
      {paged.length<displayed.length&&<Div justify="center" style={{marginTop:16}}>
        <Btn variant="secondary" size="lg" onClick={()=>setPage(p=>p+1)}>Carregar mais ({displayed.length-paged.length} restantes)</Btn>
      </Div>}
      <Txt size="sm" c={T.text4} style={{textAlign:"center",display:"block",marginTop:10}}>{paged.length} de {displayed.length} exibidos</Txt>
    </>}
    {showAdd&&<AddModal onClose={()=>setShowAdd(false)} onAdd={inf=>{setInfluencers(p=>[inf,...p]);setToast({message:`${inf.name} adicionado!`,type:"success"});}}/>}
  </Col>;
}

function AddModal({onClose,onAdd}){
  const [s,setS]=useState(1);
  const [f,setF]=useState({name:"",handle:"",niche:[],platform:[],instagram:"",tiktok:"",youtube:"",twitter:"",eng:"",state:"SP",email:"",language:"Português",gender:"Feminino",audienceAge:"25-34",contentType:"Fotos",brandSafety:"Brand Safe",notes:""});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const tog=(k,v)=>setF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  function submit(){
    const fol={};if(f.instagram)fol.Instagram=+f.instagram;if(f.tiktok)fol.TikTok=+f.tiktok;if(f.youtube)fol.YouTube=+f.youtube;if(f.twitter)fol["Twitter/X"]=+f.twitter;
    const tot=Object.values(fol).reduce((a,b)=>a+b,0)||0;
    const tier=tot>=1000000?"Mega":tot>=500000?"Macro":tot>=100000?"Mid":tot>=10000?"Micro":"Nano";
    const eng=parseFloat(f.eng)||0;
    const score=Math.min(100,Math.round(eng*750+(Math.log10(Math.max(tot,1))*8)));
    const aqScore=Math.max(40,95-rnd(0,20));
    const fakeRate=rnd(2,15);
    onAdd({id:Date.now(),name:f.name,handle:f.handle||"@"+f.name.toLowerCase().replace(/\s/g,""),niche:f.niche,platform:f.platform,followers:fol,eng,state:f.state,email:f.email,language:f.language,gender:f.gender,audienceAge:f.audienceAge,contentType:f.contentType,brandSafety:f.brandSafety,notes:f.notes,status:"Novo",score,tier,aqScore,fakeRate,cachê:Math.round(tot/1000)*6,campaigns:0,favorited:false,tags:[],growth:0,avgViews:Math.round(tot*eng),lastContact:new Date().toISOString().slice(0,10),createdAt:new Date().toISOString().slice(0,10),mainFollowers:tot,verified:false,brandAffinity:[],competitorMentions:[],reachRate:.15,cpe:.05});
    onClose();
  }
  return <Modal title={`➕ Novo Creator — Passo ${s}/3`} onClose={onClose} width={520}>
    <Col gap={0} style={{marginBottom:18}}>
      <Div gap={4}>{[1,2,3].map(n=><div key={n} style={{flex:1,height:3,borderRadius:T.r.full,background:s>=n?T.accent:T.bg4,transition:"background .3s"}}/>)}</Div>
    </Col>
    {s===1&&<Col gap={12}>
      <Input label="Nome completo *" value={f.name} onChange={v=>upd("name",v)} placeholder="Ana Beatriz Costa"/>
      <Input label="@Handle" value={f.handle} onChange={v=>upd("handle",v)} placeholder="@anabeatriz"/>
      <Input label="Email" value={f.email} onChange={v=>upd("email",v)} placeholder="ana@email.com" type="email"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Select2 label="Estado" value={f.state} onChange={v=>upd("state",v)} options={STATES}/>
        <Select2 label="Idioma" value={f.language} onChange={v=>upd("language",v)} options={["Português","Inglês","Espanhol","Bilíngue"]}/>
      </div>
      <div>
        <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:8}}>Nichos *</Txt>
        <Div gap={5} wrap>{NICHES.map(n=><button key={n} onClick={()=>tog("niche",n)} style={{padding:"4px 10px",borderRadius:T.r.full,border:`1px solid ${f.niche.includes(n)?T.purple:T.border}`,background:f.niche.includes(n)?T.purpleSoft:"transparent",color:f.niche.includes(n)?T.purple:T.text3,cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"inherit"}}>{n}</button>)}</Div>
      </div>
    </Col>}
    {s===2&&<Col gap={12}>
      <div>
        <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:8}}>Plataformas</Txt>
        <Div gap={5} wrap>{PLATFORMS.map(p=><button key={p} onClick={()=>tog("platform",p)} style={{padding:"5px 11px",borderRadius:T.r.md,border:`1px solid ${f.platform.includes(p)?T.accent:T.border}`,background:f.platform.includes(p)?T.accentSoft:"transparent",color:f.platform.includes(p)?T.accent:T.text3,cursor:"pointer",fontSize:T.f.sm,fontWeight:600,fontFamily:"inherit"}}>{p}</button>)}</Div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["Instagram","instagram"],["TikTok","tiktok"],["YouTube","youtube"],["Twitter/X","twitter"]].map(([p,k])=>(
          <Input key={k} label={p} value={f[k]} onChange={v=>upd(k,v)} placeholder="0" type="number"/>
        ))}
      </div>
      <Input label="Taxa de Engajamento (ex: 0.048 = 4.8%)" value={f.eng} onChange={v=>upd("eng",v)} placeholder="0.048" type="number"/>
    </Col>}
    {s===3&&<Col gap={12}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Select2 label="Gênero audiência" value={f.gender} onChange={v=>upd("gender",v)} options={["Feminino","Masculino","Não-binário"]}/>
        <Select2 label="Faixa etária" value={f.audienceAge} onChange={v=>upd("audienceAge",v)} options={["13-17","18-24","25-34","35-44","45+"]}/>
        <Select2 label="Tipo de conteúdo" value={f.contentType} onChange={v=>upd("contentType",v)} options={CONTENT_TYPES}/>
        <Select2 label="Brand Safety" value={f.brandSafety} onChange={v=>upd("brandSafety",v)} options={BRAND_SAFETY}/>
      </div>
      <div>
        <Txt size="sm" c={T.text2} w={500} style={{display:"block",marginBottom:6}}>Notas iniciais</Txt>
        <textarea value={f.notes} onChange={e=>upd("notes",e.target.value)} rows={4} style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.md,padding:"10px 12px",color:T.text1,fontSize:T.f.base,resize:"none",outline:"none",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}}/>
      </div>
    </Col>}
    <Div justify="space-between" style={{marginTop:18}} gap={8}>
      <Btn variant="secondary" onClick={()=>s>1?setS(n=>n-1):onClose()}>{s>1?"← Voltar":"Cancelar"}</Btn>
      <Btn variant="primary" onClick={()=>s<3?setS(n=>n+1):submit()}>{s<3?"Continuar →":"✓ Cadastrar"}</Btn>
    </Div>
  </Modal>;
}

function Kanban({influencers,onUpdate,setToast,onCardClick}){
  const [dragging,setDragging]=useState(null);
  const [over,setOver]=useState(null);
  const grouped=useMemo(()=>{const g={};STATUSES.forEach(s=>{g[s]=influencers.filter(i=>i.status===s);});return g;},[influencers]);
  return <Col gap={0}>
    <Col gap={2} style={{marginBottom:18}}><Txt size="xl" w={800}>⊞ Pipeline CRM</Txt><Txt size="base" c={T.text3}>Arraste os cards para atualizar status</Txt></Col>
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:12}}>
      {STATUSES.map(status=>{
        const sm=STATUS_META[status],cards=grouped[status]||[];
        const totalC=cards.reduce((a,i)=>a+i.cachê,0);
        return <div key={status} onDragOver={e=>{e.preventDefault();setOver(status);}} onDrop={()=>{if(dragging&&dragging.status!==status){onUpdate({...dragging,status});setToast({message:`Movido para ${status}`,type:"info"});}setDragging(null);setOver(null);}} onDragLeave={()=>setOver(null)}
          style={{minWidth:210,flex:"0 0 210px",background:over===status?sm.c+"0d":T.bg2,border:`1px solid ${over===status?sm.c+"55":T.border}`,borderRadius:T.r.xl,overflow:"hidden",transition:"all .15s"}}>
          <div style={{padding:"11px 13px",borderBottom:`1px solid ${T.border}`,background:sm.c+"0a"}}>
            <Div align="center" justify="space-between">
              <Div align="center" gap={6}><div style={{width:7,height:7,borderRadius:"50%",background:sm.c}}/><Txt size="sm" w={700}>{status}</Txt></Div>
              <Badge label={cards.length} color={sm.c} size="xs"/>
            </Div>
            {totalC>0&&<Txt size="xs" c={T.text3} style={{display:"block",marginTop:3}}>💰 {fmtR(totalC)}</Txt>}
          </div>
          <Col style={{padding:"8px 6px",maxHeight:520,overflowY:"auto"}} gap={5}>
            {cards.map(inf=>(
              <div key={inf.id} draggable onDragStart={()=>setDragging(inf)} onClick={()=>onCardClick(inf)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"10px 11px",cursor:"grab",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;e.currentTarget.style.background=T.bg4;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bg3;}}>
                <Div align="center" gap={7} style={{marginBottom:6}}>
                  <Avatar name={inf.name} size={26} url={`https://i.pravatar.cc/52?img=${inf.id}`} verified={inf.verified}/>
                  <Col gap={0} style={{flex:1,minWidth:0}}>
                    <Txt size="xs" w={700} style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{inf.name}</Txt>
                    <Txt size="xs" c={T.text3}>{inf.handle}</Txt>
                  </Col>
                </Div>
                <Div gap={4} wrap style={{marginBottom:5}}>{inf.niche.slice(0,2).map(n=><Badge key={n} label={n} color={T.purple} size="xs"/>)}</Div>
                <Div justify="space-between">
                  <Txt size="xs" c={T.text3}>{fmtN(totF(inf))}</Txt>
                  <Txt size="xs" c={T.green} w={600}>{fmtPct(inf.eng)}</Txt>
                  <AQSBadge score={inf.aqScore}/>
                </Div>
                {inf.cachê>0&&<Txt size="xs" c={T.amber} style={{display:"block",marginTop:3}}>💰 {fmtR(inf.cachê)}</Txt>}
              </div>
            ))}
            {cards.length===0&&<Txt size="xs" c={T.text4} style={{textAlign:"center",padding:"16px 8px",display:"block"}}>Vazio</Txt>}
          </Col>
        </div>;
      })}
    </div>
  </Col>;
}

function Analytics({influencers}){
  const total=influencers.length;
  const avgAQS=(influencers.reduce((a,i)=>a+i.aqScore,0)/total).toFixed(0);
  const highFake=influencers.filter(i=>i.fakeRate>20).length;
  const verified=influencers.filter(i=>i.verified).length;
  const byTier=Object.entries(TIER_META).map(([t,m])=>({t,m,n:influencers.filter(i=>i.tier===t).length}));
  const byState=Object.entries(influencers.reduce((a,i)=>({...a,[i.state]:(a[i.state]||0)+1}),{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const byNiche=Object.entries(influencers.flatMap(i=>i.niche).reduce((a,n)=>({...a,[n]:(a[n]||0)+1}),{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const aqsDist=[["Alta (80-100)",influencers.filter(i=>i.aqScore>=80).length,T.green],["Média (60-79)",influencers.filter(i=>i.aqScore>=60&&i.aqScore<80).length,T.amber],["Baixa (<60)",influencers.filter(i=>i.aqScore<60).length,T.red]];
  return <Col gap={20}>
    <Col gap={2}><Txt size="xl" w={800}>◈ Analytics</Txt><Txt size="base" c={T.text3}>Visão completa da base</Txt></Col>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[[total.toLocaleString(),"Total Creators","👥",T.accent],[avgAQS+"/100","AQS Médio","🛡️",T.teal],[highFake,"Alto Risco","⚠️",T.red],[verified,"Verificados","✓",T.accent]].map(([v,l,ic,c])=>(
        <div key={l} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:"16px 18px"}}>
          <Txt size="xl" style={{display:"block",marginBottom:8}}>{ic}</Txt>
          <Txt size="3xl" c={c} w={800} style={{display:"block",letterSpacing:"-1px",lineHeight:1}}>{v}</Txt>
          <Txt size="sm" c={T.text3} style={{display:"block",marginTop:4}}>{l}</Txt>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>📊 Distribuição por Tier</Txt>
        {byTier.map(({t,m,n})=><div key={t} style={{marginBottom:10}}>
          <Div justify="space-between" style={{marginBottom:4}}><Txt size="sm" c={m.c} w={600}>{m.label}</Txt><Txt size="sm" c={T.text2} w={600}>{n} <span style={{color:T.text4,fontWeight:400}}>({(n/total*100).toFixed(0)}%)</span></Txt></Div>
          <div style={{background:T.bg4,borderRadius:T.r.full,height:5}}><div style={{background:m.c,borderRadius:T.r.full,height:"100%",width:`${(n/total)*100}%`,transition:"width .8s",boxShadow:`0 0 6px ${m.c}44`}}/></div>
        </div>)}
      </div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>🛡️ Qualidade de Audiência (AQS)</Txt>
        {aqsDist.map(([l,n,c])=><div key={l} style={{marginBottom:10}}>
          <Div justify="space-between" style={{marginBottom:4}}><Txt size="sm" c={c} w={600}>{l}</Txt><Txt size="sm" c={T.text2} w={600}>{n} ({(n/total*100).toFixed(0)}%)</Txt></Div>
          <div style={{background:T.bg4,borderRadius:T.r.full,height:5}}><div style={{background:c,borderRadius:T.r.full,height:"100%",width:`${(n/total)*100}%`}}/></div>
        </div>)}
        <div style={{marginTop:14,padding:"10px 12px",background:T.bg3,borderRadius:T.r.md}}>
          <Div justify="space-between"><Txt size="sm" c={T.text2}>⚠️ Alto risco fraude (&gt;20% falsos)</Txt><Badge label={highFake} color={T.red} size="xs"/></Div>
        </div>
      </div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>🏷️ Top Nichos</Txt>
        {byNiche.map(([n,c],i)=><Div key={n} align="center" gap={8} style={{marginBottom:8}}>
          <Txt size="xs" c={T.text4} style={{width:16,textAlign:"right"}}>#{i+1}</Txt>
          <Txt size="sm" c={T.text1} style={{flex:1}}>{n}</Txt>
          <div style={{background:T.bg4,borderRadius:T.r.full,height:3,width:70}}><div style={{background:T.purple,borderRadius:T.r.full,height:"100%",width:`${(c/byNiche[0][1])*100}%`}}/></div>
          <Txt size="sm" c={T.purple} w={700} style={{minWidth:20,textAlign:"right"}}>{c}</Txt>
        </Div>)}
      </div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.xl,padding:18}}>
        <Txt size="md" w={700} style={{display:"block",marginBottom:14}}>📍 Top Estados</Txt>
        {byState.map(([state,c])=><Div key={state} align="center" gap={8} style={{marginBottom:8}}>
          <Badge label={state} color={T.cyan} size="xs"/>
          <div style={{background:T.bg4,borderRadius:T.r.full,height:3,flex:1}}><div style={{background:T.cyan,borderRadius:T.r.full,height:"100%",width:`${(c/total)*100}%`}}/></div>
          <Txt size="sm" c={T.cyan} w={700} style={{minWidth:20,textAlign:"right"}}>{c}</Txt>
        </Div>)}
      </div>
    </div>
  </Col>;
}

function AIStudio({influencers}){
  const [mode,setMode]=useState("discover");
  const [input,setInput]=useState("");
  const [output,setOutput]=useState("");
  const [load,setLoad]=useState(false);
  const MODES=[
    {id:"discover",icon:"🔮",label:"Descoberta",desc:"Perfil ideal de influenciador"},
    {id:"score",icon:"🎯",label:"Brand Fit",desc:"Framework de pontuação"},
    {id:"message",icon:"💌",label:"Outreach",desc:"Mensagens personalizadas"},
    {id:"strategy",icon:"🗺️",label:"Estratégia",desc:"Plano completo de campanha"},
    {id:"brief",icon:"📋",label:"Brief",desc:"Briefing profissional"},
    {id:"audit",icon:"🛡️",label:"Auditoria",desc:"Análise de risco de fraude"},
  ];
  const PROMPTS={
    discover:v=>`Agência de influencer marketing. Preciso encontrar influenciadores para: "${v}". Defina: tier ideal, nicho, plataformas, faixa de engajamento, AQS mínimo recomendado, red flags a evitar.`,
    score:v=>`Framework de Brand Fit Score (0-100) para campanha: "${v}". Liste 5 critérios com peso, exemplos de score alto vs baixo, e pontuação mínima recomendada para aprovação.`,
    message:v=>`3 variações de outreach para influenciadores de ${v}: formal (email), descontraída (DM) e curta (WhatsApp). Inclua assunto para email.`,
    strategy:v=>`Estratégia completa de influencer marketing para: "${v}". Inclua: mix de tiers, cronograma 8 semanas, KPIs, orçamento por tier, formatos ideais, como medir ROI, critérios de seleção.`,
    brief:v=>`Briefing profissional para influenciadores sobre: "${v}". Inclua: contexto, objetivos, público, diretrizes de conteúdo, proibições, entregáveis, timeline, hashtags, menções obrigatórias.`,
    audit:v=>`Guia de auditoria de qualidade de influenciadores para a marca: "${v}". Red flags a identificar, métricas de autenticidade, como detectar compra de seguidores, checklist de validação antes de fechar contrato.`,
  };
  async function run(){
    if(!input.trim())return;setLoad(true);setOutput("");
    try{const r=await ai(PROMPTS[mode](input));setOutput(r);}catch{setOutput("Erro ao conectar.");}
    setLoad(false);
  }
  return <Col gap={18}>
    <Col gap={2}><Txt size="xl" w={800}>✦ IA Studio</Txt><Txt size="base" c={T.text3}>Inteligência artificial para curadoria e estratégia</Txt></Col>
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
      {MODES.map(m=>(
        <button key={m.id} onClick={()=>setMode(m.id)} style={{background:mode===m.id?T.accentSoft:T.bg2,border:`1px solid ${mode===m.id?T.accent+"44":T.border}`,borderRadius:T.r.lg,padding:"12px 10px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}>
          <div style={{fontSize:20,marginBottom:5}}>{m.icon}</div>
          <Txt size="sm" w={700} c={mode===m.id?T.accent:T.text1} style={{display:"block",marginBottom:2}}>{m.label}</Txt>
          <Txt size="xs" c={T.text3} style={{lineHeight:1.3}}>{m.desc}</Txt>
        </button>
      ))}
    </div>
    <div style={{background:T.bg2,border:`1px solid rgba(79,110,247,0.15)`,borderRadius:T.r.xl,padding:18}}>
      <Txt size="sm" c={T.text2} w={600} style={{display:"block",marginBottom:10}}>{MODES.find(m=>m.id===mode)?.icon} {MODES.find(m=>m.id===mode)?.label}</Txt>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4} placeholder="Descreva sua necessidade em detalhes..." style={{width:"100%",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"12px 14px",color:T.text1,fontSize:T.f.base,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box",minHeight:90}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
      <Div justify="flex-end" style={{marginTop:10}}><Btn variant="accent" onClick={run} loading={load} icon={load?"":"✦"} size="lg">Gerar com IA</Btn></Div>
    </div>
    {(load||output)&&<div style={{background:T.bg2,border:`1px solid rgba(79,110,247,0.12)`,borderRadius:T.r.xl,padding:18}}>
      <Div align="center" gap={8} style={{marginBottom:12}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:load?"pulse 1s infinite":"none"}}/>
        <Txt size="xs" c={T.accent} w={600} style={{textTransform:"uppercase",letterSpacing:"1px"}}>Resposta da IA</Txt>
      </Div>
      {load?<Div align="center" gap={10} style={{padding:"20px 0"}}><div style={{width:18,height:18,border:`2px solid ${T.accentSoft}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/><Txt size="base" c={T.text2}>Processando...</Txt></Div>
      :<Txt size="base" c={T.text1} style={{lineHeight:1.8,whiteSpace:"pre-wrap"}}>{output}</Txt>}
    </div>}
  </Col>;
}

function Lists({lists,setLists,influencers,onOpen,setToast}){
  const [showAdd,setShowAdd]=useState(false);
  const [name,setName]=useState("");
  const LCOLORS=[T.accent,T.purple,T.green,T.amber,T.pink,T.cyan,T.orange,T.teal];
  function addList(){if(!name.trim())return;setLists(l=>[...l,{id:Date.now(),name,color:LCOLORS[l.length%LCOLORS.length],influencers:[]}]);setName("");setShowAdd(false);setToast({message:"Lista criada!",type:"success"});}
  return <Col gap={18}>
    <Div align="center" justify="space-between">
      <Col gap={2}><Txt size="xl" w={800}>☰ Listas de Curadoria</Txt><Txt size="base" c={T.text3}>{lists.length} listas ativas</Txt></Col>
      <Btn variant="accent" onClick={()=>setShowAdd(true)} icon="+">Nova Lista</Btn>
    </Div>
    {showAdd&&<Div gap={10} align="flex-end" style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:14}}>
      <div style={{flex:1}}><Input label="Nome da lista" value={name} onChange={setName} placeholder="Ex: Campanha Dia das Mães"/></div>
      <Btn variant="primary" onClick={addList}>Criar</Btn>
      <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancelar</Btn>
    </Div>}
    {lists.length===0?<EmptyState icon="📋" title="Sem listas" desc="Crie listas para organizar creators por campanha." action={<Btn variant="primary" onClick={()=>setShowAdd(true)}>Criar lista</Btn>}/>:
    <Col gap={14}>{lists.map(list=>{
      const members=influencers.filter(i=>list.influencers.includes(i.id));
      return <div key={list.id} style={{background:T.bg2,border:`1px solid ${list.color}1a`,borderRadius:T.r.xl,overflow:"hidden"}}>
        <Div align="center" gap={10} style={{padding:"12px 16px",borderBottom:`1px solid ${list.color}1a`,background:list.color+"0a"}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:list.color}}/>
          <Txt size="lg" w={700}>{list.name}</Txt>
          <Badge label={`${members.length} creators`} color={list.color} size="xs"/>
        </Div>
        <Div gap={8} style={{padding:12,flexWrap:"wrap"}}>
          {members.map(inf=>(
            <div key={inf.id} onClick={()=>onOpen(inf)} style={{display:"flex",alignItems:"center",gap:8,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:T.r.lg,padding:"7px 11px",cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=list.color} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <Avatar name={inf.name} size={26} url={`https://i.pravatar.cc/52?img=${inf.id}`} verified={inf.verified}/>
              <Col gap={0}><Txt size="sm" w={600}>{inf.name}</Txt><Txt size="xs" c={T.text3}>{fmtN(totF(inf))} • AQS {inf.aqScore}</Txt></Col>
            </div>
          ))}
          {members.length===0&&<Txt size="sm" c={T.text4}>Nenhum creator nesta lista.</Txt>}
        </Div>
      </div>;
    })}</Col>}
  </Col>;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,collapsed,setCollapsed}){
  const NAV=[["dashboard","⬡","Dashboard"],["discovery","◎","Discovery"],["kanban","⊞","Pipeline CRM"],["lists","☰","Listas"],["analytics","◈","Analytics"],["ai","✦","IA Studio"]];
  return <div style={{width:collapsed?60:215,minHeight:"100vh",background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width .2s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>
    <Div align="center" gap={9} style={{padding:"16px 14px",borderBottom:`1px solid ${T.border}`,minHeight:60}}>
      <div style={{width:30,height:30,borderRadius:T.r.md,background:`linear-gradient(135deg,${T.accent},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,boxShadow:`0 0 16px ${T.accentGlow}`}}>✦</div>
      {!collapsed&&<Col gap={0}><Txt size="md" w={800} style={{letterSpacing:"-.5px",whiteSpace:"nowrap"}}>Incast</Txt><Txt size="xs" c={T.text3} style={{textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap"}}>Creator CRM</Txt></Col>}
    </Div>
    <nav style={{flex:1,padding:"10px 7px",display:"flex",flexDirection:"column",gap:2}}>
      {NAV.map(([id,ic,label])=>(
        <button key={id} onClick={()=>setPage(id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",borderRadius:T.r.md,border:"none",cursor:"pointer",fontWeight:600,fontSize:T.f.base,background:page===id?T.accentSoft:"transparent",color:page===id?T.accent:T.text3,borderLeft:page===id?`2px solid ${T.accent}`:"2px solid transparent",fontFamily:"inherit",whiteSpace:"nowrap",overflow:"hidden",justifyContent:collapsed?"center":"flex-start",transition:"all .15s"}} onMouseEnter={e=>{if(page!==id)e.currentTarget.style.background="rgba(255,255,255,0.03)";}} onMouseLeave={e=>{if(page!==id)e.currentTarget.style.background="transparent";}}>
          <span style={{fontSize:15,flexShrink:0}}>{ic}</span>{!collapsed&&label}
        </button>
      ))}
    </nav>
    <div style={{padding:"10px 7px",borderTop:`1px solid ${T.border}`}}>
      <button onClick={()=>setCollapsed(c=>!c)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:T.r.md,border:`1px solid ${T.border}`,cursor:"pointer",background:"transparent",color:T.text3,fontSize:T.f.sm,fontWeight:500,width:"100%",justifyContent:collapsed?"center":"flex-start",fontFamily:"inherit",transition:"all .15s"}}>
        <span style={{fontSize:13,transform:collapsed?"scaleX(-1)":"none",transition:"transform .2s"}}>◀</span>
        {!collapsed&&"Recolher"}
      </button>
      {!collapsed&&<Div align="center" gap={8} style={{padding:"9px",marginTop:7,borderRadius:T.r.md,background:T.bg3}}>
        <Avatar name="Admin User" size={26}/>
        <Col gap={0}><Txt size="sm" w={600}>Admin</Txt><Txt size="xs" c={T.text3}>admin@incast.io</Txt></Col>
      </Div>}
    </div>
  </div>;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CRMApp(){
  const [page,setPage]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [influencers,setInfluencers]=useState(SEED);
  const [lists,setLists]=useState([
    {id:1,name:"Campanha Dia das Mães",color:T.pink,influencers:[1,7,3]},
    {id:2,name:"Tech Q3 2025",color:T.cyan,influencers:[4,10]},
    {id:3,name:"Fitness Summer",color:T.green,influencers:[2,9,5]},
  ]);
  const [selected,setSelected]=useState(null);
  const [toast,setToast]=useState(null);
  const [comparatorOpen,setComparatorOpen]=useState(null);

  function updInf(u){setInfluencers(p=>p.map(i=>i.id===u.id?u:i));setSelected(u);}

  return <div style={{display:"flex",minHeight:"100vh",background:T.bg0,color:T.text1,fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    <style>{css}</style>
    <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed}/>
    <main style={{flex:1,overflowY:"auto",minWidth:0}}>
      <div style={{maxWidth:1320,margin:"0 auto",padding:"22px 26px"}}>
        {page==="dashboard"&&<Dashboard influencers={influencers} setPage={setPage}/>}
        {page==="discovery"&&<Discovery influencers={influencers} setInfluencers={setInfluencers} lists={lists} setToast={setToast} onOpen={setSelected} setComparatorOpen={setComparatorOpen}/>}
        {page==="kanban"&&<Kanban influencers={influencers} onUpdate={updInf} setToast={setToast} onCardClick={setSelected}/>}
        {page==="lists"&&<Lists lists={lists} setLists={setLists} influencers={influencers} onOpen={setSelected} setToast={setToast}/>}
        {page==="analytics"&&<Analytics influencers={influencers}/>}
        {page==="ai"&&<AIStudio influencers={influencers}/>}
      </div>
    </main>
    {selected&&<Drawer inf={selected} onClose={()=>setSelected(null)} onUpdate={updInf} lists={lists} setToast={setToast}/>}
    {comparatorOpen&&<ComparatorModal influencers={influencers} onClose={()=>setComparatorOpen(null)}/>}
    {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>;
}
