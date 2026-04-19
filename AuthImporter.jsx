import { useState, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0:"#03040a", bg1:"#070a12", bg2:"#0c1019", bg3:"#111520", bg4:"#171d2b", bg5:"#1d2436",
  border:"rgba(255,255,255,0.06)", borderHover:"rgba(255,255,255,0.12)",
  text1:"#edf0fa", text2:"#8994b4", text3:"#4d5878", text4:"#2b3252",
  accent:"#4f6ef7", accentHover:"#6b85ff", accentSoft:"rgba(79,110,247,0.1)",
  green:"#10b981", greenSoft:"rgba(16,185,129,0.1)",
  amber:"#f59e0b", amberSoft:"rgba(245,158,11,0.1)",
  red:"#ef4444", redSoft:"rgba(239,68,68,0.1)",
  purple:"#8b5cf6", purpleSoft:"rgba(139,92,246,0.1)",
  cyan:"#06b6d4", cyanSoft:"rgba(6,182,212,0.1)",
  r:{ sm:"6px", md:"10px", lg:"14px", xl:"18px", "2xl":"24px", full:"9999px" },
  f:{ xs:"10px", sm:"11px", base:"13px", md:"14px", lg:"16px", xl:"20px", "2xl":"26px", "3xl":"36px" },
};

// ─── SUPABASE CONFIG HELPER ───────────────────────────────────────────────────
// In production: replace with your actual Supabase URL and anon key
// These are set via environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-key";

// Minimal Supabase client (no SDK dependency)
const supabase = {
  auth: {
    async signIn(email, password) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email, password }),
      });
      return r.json();
    },
    async signUp(email, password, fullName) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email, password, data: { full_name: fullName } }),
      });
      return r.json();
    },
    async resetPassword(email) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
        body: JSON.stringify({ email }),
      });
      return r.json();
    },
  },
  db: {
    async insert(table, rows, token) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify(rows),
      });
      return r.json();
    },
  },
};

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  }).filter(r => Object.values(r).some(v => v !== ""));
  return { headers, rows };
}

// Column mapping: CSV header variants → internal field names
const FIELD_MAP = {
  nome: "name", nome_completo: "name", name: "name", full_name: "name",
  handle: "handle", username: "handle", "@": "handle", arroba: "handle",
  instagram: "instagram", ig: "instagram", insta: "instagram",
  tiktok: "tiktok", tt: "tiktok",
  youtube: "youtube", yt: "youtube",
  "twitter/x": "twitter", twitter: "twitter", x: "twitter",
  engajamento: "engagement", engagement: "engagement", eng: "engagement", taxa_engajamento: "engagement",
  nicho: "niche", niche: "niche", categoria: "niche",
  estado: "state", state: "state", uf: "state",
  email: "email", e_mail: "email",
  status: "status",
  cache: "cache", cachê: "cache", cachet: "cache", preco: "cache",
  notas: "notes", notes: "notes", observacoes: "notes",
  idioma: "language", language: "language",
  genero: "gender", gender: "gender",
  cidade: "city", city: "city",
  pais: "country", country: "country",
  faixa_etaria: "age_band", age_band: "age_band",
};

function mapRow(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const mapped = FIELD_MAP[k.toLowerCase().trim()] || k;
    out[mapped] = v;
  }
  // Normalize followers
  const followers = {};
  if (out.instagram) followers.Instagram = parseInt(out.instagram.replace(/\D/g,"")) || 0;
  if (out.tiktok) followers.TikTok = parseInt(out.tiktok.replace(/\D/g,"")) || 0;
  if (out.youtube) followers.YouTube = parseInt(out.youtube.replace(/\D/g,"")) || 0;
  if (out.twitter) followers["Twitter/X"] = parseInt(out.twitter.replace(/\D/g,"")) || 0;
  const totalF = Object.values(followers).reduce((a,b) => a+b, 0);
  const eng = parseFloat(out.engagement?.replace(",", ".")) || 0;
  const tier = totalF >= 1000000 ? "Mega" : totalF >= 500000 ? "Macro" : totalF >= 100000 ? "Mid" : totalF >= 10000 ? "Micro" : "Nano";
  const score = Math.min(100, Math.round(eng * 750 + Math.log10(Math.max(totalF,1)) * 8));
  return {
    name: out.name || "—",
    handle: out.handle || "",
    email: out.email || "",
    niche: out.niche ? out.niche.split(/[|,;]/).map(s => s.trim()).filter(Boolean) : [],
    state: out.state || "",
    language: out.language || "Português",
    gender: out.gender || "",
    age_band: out.age_band || "",
    status: out.status || "Novo",
    notes: out.notes || "",
    cache: parseInt(out.cache?.replace(/\D/g,"")) || 0,
    city: out.city || "",
    country: out.country || "Brasil",
    followers,
    engagement: eng,
    tier,
    score,
    total_followers: totalF,
    platform: Object.keys(followers),
    created_at: new Date().toISOString(),
  };
}

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:${T.bg0};}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes shimmer{from{background-position:-400px 0}to{background-position:400px 0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(79,110,247,0.3)}50%{box-shadow:0 0 40px rgba(79,110,247,0.6)}}
  input::placeholder{color:${T.text3};}
  select option{background:${T.bg3};color:${T.text1};}
`;

function Spinner({ size = 18, color = T.accent }) {
  return <div style={{ width:size, height:size, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:"50%", animation:"spin .8s linear infinite", flexShrink:0 }} />;
}

function Btn({ children, onClick, variant="primary", size="md", disabled, loading, icon, full, style:s }) {
  const V = {
    primary:  { bg:T.accent,       c:"#fff",   hbg:T.accentHover, border:"none" },
    secondary:{ bg:T.bg4,          c:T.text1,  hbg:T.bg5,         border:`1px solid ${T.border}` },
    ghost:    { bg:"transparent",  c:T.text2,  hbg:"rgba(255,255,255,0.04)", border:"none" },
    danger:   { bg:T.redSoft,      c:T.red,    hbg:"rgba(239,68,68,0.18)", border:`1px solid rgba(239,68,68,0.2)` },
    success:  { bg:T.greenSoft,    c:T.green,  hbg:"rgba(16,185,129,0.18)", border:`1px solid rgba(16,185,129,0.2)` },
  };
  const SZ = { sm:{p:"6px 12px",fs:"11px"}, md:{p:"9px 18px",fs:"13px"}, lg:{p:"12px 24px",fs:"14px"} };
  const [hov, setHov] = useState(false);
  const v=V[variant]||V.primary, sz=SZ[size]||SZ.md;
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?v.hbg:v.bg, color:v.c, border:v.border||"none", borderRadius:T.r.md, padding:sz.p, fontSize:sz.fs, fontWeight:600, cursor:disabled||loading?"not-allowed":"pointer", opacity:disabled?.5:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .15s", whiteSpace:"nowrap", fontFamily:"inherit", letterSpacing:"-.2px", width:full?"100%":undefined, ...s }}>
      {loading ? <Spinner size={14} color={v.c} /> : icon && <span style={{fontSize:"14px"}}>{icon}</span>}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type="text", placeholder, icon, error, hint, autoFocus, ...rest }) {
  const [foc, setFoc] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:T.f.sm, color:T.text2, fontWeight:500 }}>{label}</label>}
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {icon && <span style={{ position:"absolute", left:12, color:foc?T.accent:T.text3, fontSize:"15px", pointerEvents:"none", transition:"color .15s" }}>{icon}</span>}
        <input
          type={isPass ? (show?"text":"password") : type}
          value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus}
          onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
          style={{ width:"100%", background:T.bg3, border:`1px solid ${error?T.red:foc?T.accent:T.border}`, borderRadius:T.r.lg, padding:`11px ${isPass?40:12}px 11px ${icon?40:12}px`, color:T.text1, fontSize:T.f.base, outline:"none", transition:"border-color .15s", fontFamily:"inherit", boxSizing:"border-box" }}
          {...rest}
        />
        {isPass && (
          <button onClick={()=>setShow(s=>!s)} type="button" style={{ position:"absolute", right:12, background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:"15px", padding:0 }}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize:T.f.xs, color:T.red }}>{error}</span>}
      {hint && !error && <span style={{ fontSize:T.f.xs, color:T.text3 }}>{hint}</span>}
    </div>
  );
}

function Badge({ label, color, bg, size="sm" }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", background:bg||color+"1a", color, border:`1px solid ${color}22`, borderRadius:T.r.full, fontSize:size==="xs"?"10px":"11px", fontWeight:600, padding:size==="xs"?"2px 6px":"3px 8px", whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErr, setFieldErr] = useState({});

  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = "E-mail obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "E-mail inválido";
    if (mode !== "reset") {
      if (!password) errs.password = "Senha obrigatória";
      else if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    }
    if (mode === "signup" && !name.trim()) errs.name = "Nome obrigatório";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "login") {
        // DEMO MODE: bypass Supabase if using placeholder credentials
        if (email === "admin@incast.io" && password === "incast2025") {
          onLogin({ email, name: "Admin Incast", role: "admin", token: "demo-token" });
          return;
        }
        if (email === "curador@incast.io" && password === "incast2025") {
          onLogin({ email, name: "Curador", role: "curator", token: "demo-token" });
          return;
        }
        const data = await supabase.auth.signIn(email, password);
        if (data.error) { setError(data.error.message || "Credenciais inválidas"); return; }
        onLogin({ email, name: data.user?.user_metadata?.full_name || email.split("@")[0], role: "admin", token: data.access_token });
      } else if (mode === "signup") {
        const data = await supabase.auth.signUp(email, password, name);
        if (data.error) { setError(data.error.message); return; }
        setSuccess("Conta criada! Verifique seu e-mail para ativar.");
        setMode("login");
      } else {
        await supabase.auth.resetPassword(email);
        setSuccess("E-mail de recuperação enviado!");
        setMode("login");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const DEMO_USERS = [
    { label:"Admin", email:"admin@incast.io", pass:"incast2025", role:"admin", color:T.accent },
    { label:"Curador", email:"curador@incast.io", pass:"incast2025", role:"curator", color:T.purple },
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg0, display:"flex", position:"relative", overflow:"hidden" }}>
      {/* Animated background */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ position:"absolute", borderRadius:"50%", background:`radial-gradient(circle, rgba(79,110,247,${0.04+i*0.01}) 0%, transparent 70%)`, width: 400+i*120, height: 400+i*120, left:`${[-20,10,50,70,20,80][i]}%`, top:`${[-10,20,60,10,80,50][i]}%`, transform:"translate(-50%,-50%)", animation:`float ${4+i}s ease-in-out infinite`, animationDelay:`${i*0.8}s` }} />
        ))}
        {/* Grid pattern */}
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(79,110,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,110,247,0.03) 1px, transparent 1px)`, backgroundSize:"48px 48px" }} />
      </div>

      {/* Left panel — branding */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px", position:"relative", display:"none" }}>
        {/* hidden on small, shown on lg */}
      </div>

      {/* Right panel — form (centered) */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative" }}>
        <div style={{ width:"100%", maxWidth:420, animation:"fadeUp .35s ease" }}>

          {/* Logo */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:36 }}>
            <div style={{ width:52, height:52, borderRadius:T.r.xl, background:`linear-gradient(135deg, ${T.accent}, #7c3aed)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, boxShadow:`0 0 32px rgba(79,110,247,0.4)`, animation:"glow 3s ease-in-out infinite" }}>✦</div>
            <span style={{ fontSize:T.f["2xl"], fontWeight:900, color:T.text1, letterSpacing:"-1px" }}>Incast</span>
            <span style={{ fontSize:T.f.sm, color:T.text3, fontWeight:500, letterSpacing:"1px", textTransform:"uppercase", marginTop:3 }}>Creator CRM</span>
          </div>

          {/* Card */}
          <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r["2xl"], padding:"32px 28px", boxShadow:`0 24px 64px rgba(0,0,0,0.6)` }}>
            {/* Tab switcher */}
            {mode !== "reset" && (
              <div style={{ display:"flex", gap:0, marginBottom:24, background:T.bg3, borderRadius:T.r.lg, padding:3 }}>
                {[["login","Entrar"],["signup","Criar conta"]].map(([m,l]) => (
                  <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");setFieldErr({});}} style={{ flex:1, padding:"8px 12px", borderRadius:T.r.md, border:"none", cursor:"pointer", fontWeight:700, fontSize:T.f.sm, fontFamily:"inherit", background:mode===m?T.accent:"transparent", color:mode===m?"#fff":T.text3, transition:"all .2s" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {mode === "reset" && (
                <div style={{ textAlign:"center", marginBottom:4 }}>
                  <div style={{ fontSize:T.f.xl, marginBottom:8 }}>🔐</div>
                  <span style={{ fontSize:T.f.md, fontWeight:700, color:T.text1 }}>Recuperar senha</span>
                  <p style={{ fontSize:T.f.sm, color:T.text3, marginTop:4 }}>Enviaremos um link para redefinir sua senha.</p>
                </div>
              )}
              {mode === "signup" && (
                <Input label="Nome completo" value={name} onChange={setName} placeholder="Ana Beatriz Costa" icon="👤" error={fieldErr.name}/>
              )}
              <Input label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" icon="✉️" error={fieldErr.email} autoFocus/>
              {mode !== "reset" && (
                <Input label="Senha" value={password} onChange={setPassword} type="password" placeholder={mode==="signup"?"Mínimo 6 caracteres":"••••••••"} icon="🔒" error={fieldErr.password}/>
              )}
              {mode === "login" && (
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <button type="button" onClick={()=>{setMode("reset");setError("");setSuccess("");}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:T.f.sm, color:T.text3, fontFamily:"inherit", textDecoration:"underline" }}>
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {error && (
                <div style={{ background:T.redSoft, border:`1px solid rgba(239,68,68,0.2)`, borderRadius:T.r.md, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>⚠️</span>
                  <span style={{ fontSize:T.f.sm, color:T.red }}>{error}</span>
                </div>
              )}
              {success && (
                <div style={{ background:T.greenSoft, border:`1px solid rgba(16,185,129,0.2)`, borderRadius:T.r.md, padding:"10px 12px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>✓</span>
                  <span style={{ fontSize:T.f.sm, color:T.green }}>{success}</span>
                </div>
              )}

              <Btn full loading={loading} size="lg" style={{ marginTop:4 }}>
                {mode==="login"?"Entrar na plataforma":mode==="signup"?"Criar conta":"Enviar link de recuperação"}
              </Btn>

              {mode === "reset" && (
                <button type="button" onClick={()=>setMode("login")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:T.f.sm, color:T.text3, fontFamily:"inherit", textAlign:"center", textDecoration:"underline" }}>
                  ← Voltar ao login
                </button>
              )}
            </form>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop:20, background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, padding:"16px 20px" }}>
            <p style={{ fontSize:T.f.xs, color:T.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:".8px", marginBottom:12, textAlign:"center" }}>
              🧪 Acesso Demo
            </p>
            <div style={{ display:"flex", gap:8 }}>
              {DEMO_USERS.map(u => (
                <button key={u.label} onClick={() => { setEmail(u.email); setPassword(u.pass); setMode("login"); }} style={{ flex:1, background:u.color+"10", border:`1px solid ${u.color}22`, borderRadius:T.r.md, padding:"8px 10px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=u.color+"55"} onMouseLeave={e=>e.currentTarget.style.borderColor=u.color+"22"}>
                  <div style={{ fontSize:T.f.xs, fontWeight:700, color:u.color, marginBottom:2 }}>{u.label}</div>
                  <div style={{ fontSize:10, color:T.text3 }}>{u.email}</div>
                </button>
              ))}
            </div>
            <p style={{ fontSize:"10px", color:T.text4, textAlign:"center", marginTop:10 }}>
              Clique em um perfil para preencher automaticamente
            </p>
          </div>

          <p style={{ fontSize:T.f.xs, color:T.text4, textAlign:"center", marginTop:16 }}>
            Ao entrar, você concorda com os Termos de Uso da Incast
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CSV IMPORTER ─────────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = "Nome Completo,Handle,Email,Instagram,TikTok,YouTube,Twitter/X,Engajamento,Nicho,Estado,Status,Cachê,Idioma,Gênero,Faixa Etária,Notas";
const TEMPLATE_EXAMPLE = `Ana Beatriz Costa,@anabeatriz,ana@email.com,284000,150000,,, 0.048,Beleza|Lifestyle,SP,Novo,8500,Português,Feminino,25-34,Parceria anterior
Pedro Alves,@pedrofit,pedro@fit.com,890000,,320000,,0.032,Fitness|Saúde,RJ,Em contato,15000,Português,Masculino,25-44,
Larissa Moda,@larimoda,lari@moda.com,52000,38000,,,0.071,Moda,MG,Novo,4200,Português,Feminino,18-28,`;

function downloadTemplate() {
  const content = TEMPLATE_HEADERS + "\n" + TEMPLATE_EXAMPLE;
  const blob = new Blob([content], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "incast_template.csv"; a.click();
  URL.revokeObjectURL(url);
}

function ImportProgress({ current, total, status }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ background:T.bg3, borderRadius:T.r.lg, padding:"14px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:T.f.sm, color:T.text2, fontWeight:500 }}>{status}</span>
        <span style={{ fontSize:T.f.sm, color:T.accent, fontWeight:700 }}>{pct}%</span>
      </div>
      <div style={{ background:T.bg5, borderRadius:T.r.full, height:6 }}>
        <div style={{ background:`linear-gradient(90deg, ${T.accent}, ${T.purple})`, borderRadius:T.r.full, height:"100%", width:`${pct}%`, transition:"width .3s ease", boxShadow:`0 0 8px ${T.accent}66` }} />
      </div>
      <div style={{ fontSize:T.f.xs, color:T.text3, marginTop:6 }}>{current} de {total} registros processados</div>
    </div>
  );
}

function CSVImporter({ user, onImportComplete }) {
  const [step, setStep] = useState("upload"); // upload | preview | mapping | importing | done
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapped, setMapped] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [progress, setProgress] = useState({ current:0, total:0, status:"" });
  const [importResult, setImportResult] = useState(null);
  const [previewPage, setPreviewPage] = useState(0);
  const fileRef = useRef();
  const PREVIEW_PER_PAGE = 8;

  const INTERNAL_FIELDS = [
    { key:"name", label:"Nome", required:true },
    { key:"handle", label:"Handle / @", required:false },
    { key:"email", label:"E-mail", required:false },
    { key:"instagram", label:"Seguidores Instagram", required:false },
    { key:"tiktok", label:"Seguidores TikTok", required:false },
    { key:"youtube", label:"Seguidores YouTube", required:false },
    { key:"twitter", label:"Seguidores Twitter/X", required:false },
    { key:"engagement", label:"Engajamento", required:false },
    { key:"niche", label:"Nicho(s)", required:false },
    { key:"state", label:"Estado (UF)", required:false },
    { key:"status", label:"Status CRM", required:false },
    { key:"cache", label:"Cachê estimado (R$)", required:false },
    { key:"language", label:"Idioma", required:false },
    { key:"gender", label:"Gênero audiência", required:false },
    { key:"age_band", label:"Faixa etária audiência", required:false },
    { key:"notes", label:"Notas", required:false },
    { key:"__skip__", label:"— Ignorar coluna —", required:false },
  ];

  function processFile(f) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result);
      // Auto-map columns by name similarity
      const autoMap = {};
      headers.forEach(h => { autoMap[h] = FIELD_MAP[h.toLowerCase().replace(/[^a-z0-9]/g,"_")] || "__skip__"; });
      setColumnMapping(autoMap);
      setParsed({ headers, rows });
      setStep("mapping");
    };
    reader.readAsText(f, "UTF-8");
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".txt"))) processFile(f);
  }

  function buildMapped() {
    if (!parsed) return;
    const errs = [], warns = [];
    const result = parsed.rows.map((rawRow, i) => {
      // Apply column mapping
      const remapped = {};
      parsed.headers.forEach(h => {
        const target = columnMapping[h];
        if (target && target !== "__skip__") remapped[target] = rawRow[h];
      });
      const row = mapRow(remapped);
      if (!row.name || row.name === "—") errs.push(`Linha ${i+2}: Nome obrigatório ausente`);
      if (row.total_followers === 0) warns.push(`Linha ${i+2}: ${row.name} — nenhum seguidor informado`);
      return row;
    });
    setErrors(errs);
    setWarnings(warns);
    setMapped(result);
    setStep("preview");
    setPreviewPage(0);
  }

  async function runImport() {
    setStep("importing");
    const total = mapped.length;
    setProgress({ current:0, total, status:"Preparando importação..." });

    // Simulate batch processing (in production, sends to Supabase in batches of 50)
    const BATCH = 50;
    let imported = 0, failed = 0;
    const failedRows = [];

    for (let i = 0; i < total; i += BATCH) {
      const batch = mapped.slice(i, i+BATCH);
      setProgress({ current:Math.min(i+BATCH, total), total, status:`Importando lote ${Math.floor(i/BATCH)+1}...` });
      await new Promise(r => setTimeout(r, 180)); // simulate network
      // In production:
      // const result = await supabase.db.insert("influencers", batch, user.token);
      // if (result.error) { failed += batch.length; failedRows.push(...batch.map(r=>r.name)); }
      // else imported += batch.length;
      imported += batch.length;
    }

    setProgress({ current:total, total, status:"Finalizando..." });
    await new Promise(r => setTimeout(r, 400));

    setImportResult({ imported, failed, failedRows, total });
    setStep("done");
    if (onImportComplete) onImportComplete(mapped);
  }

  const TIER_COLOR = { Mega:"#ef4444", Macro:"#f97316", Mid:"#10b981", Micro:"#4f6ef7", Nano:"#8b5cf6" };
  const fmtN = n => n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(0)+"K":String(n||0);

  return (
    <div style={{ minHeight:"100vh", background:T.bg0, color:T.text1, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Top bar */}
      <div style={{ background:T.bg1, borderBottom:`1px solid ${T.border}`, padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:T.r.md, background:`linear-gradient(135deg,${T.accent},#7c3aed)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✦</div>
          <div>
            <span style={{ fontSize:T.f.lg, fontWeight:800, letterSpacing:"-.5px" }}>Incast</span>
            <span style={{ fontSize:T.f.sm, color:T.text3, marginLeft:10 }}>Importador de Influenciadores</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:T.green, boxShadow:`0 0 6px ${T.green}` }} />
          <span style={{ fontSize:T.f.sm, color:T.text2 }}>{user?.name}</span>
          <Badge label={user?.role === "admin" ? "Admin" : "Curador"} color={user?.role==="admin"?T.accent:T.purple} />
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ background:T.bg1, borderBottom:`1px solid ${T.border}`, padding:"14px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:0, maxWidth:700, margin:"0 auto" }}>
          {[["upload","📁","Upload"],["mapping","🔗","Mapeamento"],["preview","👁️","Pré-visualização"],["importing","⚙️","Importando"],["done","✓","Concluído"]].map(([id,ic,label], idx, arr) => {
            const steps = ["upload","mapping","preview","importing","done"];
            const current = steps.indexOf(step);
            const thisIdx = steps.indexOf(id);
            const done = current > thisIdx;
            const active = current === thisIdx;
            return (
              <div key={id} style={{ display:"flex", alignItems:"center", flex: idx < arr.length-1 ? 1 : 0 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:done?T.green:active?T.accent:T.bg3, border:`2px solid ${done?T.green:active?T.accent:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:done?"13px":"14px", fontWeight:700, color:done||active?"#fff":T.text3, transition:"all .3s", boxShadow:active?`0 0 14px ${T.accent}55`:"none" }}>
                    {done ? "✓" : ic}
                  </div>
                  <span style={{ fontSize:"10px", color:active?T.accent:done?T.green:T.text3, fontWeight:active||done?600:400, whiteSpace:"nowrap" }}>{label}</span>
                </div>
                {idx < arr.length-1 && <div style={{ flex:1, height:2, background:done?T.green:T.bg4, margin:"0 6px", marginBottom:18, transition:"background .3s" }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"32px auto", padding:"0 24px" }}>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <h2 style={{ fontSize:T.f.xl, fontWeight:800, marginBottom:6, letterSpacing:"-.5px" }}>📁 Faça upload do seu arquivo</h2>
              <p style={{ color:T.text3, fontSize:T.f.base }}>Suporta CSV e TXT. Máximo 100.000 linhas por importação.</p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={onDrop}
              onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver?T.accent:T.border}`, borderRadius:T.r.xl, padding:"56px 40px", textAlign:"center", cursor:"pointer", background:dragOver?T.accentSoft:"rgba(255,255,255,0.01)", transition:"all .2s", position:"relative" }}
            >
              <div style={{ fontSize:48, marginBottom:12, filter:dragOver?"drop-shadow(0 0 12px rgba(79,110,247,0.8))":"none", transition:"filter .2s" }}>📂</div>
              <p style={{ fontSize:T.f.md, fontWeight:600, color:dragOver?T.accent:T.text1, marginBottom:6 }}>
                {dragOver ? "Solte o arquivo aqui" : "Arraste e solte seu CSV aqui"}
              </p>
              <p style={{ fontSize:T.f.sm, color:T.text3 }}>ou clique para selecionar</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:"none" }} onChange={e => { if(e.target.files[0]) processFile(e.target.files[0]); }} />
            </div>

            {/* Template download */}
            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                <div style={{ width:42, height:42, borderRadius:T.r.lg, background:T.greenSoft, border:`1px solid rgba(16,185,129,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
                <div>
                  <p style={{ fontSize:T.f.md, fontWeight:700, marginBottom:2 }}>Template oficial Incast</p>
                  <p style={{ fontSize:T.f.sm, color:T.text3 }}>16 colunas pré-configuradas • Compatível com a planilha Excel</p>
                </div>
              </div>
              <Btn variant="success" onClick={downloadTemplate} icon="⬇️">Baixar Template</Btn>
            </div>

            {/* Tips */}
            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, padding:"20px 24px" }}>
              <p style={{ fontSize:T.f.sm, fontWeight:700, color:T.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:".5px" }}>💡 Boas práticas</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["Use a planilha Excel gerada anteriormente como base","📊"],["Engajamento em decimal: 4.8% = 0.048","📈"],["Múltiplos nichos separados por | ou vírgula","🏷️"],["Seguidores em número inteiro sem pontuação","👥"],["Máximo 100.000 linhas por arquivo CSV","📁"],["Encoding UTF-8 para caracteres especiais","🔤"]].map(([t,ic]) => (
                  <div key={t} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{ic}</span>
                    <span style={{ fontSize:T.f.sm, color:T.text3, lineHeight:1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: MAPPING ── */}
        {step === "mapping" && parsed && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <h2 style={{ fontSize:T.f.xl, fontWeight:800, marginBottom:6, letterSpacing:"-.5px" }}>🔗 Mapeamento de colunas</h2>
              <p style={{ color:T.text3, fontSize:T.f.base }}>{parsed.rows.length} linhas detectadas em <strong style={{color:T.text1}}>{file?.name}</strong> • Confira se cada coluna foi mapeada corretamente</p>
            </div>

            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:16, padding:"12px 20px", background:T.bg3, borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:T.f.xs, color:T.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:".5px" }}>Coluna no CSV</span>
                <span style={{ fontSize:T.f.xs, color:T.text3, fontWeight:600 }}></span>
                <span style={{ fontSize:T.f.xs, color:T.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:".5px" }}>Campo Incast</span>
              </div>
              <div style={{ maxHeight:360, overflowY:"auto" }}>
                {parsed.headers.map(h => {
                  const target = columnMapping[h];
                  const ok = target && target !== "__skip__";
                  return (
                    <div key={h} style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:16, padding:"10px 20px", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:ok?T.green:T.text4 }} />
                        <span style={{ fontSize:T.f.base, fontWeight:500 }}>{h}</span>
                        <span style={{ fontSize:T.f.xs, color:T.text4 }}>{parsed.rows[0]?.[h]?.slice(0,20) || "—"}</span>
                      </div>
                      <span style={{ color:T.text4, fontSize:T.f.sm }}>→</span>
                      <select
                        value={target || "__skip__"}
                        onChange={e => setColumnMapping(m => ({...m,[h]:e.target.value}))}
                        style={{ background:T.bg3, border:`1px solid ${ok?T.green+"44":T.border}`, borderRadius:T.r.md, padding:"6px 10px", color:ok?T.text1:T.text3, fontSize:T.f.sm, outline:"none", cursor:"pointer", fontFamily:"inherit" }}
                      >
                        {INTERNAL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}{f.required?" *":""}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <Btn variant="secondary" onClick={()=>setStep("upload")} icon="←">Voltar</Btn>
              <Btn variant="primary" onClick={buildMapped} icon="→">Ver pré-visualização</Btn>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === "preview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h2 style={{ fontSize:T.f.xl, fontWeight:800, marginBottom:6, letterSpacing:"-.5px" }}>👁️ Pré-visualização dos dados</h2>
              <p style={{ color:T.text3, fontSize:T.f.base }}>{mapped.length} influenciadores prontos para importar</p>
            </div>

            {/* Summary stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[["Total","👥",mapped.length,T.accent],[">100K","📊",mapped.filter(r=>r.total_followers>=100000).length,T.green],["Avisos","⚠️",warnings.length,T.amber],["Erros","❌",errors.length,T.red]].map(([l,ic,v,c])=>(
                <div key={l} style={{ background:T.bg2, border:`1px solid ${c}22`, borderRadius:T.r.lg, padding:"12px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
                  <div style={{ fontSize:T.f.xl, fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:T.f.xs, color:T.text3 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div style={{ background:T.redSoft, border:`1px solid rgba(239,68,68,0.2)`, borderRadius:T.r.lg, padding:"12px 16px" }}>
                <p style={{ fontSize:T.f.sm, fontWeight:700, color:T.red, marginBottom:8 }}>❌ {errors.length} erros encontrados (serão ignorados)</p>
                <div style={{ maxHeight:100, overflowY:"auto" }}>
                  {errors.map((e,i)=><p key={i} style={{ fontSize:T.f.xs, color:T.red, marginBottom:2 }}>{e}</p>)}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div style={{ background:T.amberSoft, border:`1px solid rgba(245,158,11,0.2)`, borderRadius:T.r.lg, padding:"12px 16px" }}>
                <p style={{ fontSize:T.f.sm, fontWeight:700, color:T.amber, marginBottom:8 }}>⚠️ {warnings.length} avisos (serão importados mesmo assim)</p>
                <div style={{ maxHeight:80, overflowY:"auto" }}>
                  {warnings.slice(0,5).map((w,i)=><p key={i} style={{ fontSize:T.f.xs, color:T.amber, marginBottom:2 }}>{w}</p>)}
                  {warnings.length > 5 && <p style={{ fontSize:T.f.xs, color:T.text3 }}>...e mais {warnings.length-5} avisos</p>}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1fr 1fr", gap:0, padding:"10px 16px", background:T.bg3, borderBottom:`1px solid ${T.border}` }}>
                {["Nome / Handle","Nicho","Seguidores","Eng.","Tier","Score"].map(h=>(
                  <span key={h} style={{ fontSize:T.f.xs, color:T.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:".4px" }}>{h}</span>
                ))}
              </div>
              {mapped.slice(previewPage*PREVIEW_PER_PAGE, (previewPage+1)*PREVIEW_PER_PAGE).map((r,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1fr 1fr", gap:0, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, background:i%2===0?T.bg2:T.bg1, alignItems:"center" }}>
                  <div>
                    <p style={{ fontSize:T.f.sm, fontWeight:600, color:T.text1 }}>{r.name}</p>
                    <p style={{ fontSize:T.f.xs, color:T.accent }}>{r.handle||"—"}</p>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                    {(Array.isArray(r.niche)?r.niche:[r.niche]).filter(Boolean).slice(0,2).map(n=>(
                      <Badge key={n} label={n} color={T.purple} size="xs"/>
                    ))}
                  </div>
                  <span style={{ fontSize:T.f.sm, color:T.text1, fontWeight:600 }}>{fmtN(r.total_followers)}</span>
                  <span style={{ fontSize:T.f.sm, color:T.green, fontWeight:600 }}>{r.engagement?(r.engagement*100).toFixed(1)+"%":"—"}</span>
                  <Badge label={r.tier||"?"} color={TIER_COLOR[r.tier]||T.text3} size="xs"/>
                  <div style={{ display:"flex", alignItems:"center" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:(r.score>=80?T.green:r.score>=60?T.amber:T.red)+"18", border:`1px solid ${(r.score>=80?T.green:r.score>=60?T.amber:T.red)}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:r.score>=80?T.green:r.score>=60?T.amber:T.red }}>
                      {r.score||"?"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {mapped.length > PREVIEW_PER_PAGE && (
              <div style={{ display:"flex", justifyContent:"center", gap:8, alignItems:"center" }}>
                <Btn variant="secondary" size="sm" disabled={previewPage===0} onClick={()=>setPreviewPage(p=>p-1)}>←</Btn>
                <span style={{ fontSize:T.f.sm, color:T.text3 }}>Página {previewPage+1} de {Math.ceil(mapped.length/PREVIEW_PER_PAGE)}</span>
                <Btn variant="secondary" size="sm" disabled={(previewPage+1)*PREVIEW_PER_PAGE>=mapped.length} onClick={()=>setPreviewPage(p=>p+1)}>→</Btn>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
              <Btn variant="secondary" onClick={()=>setStep("mapping")} icon="←">Revisar mapeamento</Btn>
              <Btn variant="primary" size="lg" onClick={runImport} disabled={errors.length===mapped.length} icon="⚡">
                Importar {mapped.filter(r=>r.name!=="—").length} influenciadores
              </Btn>
            </div>
          </div>
        )}

        {/* ── STEP: IMPORTING ── */}
        {step === "importing" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20, alignItems:"center", padding:"40px 0" }}>
            <div style={{ fontSize:56, animation:"pulse 1.5s ease-in-out infinite" }}>⚡</div>
            <div style={{ textAlign:"center" }}>
              <h2 style={{ fontSize:T.f.xl, fontWeight:800, marginBottom:8 }}>Importando dados...</h2>
              <p style={{ color:T.text3, fontSize:T.f.base }}>Não feche esta janela</p>
            </div>
            <div style={{ width:"100%", maxWidth:480 }}>
              <ImportProgress current={progress.current} total={progress.total} status={progress.status}/>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && importResult && (
          <div style={{ display:"flex", flexDirection:"column", gap:20, alignItems:"center", padding:"40px 0", textAlign:"center", animation:"fadeUp .4s ease" }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:T.greenSoft, border:`2px solid rgba(16,185,129,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:`0 0 32px rgba(16,185,129,0.2)` }}>✓</div>
            <div>
              <h2 style={{ fontSize:T.f["2xl"], fontWeight:800, marginBottom:8, letterSpacing:"-.5px" }}>Importação concluída!</h2>
              <p style={{ color:T.text3, fontSize:T.f.base }}>Seus influenciadores foram adicionados à plataforma</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, width:"100%", maxWidth:480 }}>
              {[[importResult.imported,"Importados",T.green,"✓"],[importResult.failed,"Falhas",T.red,"✕"],[importResult.total,"Total",T.accent,"#"]].map(([v,l,c,ic])=>(
                <div key={l} style={{ background:T.bg2, border:`1px solid ${c}22`, borderRadius:T.r.xl, padding:"18px" }}>
                  <div style={{ fontSize:T.f.xl, fontWeight:800, color:c }}>{ic} {v}</div>
                  <div style={{ fontSize:T.f.sm, color:T.text3, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
            {importResult.failed > 0 && (
              <div style={{ background:T.amberSoft, border:`1px solid rgba(245,158,11,0.2)`, borderRadius:T.r.lg, padding:"12px 16px", maxWidth:480, width:"100%" }}>
                <p style={{ fontSize:T.f.sm, color:T.amber }}>{importResult.failed} registros falharam. Revise e reimporte estes itens.</p>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="secondary" onClick={()=>{setStep("upload");setFile(null);setParsed(null);setMapped([]);}} icon="📁">Nova importação</Btn>
              <Btn variant="primary" onClick={()=>window.location.href="/"} icon="◎">Ir para Discovery</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP SHELL ───────────────────────────────────────────────────────────
export default function AuthApp() {
  const [user, setUser] = useState(null);      // null = not logged in
  const [view, setView] = useState("login");   // login | importer | dashboard
  const [toast, setToast] = useState(null);

  function handleLogin(u) {
    setUser(u);
    setView("home");
    setToast({ msg:`Bem-vindo, ${u.name}! 👋`, type:"success" });
    setTimeout(()=>setToast(null), 3500);
  }

  function handleImportComplete(rows) {
    setToast({ msg:`${rows.length} influenciadores importados com sucesso!`, type:"success" });
    setTimeout(()=>setToast(null), 4000);
  }

  // Not logged in → Auth screen
  if (!user) return (
    <>
      <style>{css}</style>
      <AuthScreen onLogin={handleLogin}/>
    </>
  );

  // Importer view
  if (view === "importer") return (
    <CSVImporter user={user} onImportComplete={(rows)=>{ handleImportComplete(rows); setView("home"); }}/>
  );

  // Home (post-login dashboard stub — plug in full CRM here)
  return (
    <div style={{ minHeight:"100vh", background:T.bg0, color:T.text1, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:T.bg2, border:`1px solid ${toast.type==="success"?T.green:T.red}44`, borderLeft:`3px solid ${toast.type==="success"?T.green:T.red}`, borderRadius:T.r.lg, padding:"12px 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.7)", display:"flex", alignItems:"center", gap:10, animation:"fadeUp .25s ease" }}>
          <span style={{ fontSize:16 }}>{toast.type==="success"?"✓":"⚠"}</span>
          <span style={{ fontSize:T.f.base }}>{toast.msg}</span>
        </div>
      )}

      {/* Navbar */}
      <div style={{ background:T.bg1, borderBottom:`1px solid ${T.border}`, padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:T.r.md, background:`linear-gradient(135deg,${T.accent},#7c3aed)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxShadow:`0 0 14px rgba(79,110,247,0.35)` }}>✦</div>
          <span style={{ fontSize:T.f.lg, fontWeight:800, letterSpacing:"-.5px" }}>Incast <span style={{ color:T.text3, fontWeight:400, fontSize:T.f.base }}>Creator CRM</span></span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Badge label={user.role==="admin"?"Admin":"Curador"} color={user.role==="admin"?T.accent:T.purple}/>
          <span style={{ fontSize:T.f.sm, color:T.text2 }}>{user.name}</span>
          <button onClick={()=>setUser(null)} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:T.r.md, padding:"5px 10px", color:T.text3, cursor:"pointer", fontSize:T.f.sm, fontFamily:"inherit" }}>Sair</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:"48px auto", padding:"0 24px" }}>

        {/* Welcome card */}
        <div style={{ background:`linear-gradient(135deg,rgba(79,110,247,0.08),rgba(139,92,246,0.04))`, border:`1px solid rgba(79,110,247,0.15)`, borderRadius:T.r["2xl"], padding:"32px 36px", marginBottom:28, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", right:-20, top:-20, fontSize:140, opacity:.03 }}>✦</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:T.accentSoft, border:`1px solid rgba(79,110,247,0.2)`, borderRadius:T.r.full, padding:"4px 12px", marginBottom:14 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.accent, animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:T.f.xs, color:T.accent, fontWeight:600, letterSpacing:".5px" }}>SISTEMA ATIVO</span>
          </div>
          <h1 style={{ fontSize:T.f["2xl"], fontWeight:900, letterSpacing:"-1px", marginBottom:6 }}>
            Olá, {user.name.split(" ")[0]}! 👋
          </h1>
          <p style={{ color:T.text3, fontSize:T.f.md, marginBottom:20 }}>
            Plataforma pronta para uso. Comece importando sua base de influenciadores.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setView("importer")} style={{ background:T.accent, border:"none", borderRadius:T.r.lg, padding:"11px 22px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:T.f.md, fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, boxShadow:`0 4px 16px rgba(79,110,247,0.3)` }}>
              📥 Importar CSV / Excel
            </button>
            <button style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:T.r.lg, padding:"11px 22px", color:T.text1, fontWeight:600, cursor:"pointer", fontSize:T.f.md, fontFamily:"inherit" }}>
              ◎ Acessar Discovery
            </button>
          </div>
        </div>

        {/* Quick start grid */}
        <h2 style={{ fontSize:T.f.lg, fontWeight:700, marginBottom:16, color:T.text2 }}>Próximos passos</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
          {[
            { icon:"📥", title:"Importar influenciadores", desc:"Faça upload do CSV com sua base", action:"Importar agora", onClick:()=>setView("importer"), color:T.accent, done:false },
            { icon:"🔗", title:"Conectar ao Supabase", desc:"Configure sua URL e chave API para persistência real", action:"Ver documentação", onClick:()=>window.open("https://supabase.com/docs","_blank"), color:T.purple, done:false },
            { icon:"👥", title:"Convidar o time", desc:"Adicione curadores e operadores ao sistema", action:"Em breve", onClick:null, color:T.green, done:false },
          ].map(item=>(
            <div key={item.title} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, padding:"20px", display:"flex", flexDirection:"column", gap:10, transition:"all .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=item.color+"44"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{ fontSize:28 }}>{item.icon}</div>
              <div>
                <p style={{ fontWeight:700, fontSize:T.f.md, marginBottom:4 }}>{item.title}</p>
                <p style={{ fontSize:T.f.sm, color:T.text3, lineHeight:1.5 }}>{item.desc}</p>
              </div>
              <button onClick={item.onClick} disabled={!item.onClick} style={{ marginTop:"auto", background:item.onClick?item.color+"15":"transparent", border:`1px solid ${item.onClick?item.color+"33":T.border}`, borderRadius:T.r.md, padding:"7px 12px", color:item.onClick?item.color:T.text4, fontSize:T.f.sm, fontWeight:600, cursor:item.onClick?"pointer":"not-allowed", fontFamily:"inherit", transition:"all .15s" }}>
                {item.action} {item.onClick?"→":""}
              </button>
            </div>
          ))}
        </div>

        {/* Supabase config guide */}
        <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:T.r.xl, padding:"22px 26px" }}>
          <p style={{ fontSize:T.f.md, fontWeight:700, marginBottom:16 }}>⚙️ Configuração do Supabase (produção)</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              ["1","Crie um projeto em supabase.com","https://supabase.com"],
              ["2","Copie a Project URL e o anon key de Settings → API",""],
              ["3","Substitua SUPABASE_URL e SUPABASE_KEY no topo do código",""],
              ["4","Crie a tabela influencers com o SQL abaixo",""],
            ].map(([n,txt,link])=>(
              <div key={n} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>{n}</div>
                <span style={{ fontSize:T.f.sm, color:T.text2, lineHeight:1.5 }}>{txt}{link&&<a href={link} target="_blank" rel="noreferrer" style={{ color:T.accent, marginLeft:6 }}>→ {link}</a>}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, background:T.bg0, borderRadius:T.r.lg, padding:"14px 16px", fontFamily:"monospace", fontSize:T.f.xs, color:"#7dd3fc", lineHeight:1.7, overflowX:"auto" }}>
{`create table influencers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  handle text,
  email text,
  followers jsonb,
  engagement float,
  niche text[],
  platform text[],
  state text,
  status text default 'Novo',
  tier text,
  score int,
  aq_score int,
  fake_rate int,
  cache int,
  notes text,
  language text,
  gender text,
  age_band text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);`}
          </div>
        </div>
      </div>
    </div>
  );
}
