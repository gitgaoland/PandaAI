import { useState, useMemo } from "react";
import { Search, Compass, BookOpen, AlertCircle } from "lucide-react";
import { Post, Category } from "../types";
import PostCard from "./PostCard";

const HOMEPAGE_MENUS = [
  { label: "首页", view: "首页" },
  { label: "政治", view: "政治" },
  { label: "历史", view: "历史" },
  { label: "文化", view: "文化" },
  { label: "技术", view: "技术" },
  { label: "经济", view: "经济" },
  { label: "社会", view: "社会" },
  { label: "外交", view: "外交" },
  { label: "地理", view: "地理" },
  { label: "关于我", view: "关于我" }
];

interface PostListProps {
  posts: Post[];
  categories: Category[];
  activeCategory: string; // "首页" | "政治" ...
  onPostSelect: (postId: string) => void;
  onCategorySelect: (category: string) => void;
}

export default function PostList({
  posts,
  categories,
  activeCategory,
  onPostSelect,
  onCategorySelect
}: PostListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [posts, searchQuery]);

  // Split into Hero post and regular grid
  const heroPost = useMemo(() => {
    if (activeCategory === "首页" && filteredPosts.length > 0 && searchQuery === "") {
      return filteredPosts[0];
    }
    return null;
  }, [filteredPosts, activeCategory, searchQuery]);

  const gridPosts = useMemo(() => {
    if (heroPost) {
      return filteredPosts.slice(1);
    }
    return filteredPosts;
  }, [filteredPosts, heroPost]);

  const activeCategoryDescription = useMemo(() => {
    if (activeCategory === "首页") {
      return "聚合最新发现，纵谈政经技术，追溯人文之息。";
    }
    const cat = categories.find(c => c.name === activeCategory);
    return cat ? cat.description : "独到见解，启发新知。";
  }, [activeCategory, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="post-list-container">
      {/* Top 10-Category Dashboard Navigation Menu */}
      <div className="mb-8" id="homepage-category-navigation-bar">
        <div className="border border-stone-200 bg-white p-4 sm:p-5 rounded-none shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-150 pb-2.5 mb-3.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#6c6764] flex items-center space-x-1.5">
              <span className="inline-block w-2 h-2 bg-stone-900 rounded-none animate-pulse"></span>
              <span>博客频道导航 / 快捷分流选单 (Blog Channels Directory)</span>
            </span>
            <span className="hidden sm:inline text-[9px] text-stone-400 font-serif">Panda AI 智能助理全力护航</span>
          </div>
          
          {/* Responsive grid with 5 columns on narrow mobile, and 10 columns on tablet upwards */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {HOMEPAGE_MENUS.map((menu) => {
              const isActive = activeCategory === menu.view;
              return (
                <button
                  key={menu.view}
                  onClick={() => onCategorySelect(menu.view)}
                  className={`w-full text-center py-2 px-0.5 truncate text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border rounded-none cursor-pointer ${
                    isActive 
                      ? "bg-stone-900 border-stone-900 text-[#fafaf9] font-black shadow-xs" 
                      : "bg-[#fafaf9] border-stone-200 text-stone-600 hover:bg-stone-100/80 hover:border-stone-350 hover:text-stone-950"
                  }`}
                  id={`home-channel-item-${menu.view}`}
                  title={`前往浏览 ${menu.label} 栏目`}
                >
                  <span className="block">{menu.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search and Title Block */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-stone-200 pb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#6c6764]">
            {activeCategory === "首页" ? "精选栏目" : "栏目归档"}
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-stone-950 mt-1.5 mb-2 sm:text-4xl">
            {activeCategory}
          </h2>
          <p className="font-serif text-stone-600 max-w-2xl text-sm leading-relaxed italic">
            {activeCategoryDescription}
          </p>
        </div>

        {/* Improved Search Bar */}
        <div className="relative w-full max-w-xs md:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-stone-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章、标签、摘要..."
            className="block w-full rounded-none border border-stone-300 bg-white py-2 pl-9 pr-4 text-xs font-semibold uppercase tracking-wider text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all"
            id="input-search-posts"
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Posts Area (3/4 width on desktop) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* No Posts State */}
          {filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-none border border-stone-200" id="empty-posts-state">
              <AlertCircle className="h-10 w-10 text-stone-400 mb-4" />
              <h3 className="text-base font-bold text-stone-900 mb-1">未找到相关文章</h3>
              <p className="font-serif text-sm text-stone-500 max-w-sm">
                抱歉，我们在当前栏目下未搜寻到匹配 “{searchQuery}” 的博文。请尝试其他搜索词或清除检索。
              </p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 rounded-none bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-850 transition-colors"
              >
                清除搜索
              </button>
            </div>
          )}

          {/* Hero Post Card (Stunning Wide Banner for the First Article) */}
          {heroPost && (
            <div 
              onClick={() => onPostSelect(heroPost.id)}
              className="group relative overflow-hidden rounded-none border border-stone-200 bg-white hover:border-stone-400 cursor-pointer flex flex-col md:flex-row transition-all duration-350 md:h-[330px]"
              id="hero-post-banner"
            >
              <div className="relative md:w-3/5 overflow-hidden h-[220px] md:h-full bg-stone-100 border-b md:border-b-0 md:border-r border-stone-200/50">
                <span className="absolute top-4 left-4 z-10 bg-stone-950 px-3 py-1.5 text-[10px] font-bold tracking-widest text-[#fafaf9] uppercase border border-stone-950">
                  今日主推 • {heroPost.category}
                </span>
                <img
                  src={heroPost.coverImage}
                  alt={heroPost.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-102"
                />
              </div>

              <div className="flex flex-col md:w-2/5 p-6 sm:p-7 justify-between h-full bg-[#fafaf9]/20">
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-3 text-[11px] font-medium text-stone-450">
                    <span>{new Date(heroPost.createdAt).toLocaleDateString("zh-CN", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{heroPost.readingTime}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold leading-tight text-stone-950 group-hover:text-stone-700 transition-colors duration-200">
                    {heroPost.title}
                  </h3>
                  <p className="font-serif text-sm text-stone-600 leading-relaxed line-clamp-4">
                    {heroPost.summary}
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-950 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                    <span>阅读主页精选</span>
                    <span>→</span>
                  </span>
                  <span className="text-stone-400 font-medium">阅读量 {heroPost.views}</span>
                </div>
              </div>
            </div>
          )}

          {/* Regular Grid */}
          {gridPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="regular-posts-grid">
              {gridPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => onPostSelect(post.id)} 
                />
              ))}
            </div>
          )}

        </div>

        {/* Small Sidebar Column (1/4 width on desktop) */}
        <div className="space-y-6">
          
          {/* Categories Quick Filter Widget */}
          <div className="rounded-none border border-stone-200 bg-white p-5">
            <h3 className="font-display text-xs font-bold text-stone-950 uppercase tracking-widest mb-4 flex items-center space-x-2 border-b border-stone-200 pb-2">
              <Compass className="h-4 w-4 text-stone-900" />
              <span>栏目云导航</span>
            </h3>
            
            <div className="space-y-1">
              <button
                onClick={() => onCategorySelect("首页")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 rounded-none ${
                  activeCategory === "首页"
                    ? "bg-stone-900 text-[#fafaf9] font-bold"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                }`}
              >
                <span>全部文章</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                  activeCategory === "首页" ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-550"
                }`}>{posts.length}</span>
              </button>
              
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 rounded-none ${
                      isActive
                        ? "bg-stone-900 text-[#fafaf9] font-bold"
                        : "text-stone-600 hover:bg-stone-100/85 hover:text-stone-950"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                      isActive ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-550"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Panda AI Quote Panel */}
          <div className="rounded-none border border-stone-950 bg-stone-950 p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 font-bold font-display text-6xl translate-x-4 -translate-y-4 select-none uppercase">
              PANDA
            </div>
            <div className="flex h-7 w-7 items-center justify-center border border-white/50 text-xs font-black mb-4 bg-transparent text-white select-none">
              AI
            </div>
            <p className="font-serif text-[13px] italic leading-relaxed mb-4 text-stone-300">
              “智能不应仅仅是数字符号的盲目运算，它必须融入人类反思，或者在创作者和读者的深度求索碰撞中去得到点亮。”
            </p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
              — Panda AI 共创馆
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
