import { useState, useEffect } from "react";

// ─── Lazy-load heavy modules ──────────────────────────────────────────────────
import { lazy, Suspense } from "react";
const CRMApp      = lazy(() => import("./CRM.jsx").then(m => ({ default: m.default })));
const AuthApp     = lazy(() => import("./AuthImporter.jsx").then(m => ({ default: m.default })));

const STORAGE_KEY = "incast_session";

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#03040a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "linear-gradient(135deg,#4f6ef7,#7c3aed)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, color: "#fff",
        boxShadow: "0 0 32px rgba(79,110,247,0.5)",
        animation: "spin 2s linear infinite",
      }}>✦</div>
      <span style={{ color: "#4d5878", fontSize: 13, letterSpacing: "1px" }}>
        CARREGANDO...
      </span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [view, setView] = useState("crm"); // crm | importer

  // Persist session
  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  function handleLogin(user) {
    setSession(user);
    setView("crm");
  }

  function handleLogout() {
    setSession(null);
  }

  // Not authenticated → show Auth screen
  if (!session) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AuthApp onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Authenticated → show full CRM
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CRMApp
        currentUser={session}
        onLogout={handleLogout}
        onOpenImporter={() => setView("importer")}
      />
    </Suspense>
  );
}
