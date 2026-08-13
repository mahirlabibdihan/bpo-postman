import L from "leaflet";
import { Check, LocateFixed, LogOut, MapPin, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Brand } from "../components/Brand.jsx";
import { getSavedPoints, saveDeliveryPoint } from "../api/deliveries.js";

const DHAKA = [23.7104, 90.4074];
const markerIcon = L.divIcon({ className: "delivery-marker", html: '<span><svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>', iconSize: [38, 44], iconAnchor: [19, 42] });
const userIcon = L.divIcon({ className: "user-marker", html: "<span><i></i></span>", iconSize: [36, 36], iconAnchor: [18, 18] });

function LiveMapController({ position, followRequest }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!position) return;
    const location = [position.latitude, position.longitude];
    if (!hasCentered.current) {
      map.flyTo(location, 18, { duration: 0.8 });
      hasCentered.current = true;
    } else {
      map.panTo(location, { animate: true, duration: 0.45 });
    }
  }, [map, position]);

  useEffect(() => {
    if (position && followRequest > 0) map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 18), { duration: 0.6 });
  }, [followRequest, map, position]);

  return null;
}

export function MapPage({ user, onLogout }) {
  const [points, setPoints] = useState(getSavedPoints);
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [followRequest, setFollowRequest] = useState(0);
  function locate(markAfterFinding = false) {
    if (!window.isSecureContext) {
      setStatus("error");
      setNotice("নিরাপত্তার কারণে এই HTTP সংযোগে GPS চালু করা যাচ্ছে না। HTTPS ঠিকানা দিয়ে অ্যাপটি খুলুন।");
      return;
    }
    if (!navigator.geolocation) { setNotice("এই যন্ত্রে অবস্থান শনাক্ত করার সুবিধা নেই।"); return; }
    setStatus("locating"); setNotice("");
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, heading: coords.heading, speed: coords.speed, timestamp });
        setStatus("ready");
        setFollowRequest((value) => value + 1);
        if (markAfterFinding) setShowConfirm(true);
      },
      (error) => {
        setStatus("error");
        setNotice(error.code === error.PERMISSION_DENIED ? "ব্রাউজারে অবস্থানের অনুমতি বন্ধ আছে। সাইট সেটিংস থেকে Location অনুমতি চালু করুন।" : "বর্তমান অবস্থান পাওয়া যায়নি। খোলা জায়গায় গিয়ে আবার চেষ্টা করুন।");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
  }

  async function confirmPoint() {
    if (!position) return;
    setStatus("saving");
    const point = { id: crypto.randomUUID(), ...position, postOffice: user.postOffice, postcode: user.postcode, capturedAt: new Date().toISOString() };
    await saveDeliveryPoint(point); setPoints((current) => [point, ...current]); setShowConfirm(false); setStatus("saved"); setNotice("ডেলিভারি ঠিকানা সফলভাবে চিহ্নিত হয়েছে।");
    setTimeout(() => setStatus("ready"), 2400);
  }

  return <div className="field-app">
    <header className="app-header"><Brand compact /><div className="office-chip"><span>আপনার ডাকঘর</span><strong>{user.postOffice} · {user.postcode}</strong></div><button className="logout-button" onClick={onLogout} aria-label="প্রস্থান করুন"><LogOut size={18} /><span>প্রস্থান করুন</span></button></header>
    <main className="map-layout minimal-map-layout">
      <section className="map-stage">
        <MapContainer center={DHAKA} zoom={15} className="field-map" zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LiveMapController position={position} followRequest={followRequest} />
          {position && <Circle center={[position.latitude, position.longitude]} radius={Math.max(position.accuracy, 5)} pathOptions={{ color: "#1479e8", weight: 1, fillColor: "#4c9df2", fillOpacity: 0.14 }} />}
          {position && <Marker position={[position.latitude, position.longitude]} icon={userIcon}><Popup>আপনার বর্তমান অবস্থান</Popup></Marker>}
          {points.map((point) => <Marker key={point.id} position={[point.latitude, point.longitude]} icon={markerIcon}><Popup><strong>ডেলিভারি ঠিকানা</strong><br />চিহ্নিত: {new Date(point.capturedAt).toLocaleString("bn-BD")}</Popup></Marker>)}
        </MapContainer>
        <button className="follow-location minimal-follow-location" aria-label="আমার বর্তমান অবস্থানে যান" onClick={() => locate(false)} disabled={status === "locating"}>{status === "locating" ? <RefreshCw className="spin" size={22} /> : <LocateFixed size={23} />}</button>
        {notice && <div className={`toast ${status === "error" ? "toast-error" : ""}`}>{status === "saved" ? <Check size={19} /> : <MapPin size={19} />}<span>{notice}</span><button onClick={() => setNotice("")}><X size={17} /></button></div>}
        <div className="minimal-action-bar"><button className="primary-action mark-current-button" onClick={() => locate(true)} disabled={status === "locating" || status === "saving"}>{status === "locating" ? <RefreshCw className="spin" size={21} /> : <MapPin size={21} />}{status === "locating" ? "বর্তমান অবস্থান খোঁজা হচ্ছে…" : "বর্তমান ঠিকানা চিহ্নিত করুন"}</button></div>
      </section>
    </main>
    {showConfirm && <div className="modal-backdrop" onMouseDown={() => setShowConfirm(false)}><div className="confirm-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" aria-label="বন্ধ করুন" onClick={() => setShowConfirm(false)}><X size={20} /></button><span className="confirm-pin"><MapPin size={28} /></span><h2>এই ডেলিভারি ঠিকানা চিহ্নিত করবেন?</h2><p>মানচিত্রে দেখানো জায়গাটি <strong>{user.postOffice} ({user.postcode})</strong>-এর অধীনে যোগ হবে।</p><div className="confirm-map-wrap"><MapContainer key={`${position.latitude}-${position.longitude}`} center={[position.latitude, position.longitude]} zoom={19} className="confirm-map" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Circle center={[position.latitude, position.longitude]} radius={Math.max(position.accuracy, 5)} pathOptions={{ color: "#1479e8", weight: 1, fillColor: "#4c9df2", fillOpacity: 0.14 }} /><Marker position={[position.latitude, position.longitude]} icon={userIcon} /></MapContainer><span className={`map-accuracy-note ${position.accuracy <= 50 ? "good" : "warning"}`}><strong>{position.accuracy <= 20 ? "অবস্থানটি নির্ভুল" : position.accuracy <= 50 ? "অবস্থানটি মোটামুটি নির্ভুল" : "অবস্থানটি কম নির্ভুল"}</strong><small><b>{Math.round(position.accuracy).toLocaleString("bn-BD")} মিটার</b> পর্যন্ত ভুল হতে পারে</small></span></div><button className="confirm-button" onClick={confirmPoint} disabled={status === "saving"}>{status === "saving" ? "সংরক্ষণ হচ্ছে…" : "হ্যাঁ, ঠিকানাটি চিহ্নিত করুন"}</button><button className="cancel-button" onClick={() => setShowConfirm(false)}>বাতিল করুন</button></div></div>}
  </div>;
}
