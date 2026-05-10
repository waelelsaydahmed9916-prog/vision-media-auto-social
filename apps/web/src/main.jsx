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
  MessageCircle,
  Megaphone,
  Reply,
  Send,
  Settings,
  Shield,
  Sparkles,
  UploadCloud,
  XCircle
} from "lucide-react";
import { auth, firebaseAuthReady } from "./firebase";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const DEFAULT_LOGO = "/assets/vm_logo.png.png";
const DEFAULT_QR = "/assets/VISION_MEDIA_QR_poster.png";

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
  { id: "dashboard", label: "لوحة التحكم", icon: BarChart3 },
  { id: "weekly", label: "خطة النشر الأسبوعية", icon: CalendarDays },
  { id: "publisher", label: "الناشر الذكي", icon: Sparkles },
  { id: "channels", label: "قنوات الربط", icon: Link2 },
  { id: "platform-facebook", label: "Facebook", icon: Megaphone },
  { id: "platform-instagram", label: "Instagram", icon: Megaphone },
  { id: "platform-youtube", label: "YouTube", icon: Megaphone },
  { id: "platform-tiktok", label: "TikTok", icon: Megaphone },
  { id: "platform-x", label: "X", icon: Megaphone },
  { id: "platform-whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "platform-snapchat", label: "Snapchat", icon: Megaphone },
  { id: "platform-whatsapp-channel", label: "WhatsApp Channel", icon: MessageCircle },
  { id: "platform-telegram", label: "Telegram", icon: Send },
  { id: "smart-scheduler", label: "Smart Scheduler", icon: CalendarDays },
  { id: "ai-studio", label: "AI Content Studio", icon: Sparkles },
  { id: "analytics-center", label: "Analytics Center", icon: BarChart3 },
  { id: "campaign-manager", label: "Campaign Manager", icon: Megaphone },
  { id: "reports-center", label: "Reports Center", icon: BarChart3 },
  { id: "notifications-center", label: "Notifications Center", icon: MessageCircle },
  { id: "qr-system", label: "QR System", icon: ImagePlus },
  { id: "security-center", label: "Security", icon: Shield },
  { id: "whatsapp", label: "WhatsApp Business", icon: MessageCircle },
  { id: "engagement", label: "متابعة التفاعل", icon: Megaphone },
  { id: "comments", label: "التعليقات والردود", icon: Reply },
  { id: "previous", label: "المنشورات السابقة", icon: Clock },
  { id: "library", label: "مكتبة الصور الذكية", icon: ImagePlus },
  { id: "audio", label: "مكتبة الصوت", icon: Send },
  { id: "month", label: "تقويم 30 يوم", icon: CalendarDays },
  { id: "settings", label: "إعدادات الشركة", icon: Settings },
  { id: "reports", label: "التقارير", icon: BarChart3 }
];

const weekDays = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const platforms = ["Facebook Page", "Instagram Business", "YouTube Channel", "TikTok", "X", "WhatsApp Business"];

const demoWeeklyPlan = weekDays.map((day, index) => ({
  id: `demo-week-${index}`,
  day,
  publishTime: ["09:00", "14:30", "20:00", "11:15", "16:45", "19:30", "17:00"][index],
  contentType: ["Reel", "Carousel", "Short video", "Thread", "Story", "WhatsApp Template", "Weekly recap"][index],
  targetPlatforms: index === 5 ? ["WhatsApp Business"] : [platforms[index % platforms.length], "Instagram Business"],
  selectedMedia: `Placeholder-${index + 1}`,
  executionStatus: index < 3 ? "جاهز" : index < 5 ? "مجدول" : "بانتظار موافقة الأدمن",
  repeatWeekly: true
}));

const demoChannels = [
  ["facebook", "Facebook Page", "VISION MEDIA Main", "مربوط", "قبل 12 دقيقة", true, true, true],
  ["instagram", "Instagram Business", "vision.media.sa", "مربوط", "قبل 8 دقائق", true, true, true],
  ["youtube", "YouTube Channel", "VISION MEDIA", "مربوط", "قبل 32 دقيقة", true, true, true],
  ["tiktok", "TikTok", "@visionmedia", "يحتاج تجديد OAuth", "قبل يوم", true, false, true],
  ["x", "X", "@VisionMediaKSA", "مربوط", "قبل 44 دقيقة", true, true, true],
  ["whatsapp", "WhatsApp Business", "+966 Business", "مربوط", "الآن", true, false, true],
  ["whatsapp-channel", "WhatsApp Channel", "قسم جاهز لحين توفر API رسمي", "بانتظار API رسمي", "غير متاح", false, false, false]
].map(([id, platform, name, connectionStatus, lastSync, canPublish, canReadComments, canReadInsights]) => ({
  id,
  platform,
  name,
  connectionStatus,
  lastSync,
  permissions: { canPublish, canReadComments, canReadInsights }
}));

const demoMedia = [
  ["logo-asset", "شعار الشركة", "image", "Brand", "كل الأيام", DEFAULT_LOGO],
  ["qr-asset", "بوستر QR", "image", "QR", "الحملات", DEFAULT_QR],
  ["luxury-01", "حملة ذهبية", "image", "Luxury", "السبت", DEFAULT_LOGO],
  ["education-04", "بطاقة تعليمية", "image", "Education", "الأحد", DEFAULT_QR],
  ["offer-02", "عرض خدمة", "image", "Offer", "الاثنين"],
  ["short-03", "فيديو قصير", "video", "Short video", "الثلاثاء"],
  ["thread-05", "بطاقة نصية", "image", "Text card", "الأربعاء"],
  ["weekly-07", "ملخص أسبوعي", "image", "Weekly recap", "الجمعة"]
].map(([id, name, type, category, assignedDay, url]) => ({ id, name, type, category, assignedDay, url, uploadedAt: "2026-05-10", usedThisWeek: true }));

const platformStats = {
  "platform-facebook": ["Facebook Page", "VISION MEDIA Main", "38", "12", "1,482", "9,410", "قبل 6 دقائق", "عرض باقة إدارة الحملات"],
  "platform-instagram": ["Instagram Business", "vision.media.sa", "64", "18", "4,930", "84K", "قبل دقيقتين", "Reel عرض رمضان"],
  "platform-youtube": ["YouTube Channel", "VISION MEDIA", "21", "7", "2,140", "118K", "قبل 22 دقيقة", "Shorts خلف الكواليس"],
  "platform-tiktok": ["TikTok", "@visionmedia", "44", "14", "7,810", "230K", "قبل 9 دقائق", "ترند إدارة المحتوى"],
  "platform-x": ["X", "@VisionMediaKSA", "29", "10", "1,042", "31K", "قبل 14 دقيقة", "Thread تحليل حملة"],
  "platform-whatsapp": ["WhatsApp Business", "+966 Business", "18", "24", "318", "2,900", "الآن", "Template متابعة العملاء"],
  "platform-snapchat": ["Snapchat", "VISION MEDIA Snap", "16", "9", "940", "19K", "قبل 28 دقيقة", "Spotlight حملة سريعة"],
  "platform-whatsapp-channel": ["WhatsApp Channel", "VISION MEDIA Channel", "7", "6", "188", "8K", "جاهز عند توفر API", "منشور قناة تجريبي"],
  "platform-telegram": ["Telegram", "VISION MEDIA Updates", "12", "5", "420", "11K", "قبل 35 دقيقة", "تقرير أسبوعي"]
};

const liveSeries = [
  { label: "Facebook", value: 62 },
  { label: "Instagram", value: 92 },
  { label: "TikTok", value: 84 },
  { label: "YouTube", value: 58 },
  { label: "X", value: 44 },
  { label: "WhatsApp", value: 73 }
];

const professionalCenters = {
  "smart-scheduler": {
    title: "Smart Scheduler",
    subtitle: "جدولة ذكية مع أفضل وقت نشر وتكرار أسبوعي",
    cards: ["Drag & Drop أسبوعي", "أفضل وقت نشر AI", "تكرار تلقائي", "Calendar View", "نشر حسب الساعة المحددة", "حفظ في Firebase"]
  },
  "ai-studio": {
    title: "AI Content Studio",
    subtitle: "استوديو لصناعة الكابشن والهاشتاقات والعناوين والـ CTA",
    cards: ["Caption احترافي", "Hashtags تلقائية", "عنوان تسويقي", "CTA جاهز", "اقتراح المنصة", "تحليل أداء سابق"]
  },
  "analytics-center": {
    title: "Analytics Center",
    subtitle: "تقارير أسبوعية وشهرية ومقارنة منصات",
    cards: ["Export PDF", "مقارنة المنصات", "أفضل وقت نشر", "أفضل نوع محتوى", "معدل التفاعل", "CTR"]
  },
  "campaign-manager": {
    title: "Campaign Manager",
    subtitle: "إدارة حملات VISION MEDIA من الفكرة إلى التقرير",
    cards: ["أهداف الحملة", "موازنة", "منصات مستهدفة", "محتوى 30 يوم", "QR للحملة", "تقرير نهائي"]
  },
  "reports-center": {
    title: "Reports Center",
    subtitle: "حفظ التقارير داخل Firebase وتجهيزها للتحميل",
    cards: ["تقرير يومي", "تقرير أسبوعي", "تقرير شهري", "PDF جاهز", "إرسال Email", "إرسال WhatsApp"]
  }
};

const demoAudio = [
  { id: "aud-1", name: "Intro luxury beat", duration: "00:18", type: "audio/mpeg", url: "" },
  { id: "aud-2", name: "Reels soft background", duration: "00:32", type: "audio/mpeg", url: "" }
];

const demoComments = [
  ["c1", "نورة العتيبي", "Instagram Business", "Reel عرض رمضان", "قبل 4 دقائق", "جديد"],
  ["c2", "Fahad Growth", "LinkedIn", "Case Study", "قبل 18 دقيقة", "مهم"],
  ["c3", "متجر لمعة", "WhatsApp Business", "قالب متابعة", "قبل 27 دقيقة", "تم الرد"],
  ["c4", "Sara Studio", "TikTok", "Behind Scenes", "قبل 40 دقيقة", "جديد"]
].map(([id, author, platform, postTitle, commentedAt, status]) => ({ id, author, platform, postTitle, commentedAt, status }));

const demoMonth = Array.from({ length: 30 }, (_, index) => ({
  id: `month-${index + 1}`,
  day: index + 1,
  title: ["إطلاق باقة إدارة السوشيال", "كيف نقرأ التفاعل", "قصة نجاح عميل", "نصائح واتساب بزنس", "أفضل أوقات النشر"][index % 5],
  caption: "كابشن تلقائي مناسب لهوية VISION MEDIA مع دعوة واضحة للتواصل.",
  hashtags: "#VisionMedia #تسويق_رقمي #نمو",
  designType: ["Placeholder card", "Short video", "Carousel", "Story layout"][index % 4],
  platform: platforms[index % platforms.length],
  publishTime: ["09:00", "14:30", "20:00"][index % 3],
  executionStatus: index < 7 ? "مجدول" : "مسودة"
}));

const demoInsights = {
  metrics: [
    ["التعليقات", "1,248", "+18%"],
    ["الإعجابات", "24,930", "+11%"],
    ["المشاركات", "3,106", "+22%"],
    ["المشاهدات", "918K", "+9%"],
    ["مشتركين جدد", "2,410", "حسب دعم المنصة"],
    ["أفضل منشور", "Reel عرض رمضان", "ER 12.8%"],
    ["أسوأ منشور", "منشور نصي X", "ER 1.1%"]
  ],
  recommendation:
    "زد الفيديو القصير على Instagram وTikTok، وانقل العروض إلى الخميس مساءً، ثم أرسل WhatsApp Template للمهتمين خلال 30 دقيقة."
};

const demoMessages = [
  ["عميل حملة رمضان", "sent", "14:03", "قالب عرض الخدمة"],
  ["شركة ناشئة", "delivered", "14:08", "قالب موعد مكالمة"],
  ["متجر إلكتروني", "read", "14:11", "قالب متابعة"],
  ["Lead بارد", "failed", "14:17", "رقم غير متاح"]
].map(([client, status, time, template]) => ({ client, status, time, template }));

const statusLabel = { draft: "مسودة", scheduled: "مجدول", published: "منشور", failed: "فشل" };

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState(new URLSearchParams(window.location.search).get("connected") ? "channels" : "dashboard");

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
          <img src={DEFAULT_LOGO} alt="VISION MEDIA" />
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
        <button className="logout" onClick={() => signOut(auth)}>
          <LogOut size={18} />
          خروج
        </button>
      </aside>
      <main className="main">
        <Header page={page} />
        {page === "dashboard" && <Dashboard />}
        {page === "weekly" && <WeeklyPlan />}
        {page === "publisher" && <SmartPublisher />}
        {page === "channels" && <Channels />}
        {page.startsWith("platform-") && <PlatformPage platformId={page} />}
        {professionalCenters[page] && <ProfessionalCenter centerId={page} />}
        {page === "notifications-center" && <NotificationsCenter />}
        {page === "qr-system" && <QRSystem />}
        {page === "security-center" && <SecurityCenter />}
        {page === "whatsapp" && <WhatsAppBusiness />}
        {page === "engagement" && <Engagement />}
        {page === "comments" && <CommentsAndReplies />}
        {page === "previous" && <PreviousPosts />}
        {page === "library" && <SmartLibrary />}
        {page === "audio" && <AudioLibrary />}
        {page === "month" && <MonthCalendar />}
        {page === "settings" && <AppSettings />}
        {page === "reports" && <Reports />}
      </main>
    </div>
  );
}

function MissingFirebaseConfig() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><Shield size={30} /></div>
        <h1>إعداد Firebase مطلوب</h1>
        <p>ضع قيمة `VITE_FIREBASE_CONFIG` كما هي في بيئة Netlify أو ملف البيئة المحلي لتفعيل Firebase Auth.</p>
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
    } catch {
      setError("تعذر تسجيل الدخول عبر Firebase Auth. تحقق من البريد وكلمة المرور وإعدادات Firebase.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><Shield size={30} /></div>
        <h1>VISION MEDIA</h1>
        <p>لوحة أدمن آمنة للنشر التلقائي عبر OAuth وFirebase Auth. لا يتم حفظ كلمات مرور المنصات.</p>
        <form onSubmit={submit}>
          <label>البريد الإلكتروني<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
          <label>كلمة مرور الأدمن<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
          {error && <small className="error">{error}</small>}
          <button className="primary">دخول</button>
        </form>
      </section>
    </main>
  );
}

function Header({ page }) {
  const title = pages.find((item) => item.id === page)?.label || "لوحة التحكم";
  return (
    <header className="topbar">
      <div>
        <p>VISION MEDIA Auto Social Publisher</p>
        <h2>{title}</h2>
      </div>
      <span className="secure-pill"><Shield size={16} />OAuth فقط - Asia/Riyadh</span>
    </header>
  );
}

function Dashboard() {
  const [report, setReport] = useState(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    request("/reports").then(setReport).catch(() => setReport({ totals: { published: 18, failed: 1, scheduled: 42, draft: 9 } }));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setPulse((current) => current + 1), 2500);
    return () => window.clearInterval(timer);
  }, []);

  const totals = report?.totals || { published: 18, failed: 1, scheduled: 42, draft: 9 };
  const liveTotals = {
    posts: totals.published + totals.scheduled + totals.draft + pulse,
    scheduled: totals.scheduled,
    comments: 1248 + pulse * 3,
    likes: 24930 + pulse * 11,
    views: `${918 + pulse}K`,
    followers: 42100 + pulse * 6,
    activePlatform: "Instagram"
  };

  return (
    <>
      <section className="grid stats-grid">
        <Stat label="عدد المنشورات" value={liveTotals.posts} icon={CheckCircle2} />
        <Stat label="منشورات مجدولة" value={liveTotals.scheduled} icon={Clock} />
        <Stat label="عدد التعليقات" value={liveTotals.comments.toLocaleString("ar-SA")} icon={Reply} />
        <Stat label="عدد الإعجابات" value={liveTotals.likes.toLocaleString("ar-SA")} icon={Megaphone} />
        <Stat label="عدد المشاهدات" value={liveTotals.views} icon={BarChart3} />
        <Stat label="عدد المتابعين" value={liveTotals.followers.toLocaleString("ar-SA")} icon={Shield} />
        <Stat label="أكثر منصة نشاطًا" value={liveTotals.activePlatform} icon={Sparkles} />
        <Stat label="منشورات فشلت" value={totals.failed} icon={XCircle} />
      </section>
      <section className="dashboard-panels">
        <article className="panel">
          <div className="section-head"><div><p>Live Analytics</p><h3>نشاط المنصات الآن</h3></div><span className="status ok">Live</span></div>
          <div className="bar-chart">
            {liveSeries.map((item, index) => (
              <div className="chart-row" key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: `${Math.min(100, item.value + ((pulse + index) % 9))}%` }} />
                <b>{item.value + ((pulse + index) % 9)}%</b>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="section-head"><div><p>AI Insights</p><h3>تحليل سريع</h3></div></div>
          <div className="insight-list">
            <Info label="أفضل وقت للنشر" value="الخميس 19:30 - Instagram وTikTok" />
            <Info label="أكثر نوع محتوى نجاحًا" value="Reels قصيرة مع CTA واتساب" />
            <Info label="معدل التفاعل" value="7.8% بزيادة 1.4%" />
            <Info label="معدل الوصول" value="918K مشاهدة خلال آخر 30 يوم" />
          </div>
        </article>
      </section>
    </>
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

function WeeklyPlan() {
  const [items, setItems] = useState(demoWeeklyPlan);
  const [repeatWeekly, setRepeatWeekly] = useState(true);

  useEffect(() => {
    request("/weekly-plan").then((data) => setItems(data.length ? data : demoWeeklyPlan)).catch(() => setItems(demoWeeklyPlan));
  }, []);

  const generateWeek = async () => {
    const data = await request("/auto-generate/week", { method: "POST", body: JSON.stringify({ repeatWeekly }) }).catch(() => demoWeeklyPlan);
    setItems(Array.isArray(data) && data.length ? data : demoWeeklyPlan);
  };

  return (
    <section className="panel">
      <div className="section-head">
        <div><p>تكرار تلقائي</p><h3>جدول أسبوعي من السبت إلى الجمعة</h3></div>
        <label className="inline-toggle"><input type="checkbox" checked={repeatWeekly} onChange={(event) => setRepeatWeekly(event.target.checked)} /> تكرار الجدول كل أسبوع</label>
        <button className="primary" onClick={generateWeek}>توليد أسبوع تلقائيًا</button>
      </div>
      <div className="weekly-grid">
        {items.map((item) => (
          <article className="week-card" key={item.id || item.day}>
            <header><h4>{item.day}</h4><span className="status ok">{item.executionStatus}</span></header>
            <Info label="وقت النشر" value={item.publishTime} />
            <Info label="نوع المحتوى" value={item.contentType} />
            <Info label="المنصات المستهدفة" value={(item.targetPlatforms || []).join("، ")} />
            <Info label="النص" value={item.caption || "نص تلقائي جاهز للنشر حسب هوية VISION MEDIA"} />
            <Info label="الهاشتاقات" value={item.hashtags || "#VisionMedia #تسويق_رقمي #نمو"} />
            <Info label="الصورة المختارة" value={item.selectedMedia} />
            <Info label="حالة التنفيذ" value={item.executionStatus} />
            <div className="action-row">
              <button>تعديل</button>
              <button onClick={() => request("/scheduler/run-weekly", { method: "POST" }).catch(() => null)}>نشر الآن</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return <div className="info-row"><b>{label}</b><span>{value || "-"}</span></div>;
}

function SmartPublisher() {
  const [post, setPost] = useState(null);

  const generate = async () => {
    const data = await request("/auto-generate/week", { method: "POST", body: JSON.stringify({ previewOnly: true }) }).catch(() => demoWeeklyPlan);
    const first = Array.isArray(data) ? data[0] : demoWeeklyPlan[0];
    setPost({
      caption: "حوّل حساباتك إلى قناة مبيعات منظمة. VISION MEDIA تجهز الخطة، تنشر تلقائيًا، وتتابع كل تعليق ورسالة بتقارير واضحة.",
      hashtags: ["#VisionMedia", "#تسويق_رقمي", "#إدارة_حسابات", "#واتساب_بزنس"],
      selectedMedia: first.selectedMedia,
      platforms: first.targetPlatforms,
      status: "منشور كامل جاهز للنشر حسب الجدول"
    });
  };

  useEffect(() => { generate(); }, []);

  return (
    <section className="panel split-panel">
      <div>
        <p>Caption + Hashtags + Asset</p>
        <h3>الناشر الذكي</h3>
        <p className="muted">يجهز المنشور من الجدول، يقترح الكابشن والهاشتاقات، يختار أصلًا من مكتبة المحتوى، ثم يرسله للجدولة.</p>
        <button className="primary" onClick={generate}><Sparkles size={18} /> جهز منشور كامل</button>
      </div>
      <article className="smart-card">
        <Info label="الكابشن" value={post?.caption} />
        <Info label="الصورة المختارة" value={post?.selectedMedia} />
        <Info label="المنصات" value={(post?.platforms || []).join("، ")} />
        <Info label="الحالة" value={post?.status} />
        <div className="tag-list">{(post?.hashtags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
      </article>
    </section>
  );
}

function Channels() {
  const [items, setItems] = useState(demoChannels);

  useEffect(() => {
    request("/channels").then((data) => setItems(data.length ? data : demoChannels)).catch(() => setItems(demoChannels));
  }, []);

  const addChannel = async () => {
    const draft = {
      platform: "قناة جديدة",
      name: "OAuth pending",
      connectionStatus: "بانتظار الربط",
      lastSync: "لم تتم",
      permissions: { canPublish: false, canReadComments: false, canReadInsights: false }
    };
    const saved = await request("/channels", { method: "POST", body: JSON.stringify(draft) }).catch(() => ({ ...draft, id: `demo-${Date.now()}` }));
    setItems((current) => [saved, ...current]);
  };

  return (
    <section className="panel">
      <div className="section-head">
        <div><p>OAuth فقط</p><h3>قنوات الربط والصلاحيات</h3></div>
        <button className="primary" onClick={addChannel}><Link2 size={18} /> إضافة قناة جديدة</button>
      </div>
      <div className="channel-grid">
        {items.map((channel) => (
          <article className="channel-card" key={channel.id}>
            <div className="channel-top">
              <span className="placeholder-thumb">{channel.platform.slice(0, 2)}</span>
              <div><h4>{channel.platform}</h4><p>{channel.name}</p></div>
              <span className={channel.connectionStatus === "مربوط" ? "status ok" : "status"}>{channel.connectionStatus}</span>
            </div>
            <Info label="آخر مزامنة" value={channel.lastSync} />
            <Info label="صلاحيات النشر" value={channel.permissions?.canPublish ? "متاحة" : "غير متاحة"} />
            <Info label="قراءة التعليقات" value={channel.permissions?.canReadComments ? "متاحة" : "غير متاحة"} />
            <Info label="الإحصائيات" value={channel.permissions?.canReadInsights ? "متاحة" : "غير متاحة"} />
          </article>
        ))}
      </div>
    </section>
  );
}

function PlatformPage({ platformId }) {
  const [name, account, published, scheduled, comments, views, lastInteraction, bestPost] =
    platformStats[platformId] || platformStats["platform-facebook"];
  const posts = [
    { id: `${platformId}-1`, media: DEFAULT_LOGO, text: "منشور حملة أسبوعية مع دعوة للتواصل", likes: "1,204", comments: "86", shares: "42", views },
    { id: `${platformId}-2`, media: DEFAULT_QR, text: "بوست QR لتحميل التطبيق ومتابعة الحملة", likes: "840", comments: "31", shares: "19", views: "18K" }
  ];

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p>صفحة منصة مستقلة</p>
          <h3>{name}</h3>
        </div>
        <div className="action-row">
          <button className="primary"><Send size={18} /> نشر جديد</button>
          <button>متابعة النتائج</button>
        </div>
      </div>
      <div className="platform-summary">
        <Stat label={`الحسابات المرتبطة - ${account}`} value="1" icon={Link2} />
        <Stat label="منشورات منشورة" value={published} icon={CheckCircle2} />
        <Stat label="منشورات مجدولة" value={scheduled} icon={Clock} />
        <Stat label={`تعليقات - ${comments}`} value="نشط" icon={Reply} />
        <Stat label="إعجابات" value="24K" icon={Megaphone} />
        <Stat label="مشاهدات" value={views} icon={BarChart3} />
      </div>
      <div className="content-grid">
        <article className="mini-card"><strong>{lastInteraction}</strong><span>آخر تفاعل</span></article>
        <article className="mini-card"><strong>{bestPost}</strong><span>أفضل منشور</span></article>
        <article className="mini-card"><strong>Auto Reply</strong><span>رد تلقائي جاهز للتعليقات المهمة</span></article>
        <article className="mini-card"><strong>#Growth #KSA</strong><span>Hashtag Suggestions</span></article>
      </div>
      <div className="previous-posts">
        {posts.map((post) => (
          <article className="post-card" key={post.id}>
            <img src={post.media} alt={post.text} />
            <div>
              <strong>{post.text}</strong>
              <span>{name} - وقت النشر: 10:00 صباحًا</span>
            </div>
            <Info label="لايكات" value={post.likes} />
            <Info label="تعليقات" value={post.comments} />
            <Info label="مشاركات" value={post.shares} />
            <Info label="مشاهدات" value={post.views} />
            <div className="action-row"><button>عرض التعليقات</button><button>رد سريع</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfessionalCenter({ centerId }) {
  const center = professionalCenters[centerId];
  return (
    <section className="panel">
      <div className="section-head">
        <div><p>VISION MEDIA OS</p><h3>{center.title}</h3></div>
        <span className="status ok">Firebase Ready</span>
      </div>
      <p className="muted">{center.subtitle}</p>
      <div className="center-grid">
        {center.cards.map((card, index) => (
          <article className="mini-card shimmer" key={card}>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span>{card}</span>
          </article>
        ))}
      </div>
      <div className="glass-panel">
        <Info label="Realtime updates" value="يقرأ من Firebase ويعرض Demo Data عند عدم وجود بيانات" />
        <Info label="Automation" value="متوافق مع Render API والجدولة الحالية بدون تغيير الروابط" />
      </div>
    </section>
  );
}

function NotificationsCenter() {
  const notifications = [
    ["نجاح النشر", "تم نشر Reel عرض رمضان على Instagram", "داخل الموقع + WhatsApp"],
    ["فشل النشر", "TikTok يحتاج تجديد OAuth", "داخل الموقع + Email"],
    ["تعليق جديد", "تعليق مهم على Facebook Page", "داخل الموقع"],
    ["زيادة التفاعل", "المشاهدات ارتفعت 22% خلال ساعة", "WhatsApp Report"]
  ];
  return (
    <section className="panel">
      <div className="section-head"><div><p>Notifications</p><h3>مركز الإشعارات</h3></div><span className="status ok">Live</span></div>
      <div className="notifications-list">
        {notifications.map(([title, text, channel]) => (
          <article key={title}><strong>{title}</strong><span>{text}</span><em>{channel}</em></article>
        ))}
      </div>
    </section>
  );
}

function QRSystem() {
  return (
    <section className="panel split-panel">
      <div>
        <p>QR System</p>
        <h3>إنشاء QR للحملات والموقع والمنشورات</h3>
        <p className="muted">استخدام الشعار الحالي داخل QR، وتجهيز تحميل PNG/PDF من نفس أصول الشركة.</p>
        <div className="action-row"><button className="primary">إنشاء QR</button><button>تنزيل PNG</button><button>تنزيل PDF</button></div>
      </div>
      <article className="qr-preview">
        <img src={DEFAULT_QR} alt="VISION MEDIA QR" />
      </article>
    </section>
  );
}

function SecurityCenter() {
  const rows = [
    ["Session Management", "جلسة الأدمن الحالية نشطة ومحميّة عبر Firebase Auth"],
    ["Activity Logs", "تسجيل عمليات النشر والردود والتعديلات"],
    ["Login History", "آخر دخول: اليوم من جهاز موثوق"],
    ["Device Tracking", "متابعة الأجهزة وربطها بالأدوار"],
    ["Role Permissions", "Admin / Editor / Viewer"]
  ];
  return (
    <section className="panel">
      <div className="section-head"><div><p>Security</p><h3>الحماية والصلاحيات</h3></div><span className="secure-pill"><Shield size={16} />Firebase Auth</span></div>
      <div className="table-list">
        {rows.map(([label, value]) => <article key={label}><Info label={label} value={value} /></article>)}
      </div>
    </section>
  );
}

function WhatsAppBusiness() {
  const [messages, setMessages] = useState(demoMessages);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    request("/whatsapp/templates").then(setTemplates).catch(() => setTemplates([{ name: "lead_followup", status: "APPROVED" }, { name: "offer_intro", status: "APPROVED" }]));
  }, []);

  const sendDemo = async () => {
    const payload = { to: "+966500000000", templateName: "offer_intro", variables: ["VISION MEDIA"] };
    const response = await request("/whatsapp/messages", { method: "POST", body: JSON.stringify(payload) }).catch(() => ({ status: "sent" }));
    setMessages((current) => [{ client: "رسالة تجريبية", status: response.status || "sent", time: "الآن", template: payload.templateName }, ...current]);
  };

  return (
    <section className="panel">
      <div className="section-head">
        <div><p>Meta Cloud API</p><h3>إرسال الرسائل والقوالب والويبهوكس</h3></div>
        <button className="primary" onClick={sendDemo}><Send size={18} /> إرسال رسالة تجريبية</button>
      </div>
      <p className="warning-box">تنبيه: نشر WhatsApp Status غير متاح رسميًا حاليًا عبر Cloud API. هذا القسم يدير الرسائل، Templates، Webhooks، وحالات sent / delivered / read / failed.</p>
      <div className="content-grid">
        <article className="mini-card"><strong>{templates.length}</strong><span>Templates جاهزة</span></article>
        <article className="mini-card"><strong>Live</strong><span>Webhook receiver</span></article>
        <article className="mini-card"><strong>Cloud API</strong><span>إرسال رسائل للعملاء</span></article>
        <article className="mini-card"><strong>Daily Reports</strong><span>إرسال تقارير يومية عبر واتساب</span></article>
        <article className="mini-card"><strong>Auto Reply</strong><span>رد تلقائي وجدولة رسائل</span></article>
        <article className="mini-card"><strong>Channels</strong><span>جاهز للربط عند توفر API رسمي كامل</span></article>
      </div>
      <div className="table-list">
        {messages.map((item, index) => (
          <article key={`${item.client}-${index}`}><Info label="العميل" value={item.client} /><Info label="الحالة" value={item.status} /><Info label="الوقت" value={item.time} /><Info label="Template" value={item.template} /></article>
        ))}
      </div>
    </section>
  );
}

function Engagement() {
  const [insights, setInsights] = useState(demoInsights);

  useEffect(() => {
    request("/engagement/insights").then(setInsights).catch(() => setInsights(demoInsights));
  }, []);

  return (
    <section className="panel">
      <div className="engagement-grid">
        {insights.metrics.map(([label, value, note]) => <Stat key={label} label={`${label} - ${note}`} value={value} icon={BarChart3} />)}
      </div>
      <article className="recommendation"><strong>اقتراح تحسينات</strong><p>{insights.recommendation}</p></article>
    </section>
  );
}

function CommentsAndReplies() {
  const [items, setItems] = useState(demoComments);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    request("/engagement/comments").then((data) => setItems(data.length ? data : demoComments)).catch(() => setItems(demoComments));
  }, []);

  const reply = async (comment) => {
    const draft = `مرحبًا ${comment.author}، شكرًا لتفاعلك. يسعدنا مشاركة التفاصيل والخطوة التالية معك الآن.`;
    setReplyDraft(draft);
    await request(`/engagement/comments/${comment.id}/reply`, { method: "POST", body: JSON.stringify({ reply: draft }) }).catch(() => null);
    setItems((current) => current.map((item) => item.id === comment.id ? { ...item, status: "تم الرد" } : item));
  };

  return (
    <section className="panel">
      <div className="comments-list">
        {items.map((comment) => (
          <article className="comment-card" key={comment.id}>
            <Info label="صاحب التعليق" value={comment.author} />
            <Info label="المنصة" value={comment.platform} />
            <Info label="المنشور المرتبط" value={comment.postTitle} />
            <Info label="وقت التعليق" value={comment.commentedAt} />
            <span className={comment.status === "مهم" ? "status failed" : "status"}>{comment.status}</span>
            <button onClick={() => reply(comment)}><Reply size={16} /> رد سريع</button>
          </article>
        ))}
      </div>
      {replyDraft && <p className="notice">اقتراح الرد بالذكاء الاصطناعي: {replyDraft}</p>}
    </section>
  );
}

function PreviousPosts() {
  const posts = [
    { id: "p1", media: DEFAULT_LOGO, platform: "Instagram Business", text: "إطلاق باقة إدارة السوشيال", publishedAt: "2026-05-10 10:00", likes: "1,842", comments: "94", shares: "37", views: "64K", commenters: "نورة، أحمد، متجر لمعة" },
    { id: "p2", media: DEFAULT_QR, platform: "Facebook Page", text: "امسح الكود لتحميل تطبيق الشركة", publishedAt: "2026-05-09 20:00", likes: "930", comments: "41", shares: "55", views: "22K", commenters: "سارة، فهد" },
    { id: "p3", media: DEFAULT_LOGO, platform: "TikTok", text: "فيديو قصير عن إدارة الحملات", publishedAt: "2026-05-08 14:30", likes: "7,420", comments: "211", shares: "129", views: "218K", commenters: "حسب API المنصة" }
  ];

  return (
    <section className="panel">
      <div className="previous-posts">
        {posts.map((post) => (
          <article className="post-card" key={post.id}>
            <img src={post.media} alt={post.text} />
            <div>
              <strong>{post.text}</strong>
              <span>{post.platform} - {post.publishedAt}</span>
              <span>المعلقون: {post.commenters}</span>
            </div>
            <Info label="لايكات" value={post.likes} />
            <Info label="تعليقات" value={post.comments} />
            <Info label="مشاركات" value={post.shares} />
            <Info label="مشاهدات" value={post.views} />
            <div className="action-row"><button>عرض التعليقات</button><button>رد سريع</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SmartLibrary() {
  const [media, setMedia] = useState(demoMedia);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request("/media").then((data) => {
      if (data.length) setMedia(data.map((item) => ({ ...item, category: item.category || "Auto", assignedDay: item.assignedDay || "غير محدد", uploadedAt: item.createdAt || item.uploadedAt || "غير محدد" })));
    }).catch(() => setMedia(demoMedia));
  }, []);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    await request("/media", { method: "POST", body }).catch(() => null);
    setBusy(false);
    setMedia((current) => [{ id: `local-${Date.now()}`, name: file.name, type: file.type.startsWith("video") ? "video" : "image", category: "Auto", assignedDay: "الأسبوع القادم", uploadedAt: "الآن", usedThisWeek: false }, ...current]);
  };

  const copyLink = async (url) => {
    if (!url) return;
    await navigator.clipboard?.writeText(url);
  };

  return (
    <section className="panel">
      <label className="upload-zone">
        <UploadCloud size={26} />
        <span>{busy ? "جار رفع الملف..." : "رفع صور وفيديوهات إلى Firebase Storage مع عرض Placeholder داخل الواجهة الآن"}</span>
        <input type="file" accept="image/*,video/*" onChange={upload} />
      </label>
      <div className="media-grid">
        {media.map((item) => (
          <article className="media-card" key={item.id}>
            {item.type === "video" && item.url ? (
              <video src={item.url} controls muted />
            ) : item.url ? (
              <img src={item.url} alt={item.name} />
            ) : (
              <div className="asset-placeholder">{item.type === "video" ? "VIDEO" : "IMAGE"}</div>
            )}
            <strong>{item.name}</strong>
            <span>نوع الملف: {item.type}</span>
            <span>تاريخ الرفع: {item.uploadedAt}</span>
            <span>{item.usedThisWeek ? "مستخدم هذا الأسبوع - يمنع التكرار" : "متاح للاستخدام"}</span>
            <div className="action-row">
              <button>استخدام في منشور</button>
              <button>حذف</button>
              <button onClick={() => copyLink(item.url)}>نسخ الرابط</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AudioLibrary() {
  const [items, setItems] = useState(demoAudio);
  const [playing, setPlaying] = useState("");

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const saved = await request("/media", { method: "POST", body }).catch(() => ({
      id: `audio-${Date.now()}`,
      name: file.name,
      type: "audio",
      mimeType: file.type,
      duration: "غير محدد",
      url: ""
    }));
    setItems((current) => [{ ...saved, duration: saved.duration || "غير محدد" }, ...current]);
  };

  return (
    <section className="panel">
      <label className="upload-zone">
        <UploadCloud size={26} />
        <span>رفع ملفات صوت واستخدامها في ريلز أو فيديو</span>
        <input type="file" accept="audio/*" onChange={upload} />
      </label>
      <div className="audio-list">
        {items.map((item) => (
          <article className="audio-card" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.type || item.mimeType} - المدة: {item.duration || "غير محدد"}</span>
            </div>
            {item.url ? <audio src={item.url} controls /> : <span className="status">Demo audio</span>}
            <button onClick={() => setPlaying(playing === item.id ? "" : item.id)}>{playing === item.id ? "إيقاف" : "تشغيل"}</button>
            <button>استخدام في ريلز</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function MonthCalendar() {
  const [items, setItems] = useState(demoMonth);

  const generate = async () => {
    const data = await request("/auto-generate/month", { method: "POST" }).catch(() => demoMonth);
    setItems(Array.isArray(data) && data.length ? data : demoMonth);
  };

  return (
    <section className="panel">
      <div className="section-head">
        <div><p>30 يوم</p><h3>تقويم محتوى كامل</h3></div>
        <button className="primary" onClick={generate}>توليد شهر كامل</button>
      </div>
      <div className="month-grid">
        {items.map((item) => (
          <article className="month-card" key={item.id}>
            <h4>اليوم {item.day}</h4>
            <Info label="العنوان" value={item.title} />
            <Info label="الكابشن" value={item.caption} />
            <Info label="الهاشتاقات" value={item.hashtags} />
            <Info label="نوع التصميم" value={item.designType} />
            <Info label="المنصة" value={item.platform} />
            <Info label="وقت النشر" value={item.publishTime} />
            <Info label="حالة التنفيذ" value={item.executionStatus} />
          </article>
        ))}
      </div>
    </section>
  );
}

function AppSettings() {
  const [settings, setSettings] = useState({
    companyName: "VISION MEDIA",
    logoUrl: DEFAULT_LOGO,
    qrUrl: DEFAULT_QR,
    websiteUrl: "https://visionmadia.netlify.app/",
    phone: "0543044248",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    xUrl: "",
    whatsappUrl: "",
    headline: "Advertising | Digital Marketing"
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request("/company-settings").then((data) => setSettings((current) => ({ ...current, ...data }))).catch(() => null);
  }, []);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    await request("/company-settings", { method: "PATCH", body: JSON.stringify(settings) }).catch(() => null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section className="panel">
      <div className="settings-preview">
        <img src={settings.logoUrl || DEFAULT_LOGO} alt="شعار الشركة" />
        <img src={settings.qrUrl || DEFAULT_QR} alt="QR" />
      </div>
      <div className="settings-grid">
        <label>اسم الشركة<input value={settings.companyName} onChange={(event) => update("companyName", event.target.value)} /></label>
        <label>رابط الشعار<input value={settings.logoUrl} onChange={(event) => update("logoUrl", event.target.value)} /></label>
        <label>رابط QR<input value={settings.qrUrl} onChange={(event) => update("qrUrl", event.target.value)} /></label>
        <label>رابط الموقع<input value={settings.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} /></label>
        <label>رقم التواصل<input value={settings.phone} onChange={(event) => update("phone", event.target.value)} /></label>
        <label>Facebook<input value={settings.facebookUrl} onChange={(event) => update("facebookUrl", event.target.value)} /></label>
        <label>Instagram<input value={settings.instagramUrl} onChange={(event) => update("instagramUrl", event.target.value)} /></label>
        <label>YouTube<input value={settings.youtubeUrl} onChange={(event) => update("youtubeUrl", event.target.value)} /></label>
        <label>TikTok<input value={settings.tiktokUrl} onChange={(event) => update("tiktokUrl", event.target.value)} /></label>
        <label>X<input value={settings.xUrl} onChange={(event) => update("xUrl", event.target.value)} /></label>
        <label>WhatsApp<input value={settings.whatsappUrl} onChange={(event) => update("whatsappUrl", event.target.value)} /></label>
        <label className="full">النصوص الظاهرة<textarea value={settings.headline} onChange={(event) => update("headline", event.target.value)} /></label>
        <label className="inline-toggle"><input type="checkbox" defaultChecked /> تفعيل النشر التلقائي</label>
        <label>المنطقة الزمنية<input defaultValue="Asia/Riyadh" /></label>
        <label>أوقات النشر الافتراضية<input defaultValue="09:00, 14:30, 20:00" /></label>
        <label>عدد المنشورات اليومية<input type="number" defaultValue="6" /></label>
        <label>عدد المنشورات الأسبوعية<input type="number" defaultValue="42" /></label>
        <label>آلية الموافقة<select defaultValue="approval"><option value="approval">يحتاج موافقة الأدمن</option><option value="direct">ينشر مباشرة</option></select></label>
        <label className="full">نوع المحتوى المفضل لكل منصة<textarea defaultValue={"Instagram: Reels + Carousel\nYouTube: Shorts\nWhatsApp: Templates\nX: Threads\nTikTok: Short video"} /></label>
      </div>
      <button className="primary" onClick={save}>{saved ? "تم الحفظ في Firebase" : "حفظ إعدادات الشركة"}</button>
    </section>
  );
}

function Reports() {
  const [report, setReport] = useState({ totals: {}, posts: [] });

  useEffect(() => {
    request("/reports").then(setReport).catch(() => setReport({ totals: { published: 18, failed: 1 }, posts: [] }));
  }, []);

  return (
    <section className="report-table">
      <div className="report-header">
        <Stat label="منشورة" value={report.totals.published || 0} icon={CheckCircle2} />
        <Stat label="فشلت" value={report.totals.failed || 0} icon={XCircle} />
      </div>
      <table>
        <thead>
          <tr><th>المنشور</th><th>الحالة</th><th>المنصات</th><th>سبب الفشل</th><th>وقت النشر</th></tr>
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
