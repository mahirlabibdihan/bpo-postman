import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { Brand } from "../components/Brand.jsx";

export function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ employeeId: "", password: "" });
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!form.employeeId.trim() || !form.password) { setError("আপনার কর্মী আইডি ও পাসওয়ার্ড লিখুন।"); return; }
    onLogin({ name: "আব্দুল করিম", employeeId: form.employeeId.trim(), postOffice: "ঢাকা জিপিও", postcode: "১০০০" });
  }

  return <main className="login-page">
    <section className="login-intro">
      <Brand />
      <div className="intro-copy"><span className="eyebrow">ডাকপিয়ন ফিল্ড অ্যাপ</span><h1>প্রতিটি ঠিকানা<br />নির্ভুলভাবে মানচিত্রে।</h1><p>একটি করে ঠিকানা যাচাই করে গড়ে তুলুন আরও নির্ভুল ডাক বিতরণ ব্যবস্থা।</p></div>
      <div className="route-art" aria-hidden="true"><span className="route-dot dot-a" /><span className="route-dot dot-b" /><span className="route-dot dot-c" /><svg viewBox="0 0 500 220"><path d="M15 175 C110 172,75 35,180 55 S245 185,330 125 S385 30,485 45" /></svg></div>
      <p className="intro-footer">ডাক অধিদপ্তর · ডাক, টেলিযোগাযোগ ও তথ্যপ্রযুক্তি মন্ত্রণালয়</p>
    </section>
    <section className="login-panel">
      <div className="mobile-brand"><Brand compact /></div>
      <form className="login-card" onSubmit={submit}>
        <div className="login-heading"><span className="login-icon"><LockKeyhole size={24} /></span><h2>স্বাগতম</h2><p>আপনার এলাকার ঠিকানা চিহ্নিত করতে প্রবেশ করুন।</p></div>
        <label>কর্মী আইডি<div className="field"><UserRound size={19} /><input autoFocus value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="যেমন: PM-1042" autoComplete="username" /></div></label>
        <label>পাসওয়ার্ড<div className="field"><LockKeyhole size={19} /><input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="আপনার পাসওয়ার্ড লিখুন" autoComplete="current-password" /><button type="button" className="eye-button" aria-label="পাসওয়ার্ড দেখুন বা লুকান" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
        {error && <p className="form-error">{error}</p>}
        <button className="sign-in-button" type="submit">প্রবেশ করুন <span>→</span></button>
        <p className="support-copy">প্রবেশ করতে সমস্যা হচ্ছে?<br /><a href="mailto:support@bdpost.gov.bd">আপনার তত্ত্বাবধায়কের সঙ্গে যোগাযোগ করুন</a></p>
      </form>
      <p className="secure-note"><LockKeyhole size={13} /> নিরাপদ সরকারি ব্যবস্থা · শুধু অনুমোদিত কর্মীদের জন্য</p>
    </section>
  </main>;
}
