import { useState } from "react";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MapPage } from "./pages/MapPage.jsx";

const SESSION_KEY = "bpo-postman-session";
function readSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } }

export default function App() {
  const [user, setUser] = useState(readSession);
  function login(account) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(account)); setUser(account); }
  function logout() { sessionStorage.removeItem(SESSION_KEY); setUser(null); }
  return user ? <MapPage user={user} onLogout={logout} /> : <LoginPage onLogin={login} />;
}
