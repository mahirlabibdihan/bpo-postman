import { Mail } from "lucide-react";

export function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-seal"><Mail size={22} /></span><span><strong>বাংলাদেশ ডাক বিভাগ</strong><small>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</small></span></div>;
}
