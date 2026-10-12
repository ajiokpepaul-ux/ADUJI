import React, { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { createRoot } from "react-dom/client";
import {
  Activity, Bell, Bookmark, Check, ChevronDown, Clapperboard, Compass, Crown,
  Flame, Gamepad2, Heart, Home, ImagePlus, LogOut, Menu, MessageCircle,
  MoreHorizontal, Music2, Plus, Radio, Search, Send, Settings, Share2,
  ShieldCheck, Sparkles, TrendingUp, UploadCloud, UserRound, Users, Video,
  X, Zap, Play, Scissors, CircleDollarSign, BarChart3, WandSparkles
} from "lucide-react";
import "./styles.css";

const starterVideos = [
  { id: 1, user: "king_dray", name: "King Dray", verified: true, category: "Trending", caption: "Good energy, better days. ✨ #dance #vibes #aduji #fyp", sound: "Original Sound — king_dray", likes: 245600, comments: 4200, shares: 12800, views: "1.2M", duration: "0:24", poster: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=85", color: "sunset" },
  { id: 2, user: "lara_official", name: "Lara", verified: true, category: "Music", caption: "Late-night studio sessions 🎙️ What should I cover next?", sound: "Lara — Just Vibes", likes: 78200, comments: 1800, shares: 3100, views: "428K", duration: "0:38", poster: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85", color: "purple" },
  { id: 3, user: "zayplayz", name: "Zay Playz", verified: false, category: "Gaming", caption: "That last-second clutch was unreal 🔥 #gaming #CODM", sound: "Original Sound — zayplayz", likes: 98200, comments: 2300, shares: 6700, views: "1.2M", duration: "0:19", poster: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=85", color: "blue" },
  { id: 4, user: "anime_daily", name: "Anime Daily", verified: false, category: "Anime", caption: "The moment everything changed… ⚡ #anime #edit", sound: "Night Drive — slowed", likes: 151000, comments: 3900, shares: 18400, views: "1.5M", duration: "0:17", poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85", color: "red" },
  { id: 5, user: "travelwithtee", name: "Travel With Tee", verified: true, category: "Explore", caption: "A little reminder to see more of the world 🌍 Lagos, Nigeria", sound: "Golden Hour — instrumental", likes: 87600, comments: 940, shares: 5200, views: "876K", duration: "0:32", poster: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85", color: "green" },
  { id: 6, user: "mira_writes", name: "Mira Writes", verified: false, category: "Comedy", caption: "POV: you said ‘one more episode’ at 2am 😭", sound: "Original Sound — mira_writes", likes: 54300, comments: 1100, shares: 2200, views: "310K", duration: "0:28", poster: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85", color: "pink" }
];
const topics = ["For You", "Following", "Trending", "Music", "Gaming", "Anime", "Comedy", "Fashion"];

function compact(n) {
  if (typeof n === "string") return n;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(".0", "") + "K";
  return String(n);
}

function App() {
  const [videos, setVideos] = useState(starterVideos);
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [backendStatus, setBackendStatus] = useState(isSupabaseConfigured ? "Connecting to ADUJI cloud…" : "Demo mode — Supabase env vars missing");
  const [activeTopic, setActiveTopic] = useState("For You");
  const [page, setPage] = useState("Home");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [following, setFollowing] = useState(["travelwithtee"]);
  const [followed, setFollowed] = useState([]);
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [live, setLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState("Hanging out with the ADUJI community");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Trending");
  const [uploadFile, setUploadFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setBackendStatus("Cloud connection needs attention");
      setSession(data?.session ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    (async () => {
      const { data, error } = await supabase.from("videos")
        .select("id,user_id,caption,category,video_path,video_url,created_at")
        .eq("visibility", "public").eq("status", "published")
        .order("created_at", { ascending: false }).limit(40);
      if (!active) return;
      if (error) {
        setBackendStatus("Cloud configured — run supabase/schema.sql to enable the database");
        return;
      }
      if (data?.length) {
        const cloudVideos = data.map((row, index) => ({
          id: row.id, user: row.user_id, name: "ADUJI Creator", verified: false,
          category: row.category || "Trending", caption: row.caption || "",
          sound: "Original Sound", likes: 0, comments: 0, shares: 0, views: "New",
          duration: "Video", poster: row.video_url || "", fileUrl: row.video_url || "", color: "purple", cloud: true
        }));
        setVideos(prev => [...cloudVideos, ...prev.filter(v => !v.cloud)]);
      }
      setBackendStatus("Connected to ADUJI cloud");
    })();
    return () => { active = false; authListener?.subscription?.unsubscribe(); };
  }, []);

  const visibleVideos = useMemo(() => {
    let list = [...videos];
    if (page === "Following") list = list.filter(v => following.includes(v.user) || followed.includes(v.user));
    else if (page === "Saved") list = list.filter(v => saved.includes(v.id));
    else if (page === "Explore") list = list.sort((a,b) => b.likes - a.likes);
    else if (activeTopic !== "For You" && activeTopic !== "Following" && activeTopic !== "Trending") {
      list = list.filter(v => v.category.toLowerCase() === activeTopic.toLowerCase());
    } else if (activeTopic === "Trending") list = list.sort((a,b) => b.likes - a.likes);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => `${v.name} ${v.user} ${v.caption} ${v.category}`.toLowerCase().includes(q));
    }
    return list;
  }, [videos, page, following, followed, saved, activeTopic, search]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function toggleLike(id) {
    setLiked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setVideos(prev => prev.map(v => v.id === id ? { ...v, likes: v.likes + (liked.includes(id) ? -1 : 1) } : v));
  }
  function toggleFollow(user) {
    setFollowed(prev => prev.includes(user) ? prev.filter(x => x !== user) : [...prev, user]);
    notify(followed.includes(user) ? "Creator unfollowed" : "You're now following this creator");
  }
  async function uploadVideo(e) {
    e.preventDefault();
    if (!uploadFile) { notify("Choose a video file first"); return; }
    if (isSupabaseConfigured && !session) { setModal("auth"); notify("Sign in before publishing to the cloud"); return; }
    let cloudPath = localPreview;
    let cloudId = Date.now();
    if (isSupabaseConfigured && supabase && session) {
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      cloudPath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: storageError } = await supabase.storage.from("aduji-videos").upload(cloudPath, uploadFile, { contentType: uploadFile.type, upsert: false });
      if (storageError) { notify(`Upload failed: ${storageError.message}`); return; }
      const { data: publicData } = supabase.storage.from("aduji-videos").getPublicUrl(cloudPath);
      const { data: inserted, error: insertError } = await supabase.from("videos").insert({ user_id: session.user.id, caption: uploadTitle || "A new moment on ADUJI ✨", category: uploadCategory, video_path: cloudPath, video_url: publicData.publicUrl, visibility: "public", status: "published" }).select().single();
      if (insertError) { notify(`Video uploaded but database save failed: ${insertError.message}`); return; }
      cloudId = inserted.id;
      cloudPath = publicData.publicUrl;
    }
    const newVideo = {
      id: cloudId, user: session?.user?.id || "paul_aji", name: session?.user?.email?.split("@")[0] || "Paul Aji", verified: false,
      category: uploadCategory, caption: uploadTitle || "A new moment on ADUJI ✨",
      sound: "Original Sound — paul_aji", likes: 0, comments: 0, shares: 0,
      views: "0", duration: "New", poster: isSupabaseConfigured && session ? cloudPath : localPreview, fileUrl: isSupabaseConfigured && session ? cloudPath : localPreview, color: "purple", cloud: Boolean(isSupabaseConfigured && session)
    };
    setVideos(prev => [newVideo, ...prev]);
    setUploadTitle(""); setUploadFile(null); setLocalPreview(""); setModal("");
    setPage("Home"); setActiveTopic("For You"); notify(isSupabaseConfigured && session ? "Video published to ADUJI cloud" : "Video added to your local demo feed");
  }
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { notify("Please select a video file"); return; }
    setUploadFile(file);
    setLocalPreview(URL.createObjectURL(file));
  }
  async function submitAuth(e) {
    e.preventDefault();
    if (!supabase) { notify("Add Supabase environment variables first"); return; }
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (result.error) { notify(result.error.message); return; }
    if (authMode === "signup" && !result.data.session) notify("Check your email to confirm your account, then sign in");
    else { setSession(result.data.session); setModal(""); notify("You're signed in to ADUJI"); }
  }

  function startLive(e) {
    e.preventDefault();
    setLive(true); setModal(""); setPage("LIVE");
    notify("Live room opened in preview mode");
  }
  function nav(target) {
    setPage(target);
    if (target === "Home") setActiveTopic("For You");
    setMobileMenu(false);
  }
  const navItems = [
    [Home, "Home"], [Compass, "Explore"], [Users, "Following"], [Radio, "LIVE"],
    [UploadCloud, "Upload"], [MessageCircle, "Messages"], [UserRound, "Profile"]
  ];

  return <div className="app-shell">
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open menu"><Menu /></button>
      <button className="brand" onClick={() => nav("Home")}><span className="brand-mark">A</span><span className="brand-name">ADUJI</span><span className="brand-tagline">Real People. Real Stories. Endless Possibilities.</span></button>
      <div className="searchbar"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators, videos, sounds, topics..." /><kbd>↵</kbd></div>
      <div className="top-actions"><button className="icon-button notification" onClick={() => notify("You're all caught up")} aria-label="Notifications"><Bell size={20}/><i>3</i></button><button className="crown-button" onClick={() => setModal("premium")} aria-label="Premium"><Crown size={20}/></button><button className="profile-mini" onClick={() => isSupabaseConfigured && !session ? setModal("auth") : nav("Profile")}><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"/><span><b>Paul_Aji</b><small>Creator</small></span><ChevronDown size={15}/></button></div>
    </header>

    <div className="layout">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="nav-list">{navItems.map(([Icon, label]) => <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => label === "Upload" ? setModal("upload") : nav(label)}><Icon size={19}/><span>{label}</span>{label === "Messages" && <b className="unread">5</b>}</button>)}</div>
        <div className="side-divider"/>
        <div className="section-heading">YOUR CHANNELS <button onClick={() => setModal("channel")}><Plus size={17}/></button></div>
        {[["Paul_Aji","@ajiokpepaul","https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"],["AnimeVibes","@animevibes","https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=100&q=80"],["GamingHub","@gaminghub","https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80"],["TheRealTalk","@therealtalk","https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=100&q=80"]].map(c => <button className="channel" key={c[0]} onClick={() => nav("Profile")}><img src={c[2]}/><span><b>{c[0]}</b><small>{c[1]}</small></span></button>)}
        <button className="view-channels" onClick={() => nav("Profile")}>View all channels <span>→</span></button>
        <div className="premium-card"><Crown size={23}/><b>Go Premium</b><p>Unlock creator tools, exclusive features and more.</p><button onClick={() => setModal("premium")}>Explore Premium</button></div>
        <div className="sidebar-bottom"><ShieldCheck size={15}/> Community-first video</div>
      </aside>

      <main className="main-content">
        {page === "LIVE" ? <LivePage live={live} setLive={setLive} setModal={setModal} title={liveTitle} /> :
        page === "Profile" ? <ProfilePage videos={videos.filter(v => v.user === "paul_aji")} setModal={setModal} notify={notify}/> :
        page === "Messages" ? <MessagesPage notify={notify}/> :
        <><div className="topic-bar">{topics.map(t => <button key={t} className={activeTopic === t && page !== "Explore" ? "selected" : ""} onClick={() => {setPage(t === "Following" ? "Following" : "Home"); setActiveTopic(t);}}>{t}</button>)}<button className="more-topic" onClick={() => setModal("topics")}>More <ChevronDown size={14}/></button></div>
          <div className="feed-heading"><div><p className="eyebrow">{page === "Explore" ? "FIND YOUR NEXT FAVORITE" : page === "Following" ? "YOUR CREATOR CIRCLE" : page === "Saved" ? "YOUR COLLECTION" : "YOUR PERSONALIZED FEED"}</p><div className="cloud-status"><span className={isSupabaseConfigured ? "status-online" : "status-demo"}/>{backendStatus}</div><h1>{page === "Explore" ? "Explore ADUJI" : page === "Following" ? "Following" : page === "Saved" ? "Saved videos" : "For you"}<span className="live-dot"/></h1></div><button className="sort-button" onClick={() => {setActiveTopic("Trending"); setPage("Home");}}><TrendingUp size={16}/> Trending</button></div>
          {page === "Explore" && <div className="explore-hero"><div><span className="pill"><Sparkles size={13}/> DISCOVER SOMETHING NEW</span><h2>Every scroll brings<br/>a new perspective.</h2><p>Find fresh creators, ideas and communities worth following.</p></div><Compass size={76}/></div>}
          {visibleVideos.length ? <div className="video-grid">{visibleVideos.map(v => <VideoCard key={v.id} video={v} liked={liked.includes(v.id)} saved={saved.includes(v.id)} following={followed.includes(v.user) || following.includes(v.user)} onLike={() => toggleLike(v.id)} onSave={() => setSaved(p => p.includes(v.id) ? p.filter(x => x !== v.id) : [...p, v.id])} onFollow={() => toggleFollow(v.user)} onOpen={() => setActiveVideo(v)} onComment={() => {setActiveVideo(v); setModal("comments")}} onShare={() => {navigator.clipboard?.writeText(window.location.href); notify("Feed link copied (if clipboard permission is available)")}}/>)}</div> : <div className="empty-state"><Search size={30}/><h3>No videos found</h3><p>Try another search or explore a different category.</p><button className="primary-button" onClick={() => {setSearch(""); setActiveTopic("For You"); setPage("Home")}}>Back to For You</button></div>}
          <div className="load-more"><span/><p>You're all caught up for now</p><span/></div>
        </>}
      </main>

      <aside className="right-rail">
        <section className="rail-card"><div className="rail-title"><h3><Flame size={19} className="flame"/> Trending now</h3><button onClick={() => {setActiveTopic("Trending"); setPage("Home")}}>See all <span>›</span></button></div>{[["#AdujiChallenge","1.2M posts"],["#LagosVibes","856K posts"],["#AnimeEdit","642K posts"],["#CODM","521K posts"],["#BetterTogether","438K posts"]].map((t,i)=><button className="trend-row" key={t[0]} onClick={() => {setSearch(t[0].replace("#",""));setPage("Home")}}><b className="trend-number">{i+1}</b><span className={`trend-thumb thumb-${i}`}>{["✦","◉","ア","⚡","♡"][i]}</span><span className="trend-copy"><b>{t[0]}</b><small>{t[1]}</small></span><TrendingUp size={15} className="trend-arrow"/></button>)}</section>
        <section className="rail-card"><div className="rail-title"><h3><Sparkles size={18} className="gold"/> Emerging creators</h3><button onClick={() => nav("Explore")}>See all <span>›</span></button></div>{[["ZeeEditz","@zeeeditz","314K","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"],["MiraWrites","@mirawrites","198K","https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"],["ItsKamo","@itskamo","267K","https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"],["RexPlays","@rexplays","402K","https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"]].map(c=><div className="creator-row" key={c[0]}><img src={c[3]}/><span><b>{c[0]}</b><small>{c[1]} · {c[2]}</small></span><button className="follow-button" onClick={() => toggleFollow(c[1])}>{followed.includes(c[1]) ? <Check size={14}/> : "Follow"}</button></div>)}</section>
        <section className="rail-card analytics"><div className="rail-title"><h3><BarChart3 size={18}/> Creator snapshot</h3><button onClick={() => nav("Profile")}>Details ›</button></div><div className="metrics"><div><small>Views</small><b>1.4M</b><em>↑ 32%</em></div><div><small>Likes</small><b>124K</b><em>↑ 28%</em></div><div><small>Followers</small><b>12.6K</b><em>↑ 19%</em></div></div><p className="demo-note">Illustrative sample stats</p></section>
        <section className="create-card"><div className="create-art"><span>A</span><Sparkles/></div><h3>Create. Connect.<br/>Grow.</h3><p>ADUJI is more than an app. It's a place for your next big moment.</p><button onClick={() => setModal("channel")}>Build your channel <span>→</span></button></section>
        <div className="rail-footer">About · Guidelines · Privacy · Terms<br/>© 2026 ADUJI · Prototype</div>
      </aside>
    </div>

    <nav className="mobile-nav">{[[Home,"Home"],[Compass,"Explore"],[Plus,"Upload"],[Radio,"LIVE"],[UserRound,"Profile"]].map(([I,n])=><button key={n} onClick={() => n==="Upload"?setModal("upload"):n==="LIVE"?setModal("live"):nav(n)}><I size={20}/><small>{n}</small></button>)}</nav>

    {modal && <Modal title={modal === "upload" ? "Upload a video" : modal === "live" ? "Go live on ADUJI" : modal === "channel" ? "Create your channel" : modal === "premium" ? "ADUJI Premium" : modal === "comments" ? "Video conversation" : modal === "topics" ? "Explore more topics" : modal === "auth" ? (authMode === "signup" ? "Create your ADUJI account" : "Sign in to ADUJI") : "ADUJI"} onClose={() => setModal("")}>
      {modal === "auth" && <form className="modal-form" onSubmit={submitAuth}><p className="modal-intro">Sign in to publish videos to the ADUJI cloud and keep your account data across devices.</p><label>Email address<input type="email" autoComplete="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} required minLength="6" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-button" type="submit">{authMode === "signup" ? "Create account" : "Sign in"}</button><button type="button" className="text-button" onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}>{authMode === "signup" ? "Already have an account? Sign in" : "New to ADUJI? Create an account"}</button><button type="button" className="text-button" onClick={async () => { if(!supabase || !authEmail) {notify("Enter your email first");return;} const {error}=await supabase.auth.resetPasswordForEmail(authEmail); notify(error ? error.message : "Password reset email requested"); }}>Forgot password?</button></form>}
      {modal === "upload" && <form className="modal-form" onSubmit={uploadVideo}><p className="modal-intro">Share your moment with the ADUJI community. This prototype adds the selected video to your local feed.</p><button type="button" className="dropzone" onClick={() => fileRef.current?.click()}><UploadCloud size={30}/><b>{uploadFile ? uploadFile.name : "Choose a video to upload"}</b><span>MP4, MOV or WebM · local preview only</span>{localPreview && <video src={localPreview} controls className="upload-preview"/>}</button><input ref={fileRef} type="file" accept="video/*" hidden onChange={e => handleFile(e.target.files?.[0])}/><label>Caption<textarea value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="What is happening in your video?" rows="3" maxLength="300"/></label><label>Category<select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>{["Trending","Music","Gaming","Anime","Comedy","Fashion","Explore"].map(x=><option key={x}>{x}</option>)}</select></label><button className="primary-button" type="submit"><UploadCloud size={17}/> Add to feed</button></form>}
      {modal === "live" && <form className="modal-form" onSubmit={startLive}><p className="modal-intro">Set up your live room. This demo creates a local preview state; real broadcasting requires a streaming service and backend.</p><label>Live title<input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} maxLength="90"/></label><div className="notice"><Radio size={18}/><span>Camera, audience chat, moderation and stream delivery need to be connected before public broadcasting.</span></div><button className="primary-button" type="submit"><Radio size={17}/> Open live preview</button></form>}
      {modal === "channel" && <div className="modal-form"><div className="channel-preview"><div className="avatar large">P</div><div><h3>Paul_Aji</h3><p>@ajiokpepaul · Creator channel</p></div></div><p className="modal-intro">Your channel is ready as a local prototype. Customize your bio and connect a backend to save it across devices.</p><label>Channel bio<textarea rows="3" placeholder="Tell the world what you create…"/></label><button className="primary-button" onClick={() => {setModal("");nav("Profile");notify("Channel preview opened")}}>Open channel</button></div>}
      {modal === "premium" && <div className="modal-form"><div className="premium-icon"><Crown size={34}/></div><h2>Make more of your moments.</h2><p className="modal-intro">A future premium tier could include advanced creator analytics, profile customization and editing tools. Payments are not enabled in this prototype.</p><button className="primary-button" onClick={() => {setModal("");notify("Premium is a concept preview")}}>Explore features</button></div>}
      {modal === "comments" && <div className="modal-form"><div className="comment-video"><img src={activeVideo?.poster}/><div><b>{activeVideo?.name}</b><p>{activeVideo?.caption}</p></div></div><div className="notice"><MessageCircle size={18}/><span>Comments UI preview. Persistent comments and moderation need a database-backed service.</span></div><label>Add a comment<input placeholder="Say something kind…"/></label><button className="primary-button" onClick={() => {setModal("");notify("Comment interaction is a prototype")}}><Send size={16}/> Send</button></div>}
      {modal === "topics" && <div className="topic-picker">{["Education","Food","Travel","Sports","Science","DIY","Pets","News"].map(t=><button key={t} onClick={() => {setActiveTopic("For You");setSearch(t);setModal("");setPage("Home")}}>{t}<span>→</span></button>)}</div>}
    </Modal>}
    {activeVideo && <Modal title="Watch video" onClose={() => setActiveVideo(null)} wide><div className="watch-layout"><div className="watch-player">{activeVideo.fileUrl ? <video src={activeVideo.fileUrl} controls autoPlay/> : <div className="watch-poster" style={{backgroundImage:`url(${activeVideo.poster})`}}><button onClick={() => notify("Connect video playback to enable streaming")}><Play fill="currentColor"/></button></div>}</div><div className="watch-info"><div className="channel-preview"><div className="avatar">{activeVideo.name[0]}</div><div><b>{activeVideo.name}</b><p>@{activeVideo.user}</p></div></div><p>{activeVideo.caption}</p><div className="watch-actions"><button onClick={() => toggleLike(activeVideo.id)}><Heart size={18}/> {compact(activeVideo.likes)}</button><button onClick={() => {setActiveVideo(null);setModal("comments")}}><MessageCircle size={18}/> Comment</button><button onClick={() => setSaved(p=>p.includes(activeVideo.id)?p.filter(x=>x!==activeVideo.id):[...p,activeVideo.id])}><Bookmark size={18}/> Save</button></div><p className="sound-line"><Music2 size={15}/> {activeVideo.sound}</p></div></div></Modal>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function VideoCard({video, liked, saved, following, onLike, onSave, onFollow, onOpen, onComment, onShare}) {
  return <article className="video-card"><button className="poster-button" onClick={onOpen} aria-label={`Watch ${video.name}'s video`}>{video.fileUrl ? <video src={video.fileUrl} muted/> : <img src={video.poster} loading="lazy"/>}<span className="poster-overlay"/><span className="play-button"><Play size={22} fill="currentColor"/></span><span className="duration">{video.duration}</span><span className="views"><Play size={12} fill="currentColor"/> {video.views} views</span></button><div className="video-info"><div className="creator-line"><div className="avatar">{video.name[0]}</div><div className="creator-name"><b>{video.name}{video.verified && <span className="verified">✓</span>}</b><small>@{video.user} · {video.category}</small></div><button className={`tiny-follow ${following ? "is-following" : ""}`} onClick={onFollow}>{following ? "Following" : "Follow"}</button><button className="plain-icon" onClick={onOpen}><MoreHorizontal size={18}/></button></div><p className="caption">{video.caption}</p><div className="sound-line"><Music2 size={14}/><span>{video.sound}</span></div><div className="engagement"><button className={liked ? "liked" : ""} onClick={onLike}><Heart size={17} fill={liked ? "currentColor" : "none"}/>{compact(video.likes)}</button><button onClick={onComment}><MessageCircle size={17}/>{compact(video.comments)}</button><button onClick={onShare}><Share2 size={17}/>{compact(video.shares)}</button><button className={saved ? "saved" : ""} onClick={onSave}><Bookmark size={17} fill={saved ? "currentColor" : "none"}/></button></div></div></article>
}

function LivePage({live,setLive,setModal,title}) {
  return <div className="live-page"><div className="feed-heading"><div><p className="eyebrow">REAL TIME COMMUNITY</p><h1>ADUJI LIVE <span className="live-dot"/></h1></div><button className="primary-button" onClick={() => setModal("live")}><Radio size={16}/> Go live</button></div>{live ? <div className="live-stage"><div className="live-screen"><span className="live-pill"><i/> LIVE PREVIEW</span><Radio size={64}/><h2>{title}</h2><p>Your live room is open locally. Connect a streaming provider to broadcast to viewers.</p><div className="live-stats"><span>◉ 1 viewer (preview)</span><span>♡ Community first</span></div></div><div className="live-chat"><h3>Live chat</h3><div className="chat-message"><b>ADUJI Guide</b><p>Welcome to the live preview! Keep it respectful.</p></div><input placeholder="Send a message…"/><button className="primary-button" onClick={() => {setLive(false)}}>End preview</button></div></div> : <div className="live-empty"><div className="live-empty-icon"><Radio size={38}/></div><h2>There's a whole world going live.</h2><p>Watch creators perform, game, chat and share moments with their communities.</p><button className="primary-button" onClick={() => setModal("live")}>Start your live preview</button><div className="live-suggestions">{starterVideos.slice(1,4).map(v=><div key={v.id} className="live-suggestion"><img src={v.poster}/><span><b>{v.name}</b><small>{v.category} creator</small></span></div>)}</div></div>}</div>
}
function ProfilePage({videos,setModal,notify}) {
  return <div className="profile-page"><div className="profile-cover"><div className="cover-glow"/></div><div className="profile-details"><div className="avatar profile-avatar">P</div><div className="profile-heading"><h1>Paul_Aji <span className="verified">✓</span></h1><p>@ajiokpepaul · Creator</p><p>Making moments worth sharing. Welcome to my corner of ADUJI.</p><div className="profile-stats"><span><b>12.6K</b> Followers</span><span><b>{videos.length}</b> Videos</span><span><b>8.2M</b> Likes <small>(sample)</small></span></div></div><div className="profile-buttons"><button className="secondary-button" onClick={() => setModal("channel")}><Settings size={16}/> Edit channel</button><button className="primary-button" onClick={() => setModal("upload")}><Plus size={16}/> Post video</button></div></div><div className="profile-tabs"><button className="selected"><Video size={16}/> Videos</button><button onClick={() => notify("Liked videos preview") }><Heart size={16}/> Liked</button><button onClick={() => notify("Collections preview") }><Bookmark size={16}/> Collections</button></div>{videos.length ? <div className="video-grid profile-grid">{videos.map(v=><VideoCard key={v.id} video={v} liked={false} saved={false} following={false} onLike={()=>notify("Like")} onSave={()=>notify("Saved")} onFollow={()=>notify("Follow")} onOpen={()=>notify("Video player")} onComment={()=>notify("Comments")} onShare={()=>notify("Share")}/>)}</div> : <div className="empty-state"><Video size={30}/><h3>Your story starts here</h3><p>Upload your first video and start building your audience.</p><button className="primary-button" onClick={() => setModal("upload")}>Upload your first video</button></div>}</div>
}
function MessagesPage({notify}) {
  return <div className="messages-page"><div className="feed-heading"><div><p className="eyebrow">YOUR COMMUNITY</p><h1>Messages</h1></div></div><div className="message-panel"><div className="message-list"><h3>Inbox</h3>{[["MiraWrites","Hey! Loved your latest post ✨"],["ZeeEditz","Are you joining the challenge?"],["Travel With Tee","Thanks for the support!"]].map((x,i)=><button key={x[0]} onClick={() => notify(`Opened conversation with ${x[0]} (preview)`)}><div className="avatar">{x[0][0]}</div><span><b>{x[0]}</b><small>{x[1]}</small></span><i/></button>)}</div><div className="message-empty"><MessageCircle size={38}/><h2>Your conversations, all in one place.</h2><p>Choose a conversation to see messages. This inbox uses sample data.</p></div></div></div>
}
function Modal({title,onClose,children,wide=false}) {
  return <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) onClose()}}><section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={20}/></button></header>{children}</section></div>
}

createRoot(document.getElementById("root")).render(<App/>);