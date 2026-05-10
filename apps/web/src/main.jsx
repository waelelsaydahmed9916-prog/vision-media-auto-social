import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImagePlus,
  Link2,
  LogOut,
  Megaphone,
  Send,
  Shield,
  UploadCloud,
  XCircle
} from "lucide-react";
import { auth, firebaseAuthReady } from "./firebase";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const request = async (path, options = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "حدث خطأ في الاتصال بالخادم");
  return data;
};

const pages = [
  { id: "dashboard", label: "الرئيسية", icon: BarChart3 },
  { id: "connections", label: "ربط المنصات", icon: Link2 },
  { id: "library", label: "مكتبة المحتوى", icon: ImagePlus },
  { id: "compose", label: "إنشاء بوست", icon: Send },
  { id: "calendar", label: "تقويم النشر", icon: CalendarDays },
  { id: "reports", label: "التقارير", icon: Megaphone }
];

const statusLabel = {
  draft: "مسودة",
  scheduled: "مجدول",
  published: "منشور",
  failed: "فشل",
  processing: "جار النشر"
};

const availablePublishPlatforms = [
  { id: "facebook", label: "Facebook", ready: true },
  { id: "instagram", label: "Instagram", ready: true },
  { id: "youtube", label: "YouTube", ready: true },
  { id: "tiktok", label: "TikTok لاحقًا", ready: false },
  { id: "x", label: "X لاحقًا", ready: false }
];

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState(new URLSearchParams(window.location.search).get("connected") ? "connections" : "dashboard");

  useEffect(() => {
    if (!firebaseAuthReady) {
      setCheckingAuth(false);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  if (checkingAuth) return <main className="login-page"><p className="notice">جار التحقق من الجلسة...</p></main>;
  if (!firebaseAuthReady) return <MissingFirebaseConfig />;
  if (!user) return <Login />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>VISION MEDIA</span>
          <strong>Auto Social Publisher</strong>
        </div>
        <nav>
          {pages.map((item) => {
            const Icon = item.icon;
            return (
              <button className={page === item.id ? "active" : ""} key={item.id} onClick={() => setPage(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          className="logout"
          onClick={() => signOut(auth)}
        >
          <LogOut size={18} />
          خروج
        </button>
      </aside>
      <main className="main">
        <Header page={page} />
        {page === "dashboard" && <Dashboard />}
        {page === "connections" && <Connections />}
        {page === "library" && <Library />}
        {page === "compose" && <Compose />}
        {page === "calendar" && <PublishCalendar />}
        {page === "reports" && <Reports />}
      </main>
    </div>
  );
}

function MissingFirebaseConfig() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark">
          <Shield size={30} />
        </div>
        <h1>إعداد Firebase مطلوب</h1>
        <p>ضع قيمة `VITE_FIREBASE_CONFIG` في `apps/web/.env` لتفعيل Firebase Auth وتشغيل لوحة الأدمن.</p>
      </section>
    </main>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (!auth) throw new Error("Firebase Auth is not configured.");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("تعذر تسجيل الدخول عبر Firebase Auth. تحقق من البريد وكلمة المرور وإعدادات Firebase.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark">
          <Shield size={30} />
        </div>
        <h1>VISION MEDIA</h1>
        <p>لوحة أدمن آمنة للنشر التلقائي عبر OAuth وFirebase Auth.</p>
        <form onSubmit={submit}>
          <label>
            البريد الإلكتروني
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            كلمة مرور الأدمن
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          {error && <small className="error">{error}</small>}
          <button className="primary">دخول</button>
        </form>
      </section>
    </main>
  );
}

function Header({ page }) {
  const title = pages.find((item) => item.id === page)?.label || "الرئيسية";
  return (
    <header className="topbar">
      <div>
        <p>VISION MEDIA Auto Social Publisher</p>
        <h2>{title}</h2>
      </div>
      <span className="secure-pill">
        <Shield size={16} />
        OAuth 2.0 فقط
      </span>
    </header>
  );
}

function Dashboard() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    request("/reports").then(setReport).catch(console.error);
  }, []);

  const totals = report?.totals || { published: 0, failed: 0, scheduled: 0, draft: 0 };
  return (
    <section className="grid stats-grid">
      <Stat label="منشورات منشورة" value={totals.published} icon={CheckCircle2} />
      <Stat label="منشورات فشلت" value={totals.failed} icon={XCircle} />
      <Stat label="منشورات مجدولة" value={totals.scheduled} icon={Clock} />
      <Stat label="مسودات" value={totals.draft} icon={Megaphone} />
    </section>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <article className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Connections() {
  const [data, setData] = useState({ providers: [], accounts: [] });
  const [message, setMessage] = useState("");

  const load = () => request("/oauth/providers").then(setData).catch((err) => setMessage(err.message));
  useEffect(load, []);

  const connect = async (provider) => {
    if (!provider.enabled) return;
    const path = provider.id === "youtube" ? "/oauth/youtube/start" : "/oauth/meta/start";
    const response = await request(path);
    window.location.href = response.url;
  };

  return (
    <section className="content-grid">
      {message && <p className="notice">{message}</p>}
      {data.providers.map((provider) => {
        const connected = data.accounts.filter((account) =>
          provider.id === "instagram" ? account.platform === "instagram" : account.platform === provider.id
        );
        return (
          <article className="platform-card" key={provider.id}>
            <div>
              <h3>{provider.name}</h3>
              <p>{provider.enabled ? "جاهز للربط عبر OAuth 2.0" : "لاحقًا"}</p>
            </div>
            <span className={connected.length ? "status ok" : "status"}>{connected.length ? "مرتبط" : "غير مرتبط"}</span>
            <button disabled={!provider.enabled} onClick={() => connect(provider)}>
              <Link2 size={17} />
              ربط الحساب
            </button>
          </article>
        );
      })}
    </section>
  );
}

function Library() {
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => request("/media").then(setMedia).catch(console.error);
  useEffect(load, []);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    await request("/media", { method: "POST", body }).finally(() => setBusy(false));
    load();
  };

  return (
    <section>
      <label className="upload-zone">
        <UploadCloud size={26} />
        <span>{busy ? "جار رفع الملف..." : "رفع صورة أو فيديو إلى Firebase Storage"}</span>
        <input type="file" accept="image/*,video/*" onChange={upload} />
      </label>
      <div className="media-grid">
        {media.map((item) => (
          <article className="media-card" key={item.id}>
            {item.type === "image" ? <img src={item.url} alt={item.name} /> : <video src={item.url} muted controls />}
            <strong>{item.name}</strong>
            <span>{item.type === "video" ? "فيديو" : "صورة"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Compose() {
  const [media, setMedia] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    text: "",
    hashtags: "",
    mediaId: "",
    platforms: ["facebook"],
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    status: "scheduled"
  });

  useEffect(() => {
    request("/media").then(setMedia).catch(console.error);
  }, []);

  const selectedMedia = useMemo(() => media.find((item) => item.id === form.mediaId), [media, form.mediaId]);
  const togglePlatform = (platform) => {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      media: selectedMedia ? { id: selectedMedia.id, url: selectedMedia.url, type: selectedMedia.type } : null
    };
    await request("/posts", { method: "POST", body: JSON.stringify(payload) });
    setMessage("تم حفظ المنشور بنجاح.");
  };

  return (
    <form className="compose" onSubmit={submit}>
      {message && <p className="notice">{message}</p>}
      <label>
        نص البوست
        <textarea value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} rows={6} />
      </label>
      <label>
        الهاشتاقات
        <input value={form.hashtags} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} placeholder="#VisionMedia #Marketing" />
      </label>
      <label>
        صورة أو فيديو
        <select value={form.mediaId} onChange={(event) => setForm({ ...form, mediaId: event.target.value })}>
          <option value="">بدون ملف</option>
          {media.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <div className="platform-picker">
        {availablePublishPlatforms.map((platform) => (
          <button
            type="button"
            disabled={!platform.ready}
            className={form.platforms.includes(platform.id) ? "selected" : ""}
            key={platform.id}
            onClick={() => platform.ready && togglePlatform(platform.id)}
            title={platform.ready ? "جاهز للنشر" : "يحتاج تفعيل API لاحقًا"}
          >
            {platform.label}
          </button>
        ))}
      </div>
      <div className="two-cols">
        <label>
          وقت النشر
          <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
        </label>
        <label>
          الحالة
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="scheduled">scheduled</option>
            <option value="draft">draft</option>
          </select>
        </label>
      </div>
      <button className="primary">
        <Send size={18} />
        حفظ وجدولة
      </button>
    </form>
  );
}

function PublishCalendar() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    request(`/posts/calendar?start=${start.toISOString()}&end=${end.toISOString()}`).then(setPosts).catch(console.error);
  }, []);

  return (
    <section className="timeline">
      {posts.map((post) => (
        <article key={post.id}>
          <time>{new Date(post.scheduledAt).toLocaleString("ar-SA")}</time>
          <strong>{post.text.slice(0, 90)}</strong>
          <span className={`status ${post.status}`}>{statusLabel[post.status]}</span>
        </article>
      ))}
      {!posts.length && <p className="empty">لا توجد منشورات في الأيام السبعة القادمة.</p>}
    </section>
  );
}

function Reports() {
  const [report, setReport] = useState({ totals: {}, posts: [] });

  useEffect(() => {
    request("/reports").then(setReport).catch(console.error);
  }, []);

  return (
    <section className="report-table">
      <div className="report-header">
        <Stat label="منشورة" value={report.totals.published || 0} icon={CheckCircle2} />
        <Stat label="فشلت" value={report.totals.failed || 0} icon={XCircle} />
      </div>
      <table>
        <thead>
          <tr>
            <th>المنشور</th>
            <th>الحالة</th>
            <th>المنصات</th>
            <th>سبب الفشل</th>
            <th>وقت النشر</th>
          </tr>
        </thead>
        <tbody>
          {report.posts.map((post) => (
            <tr key={post.id}>
              <td>{post.text?.slice(0, 80)}</td>
              <td><span className={`status ${post.status}`}>{statusLabel[post.status]}</span></td>
              <td>{post.platforms?.join(", ")}</td>
              <td>{post.failureReason || "-"}</td>
              <td>{post.publishedAt ? new Date(post.publishedAt).toLocaleString("ar-SA") : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
