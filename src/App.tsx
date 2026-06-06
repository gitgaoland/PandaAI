import { useState, useEffect } from "react";
import Header from "./components/Header";
import PostList from "./components/PostList";
import PostDetail from "./components/PostDetail";
import AboutMe from "./components/AboutMe";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import { Post, Category } from "./types";
import { Sparkles, Heart } from "lucide-react";

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<string>("首页"); // "首页" | "政治" | ... | "关于我" | "detail" | "admin"
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Auth and modal states
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("panda_admin_token"));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [settings, setSettings] = useState({
    title: "Panda AI 博客",
    bloggerName: "熊猫 AI 主理人",
    bloggerBio: "Panda AI 博客主理人",
    bloggerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    aboutContent: "关于我的自传正在努力起草中。"
  });

  // Fetch blogs on load
  const fetchPostsAndData = async () => {
    try {
      // 1. Fetch posts
      const postsRes = await fetch("/api/posts");
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      // 2. Fetch categories
      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      // 3. Fetch Settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (e) {
      console.error("Failed to load initial full-stack blog data", e);
    }
  };

  useEffect(() => {
    fetchPostsAndData();
  }, []);

  // Update central states when a post liked inside child component to keep list numbers updated
  const handlePostLikeInList = (postId: string, updatedLikes: number) => {
    setPosts(prevPosts =>
      prevPosts.map(p => (p.id === postId ? { ...p, likes: updatedLikes } : p))
    );
  };

  // Perform dynamic token check
  const handleVerifyAuth = async (token: string) => {
    try {
      const res = await fetch("/api/auth/check", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          localStorage.setItem("panda_admin_token", token);
          setAdminToken(token);
        } else {
          localStorage.removeItem("panda_admin_token");
          setAdminToken(null);
        }
      }
    } catch (e) {
      console.error("Auth check failed", e);
    }
  };

  useEffect(() => {
    if (adminToken) {
      handleVerifyAuth(adminToken);
    }
  }, [adminToken]);

  // Logout admin
  const handleLogoutAdmin = () => {
    localStorage.removeItem("panda_admin_token");
    setAdminToken(null);
    if (currentView === "admin") {
      setCurrentView("首页");
    }
  };

  // Setup Custom navigation helper
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedPostId(null);
    
    // Auto scroll view helper
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch the selected post detail
  const selectedPost = posts.find((p) => p.id === selectedPostId);

  // Filter posts depending on the active view
  const displayPosts = posts.filter((post) => {
    if (currentView === "首页" || currentView === "detail" || currentView === "admin" || currentView === "关于我") {
      return true;
    }
    return post.category === currentView;
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9] text-stone-900 selection:bg-stone-200 selection:text-stone-900 font-sans" id="app-root">
      
      {/* Sticky Glass Navigation header */}
      <Header
        currentView={selectedPostId ? "detail" : currentView}
        onNavigate={handleNavigate}
        isAdminLoggedIn={!!adminToken}
        onLogout={handleLogoutAdmin}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Section */}
      <main className="flex-grow">
        {/* Render View Switch */}
        {(() => {
          // POST DETAIL PAGE VIEW
          if (selectedPostId && selectedPost) {
            return (
              <PostDetail
                post={selectedPost}
                onBack={() => {
                  setSelectedPostId(null);
                  // Return to whatever view category they were in before click
                }}
                onLike={handlePostLikeInList}
              />
            );
          }

          // ADMIN DASHBOARD PANELS
          if (currentView === "admin") {
            if (!adminToken) {
              return (
                <div className="mx-auto max-w-7xl px-4 py-16 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-none bg-stone-100 text-stone-900 border border-stone-200 mb-4 font-mono font-bold">
                    [!]
                  </div>
                  <h3 className="font-display text-base font-bold text-stone-950 mb-1 leading-tight uppercase tracking-wide">您尚未取得管理员授权</h3>
                  <p className="font-serif text-xs text-stone-600 max-w-sm mx-auto mb-6">如需管理文章目录、审核来评留言及调用 AI 笔锋，请登入后台。</p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="rounded-none bg-stone-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-850"
                  >
                    立刻开启密码登入
                  </button>
                </div>
              );
            }
            return (
              <AdminDashboard
                posts={posts}
                token={adminToken}
                onRefreshPosts={fetchPostsAndData}
                onNavigate={handleNavigate}
                onTokenChange={(newToken) => {
                  setAdminToken(newToken);
                  localStorage.setItem("panda_admin_token", newToken);
                }}
              />
            );
          }

          // ABOUT ME RESUME VIEW
          if (currentView === "关于我") {
            return (
              <AboutMe
                settings={settings}
                totalPosts={posts.length}
                onBack={() => handleNavigate("首页")}
              />
            );
          }

          // HOME OR SPECIFIC ARCHIVES VIEW
          return (
            <PostList
              posts={displayPosts}
              categories={categories}
              activeCategory={currentView}
              onPostSelect={(id) => setSelectedPostId(id)}
              onCategorySelect={handleNavigate}
            />
          );
        })()}
      </main>

      {/* Footer view */}
      <footer className="border-t border-stone-200 bg-white py-12" id="site-footer">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 space-y-4">
          <div className="flex justify-center items-center space-x-1.5 text-stone-900 text-[10px] font-bold uppercase tracking-widest select-none">
            <span>[ PANDA AI BLOG DEEP COLLABORATIVE HUB ]</span>
          </div>
          
          <p className="font-serif text-stone-500 text-xs italic">
            © 2026 {settings.title}. 与 <span className="text-stone-900 font-bold font-sans not-italic">Google Gemini 3.5</span> 深度求索协同构建。
          </p>

          <div className="flex justify-center items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-stone-400">
            <span>精细排制</span>
            <span>•</span>
            <span>响应快速</span>
            <span>•</span>
            <span>零模拟真实架构</span>
          </div>
        </div>
      </footer>

      {/* Login verification dialog */}
      {showLoginModal && (
        <Login
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(token) => {
            setAdminToken(token);
            localStorage.setItem("panda_admin_token", token);
            // Auto jump to admin dashboard upon successful logging in
            setCurrentView("admin");
          }}
        />
      )}
    </div>
  );
}
