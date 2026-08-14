import L from "leaflet";
import { Check, LocateFixed, LogOut, MapPin, Navigation, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import { Brand } from "../components/Brand.jsx";
import { getSavedPoints, saveDeliveryPoint } from "../api/deliveries.js";

const DHAKA = [23.7104, 90.4074];
const COVERAGE_HULL_EXPANSION = 1.55;
const markerIcon = L.divIcon({ className: "delivery-marker", html: '<span><svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>', iconSize: [38, 44], iconAnchor: [19, 42] });
const userIcon = L.divIcon({ className: "user-marker", html: "<span><i></i></span>", iconSize: [36, 36], iconAnchor: [18, 18] });

function createCoverageHull(points) {
  const uniquePoints = [...new Map(points.map(({ latitude, longitude }) => [
    `${latitude}:${longitude}`,
    { x: longitude, y: latitude },
  ])).values()].sort((a, b) => a.x - b.x || a.y - b.y);

  if (uniquePoints.length < 3) return [];

  const cross = (origin, a, b) =>
    (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  const buildHalf = (orderedPoints) => {
    const half = [];
    orderedPoints.forEach((point) => {
      while (half.length >= 2 && cross(half.at(-2), half.at(-1), point) <= 0) half.pop();
      half.push(point);
    });
    return half;
  };

  const lower = buildHalf(uniquePoints);
  const upper = buildHalf([...uniquePoints].reverse());
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  if (hull.length < 3) return [];

  const center = hull.reduce((total, point) => ({ x: total.x + point.x / hull.length, y: total.y + point.y / hull.length }), { x: 0, y: 0 });
  return hull.map(({ x, y }) => [
    center.y + (y - center.y) * COVERAGE_HULL_EXPANSION,
    center.x + (x - center.x) * COVERAGE_HULL_EXPANSION,
  ]);
}

function LiveMapController({ position, followRequest, liveTracking }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!position) return;
    const location = [position.latitude, position.longitude];
    if (!hasCentered.current) {
      map.flyTo(location, 18, { duration: 0.8 });
      hasCentered.current = true;
    } else if (liveTracking && map.getCenter().distanceTo(location) > 25) {
      map.panTo(location, { animate: true, duration: 0.8, easeLinearity: 0.2, noMoveStart: true });
    }
  }, [liveTracking, map, position]);

  useEffect(() => {
    if (position && followRequest > 0) map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 18), { duration: 0.6 });
  }, [followRequest, map, position]);

  return null;
}

function InitialPointsController({ points }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current || points.length === 0) return;
    map.fitBounds(points.map((point) => [point.latitude, point.longitude]), { padding: [45, 45], maxZoom: 18 });
    hasFitted.current = true;
  }, [map, points]);

  return null;
}

export function MapPage({ user, onLogout }) {
  const [points, setPoints] = useState(() => getSavedPoints().filter((point) => point.postcode === user.postcode));
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [followRequest, setFollowRequest] = useState(0);
  const [liveTracking, setLiveTracking] = useState(false);
  const watchId = useRef(null);
  const lastLivePosition = useRef(null);
  const confirmationOpen = useRef(false);
  const coverageHull = useMemo(() => createCoverageHull(points), [points]);

  useEffect(() => {
    confirmationOpen.current = showConfirm;
  }, [showConfirm]);

  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  function locationError(error) {
    setStatus("error");
    setNotice(error.code === error.PERMISSION_DENIED ? "ব্রাউজারে অবস্থানের অনুমতি বন্ধ আছে। সাইট সেটিংস থেকে Location অনুমতি চালু করুন।" : "বর্তমান অবস্থান পাওয়া যায়নি। খোলা জায়গায় গিয়ে আবার চেষ্টা করুন।");
  }

  function canUseLocation() {
    if (!window.isSecureContext) {
      setStatus("error");
      setNotice("নিরাপত্তার কারণে এই HTTP সংযোগে GPS চালু করা যাচ্ছে না। HTTPS ঠিকানা দিয়ে অ্যাপটি খুলুন।");
      return false;
    }
    if (!navigator.geolocation) {
      setStatus("error");
      setNotice("এই যন্ত্রে অবস্থান শনাক্ত করার সুবিধা নেই।");
      return false;
    }
    return true;
  }

  function locate(markAfterFinding = false) {
    if (!canUseLocation()) return;
    setStatus("locating"); setNotice("");
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, heading: coords.heading, speed: coords.speed, timestamp });
        setStatus("ready");
        setFollowRequest((value) => value + 1);
        if (markAfterFinding) {
          confirmationOpen.current = true;
          setShowConfirm(true);
        }
      },
      locationError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
  }

  function toggleLiveTracking() {
    if (liveTracking) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setLiveTracking(false);
      setStatus("ready");
      return;
    }
    if (!canUseLocation()) return;
    setStatus("locating");
    setNotice("");
    setLiveTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const reading = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, heading: coords.heading, speed: coords.speed, timestamp };
        const previous = lastLivePosition.current;
        if (previous) {
          const movement = L.latLng(previous.latitude, previous.longitude).distanceTo([reading.latitude, reading.longitude]);
          const accuracyImproved = reading.accuracy < previous.accuracy * 0.8;
          if (movement < 3 && !accuracyImproved) return;
          const smoothing = movement > 30 ? 1 : 0.35;
          reading.latitude = previous.latitude + (reading.latitude - previous.latitude) * smoothing;
          reading.longitude = previous.longitude + (reading.longitude - previous.longitude) * smoothing;
        }
        lastLivePosition.current = reading;
        if (!confirmationOpen.current) setPosition(reading);
        setStatus("tracking");
      },
      (error) => {
        watchId.current = null;
        setLiveTracking(false);
        locationError(error);
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
        <MapContainer center={DHAKA} zoom={15} maxZoom={21} className="field-map" zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} maxZoom={21} />
          <InitialPointsController points={points} />
          <LiveMapController position={position} followRequest={followRequest} liveTracking={liveTracking} />
          {coverageHull.length >= 3 && <Polygon positions={coverageHull} interactive={false} pathOptions={{ color: "#087a4b", weight: 3, opacity: 0.9, fillColor: "#21a16d", fillOpacity: 0.12, lineJoin: "round" }} />}
          {position && <Circle center={[position.latitude, position.longitude]} radius={Math.max(position.accuracy, 5)} pathOptions={{ color: "#1479e8", weight: 1, fillColor: "#4c9df2", fillOpacity: 0.14 }} />}
          {position && <Marker position={[position.latitude, position.longitude]} icon={userIcon}><Popup>আপনার বর্তমান অবস্থান</Popup></Marker>}
          {points.map((point) => <Marker key={point.id} position={[point.latitude, point.longitude]} icon={markerIcon}><Popup><strong>ডেলিভারি ঠিকানা</strong><br />চিহ্নিত: {new Date(point.capturedAt).toLocaleString("bn-BD")}</Popup></Marker>)}
        </MapContainer>
        <button className="follow-location minimal-follow-location" aria-label="আমার বর্তমান অবস্থানে যান" onClick={() => locate(false)} disabled={status === "locating"}>{status === "locating" ? <RefreshCw className="spin" size={22} /> : <LocateFixed size={23} />}</button>
        <button type="button" className={`live-tracking-circle ${liveTracking ? "active" : ""}`} onClick={toggleLiveTracking} aria-label={liveTracking ? "সরাসরি অবস্থান অনুসরণ বন্ধ করুন" : "সরাসরি অবস্থান অনুসরণ চালু করুন"} aria-pressed={liveTracking}><Navigation size={19} /><span /></button>
        {notice && <div className={`toast ${status === "error" ? "toast-error" : ""}`}>{status === "saved" ? <Check size={19} /> : <MapPin size={19} />}<span>{notice}</span><button onClick={() => setNotice("")}><X size={17} /></button></div>}
        <div className="minimal-action-bar"><button className="primary-action mark-current-button" onClick={() => locate(true)} disabled={status === "locating" || status === "saving"}>{status === "locating" ? <RefreshCw className="spin" size={21} /> : <MapPin size={21} />}{status === "locating" ? "বর্তমান অবস্থান খোঁজা হচ্ছে…" : "বর্তমান ঠিকানা চিহ্নিত করুন"}</button></div>
      </section>
    </main>
    {showConfirm && <div className="modal-backdrop" onMouseDown={() => setShowConfirm(false)}><div className="confirm-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" aria-label="বন্ধ করুন" onClick={() => setShowConfirm(false)}><X size={20} /></button><span className="confirm-pin"><MapPin size={28} /></span><h2>এই ডেলিভারি ঠিকানা চিহ্নিত করবেন?</h2><p>মানচিত্রে দেখানো জায়গাটি <strong>{user.postOffice} ({user.postcode})</strong>-এর অধীনে যোগ হবে।</p><div className="confirm-map-wrap"><MapContainer key={`${position.latitude}-${position.longitude}`} center={[position.latitude, position.longitude]} zoom={19} className="confirm-map" zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{points.map((point) => <Marker key={`confirm-${point.id}`} position={[point.latitude, point.longitude]} icon={markerIcon} />)}<Circle center={[position.latitude, position.longitude]} radius={Math.max(position.accuracy, 5)} pathOptions={{ color: "#1479e8", weight: 1, fillColor: "#4c9df2", fillOpacity: 0.14 }} /><Marker position={[position.latitude, position.longitude]} icon={userIcon} /></MapContainer><span className={`map-accuracy-note ${position.accuracy <= 50 ? "good" : "warning"}`}><strong>{position.accuracy <= 20 ? "অবস্থানটি নির্ভুল" : position.accuracy <= 50 ? "অবস্থানটি মোটামুটি নির্ভুল" : "অবস্থানটি কম নির্ভুল"}</strong><small><b>{Math.round(position.accuracy).toLocaleString("bn-BD")} মিটার</b> পর্যন্ত ভুল হতে পারে</small></span></div><button className="confirm-button" onClick={confirmPoint} disabled={status === "saving"}>{status === "saving" ? "সংরক্ষণ হচ্ছে…" : "হ্যাঁ, ঠিকানাটি চিহ্নিত করুন"}</button><button className="cancel-button" onClick={() => setShowConfirm(false)}>বাতিল করুন</button></div></div>}
  </div>;
}
