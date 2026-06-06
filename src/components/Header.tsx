import { useState } from "react";
import { Menu, X, ShieldAlert, Key, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentView: string; // "首页" | "政治" | ... | "关于我" | "admin"
  onNavigate: (view: string) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const MENUS = [
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

export default function Header({
  currentView,
  onNavigate,
  isAdminLoggedIn,
  onLogout,
  onOpenLogin
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-[#fafaf9]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Section */}
        <div 
          onClick={() => { onNavigate("首页"); setIsMobileMenuOpen(false); }}
          className="flex cursor-pointer items-center space-x-3"
          id="btn-logo"
        >
          <div className="flex h-8 w-8 items-center justify-center border-2 border-stone-900 bg-stone-900 text-stone-50 font-display text-sm font-bold tracking-tight transition-transform duration-200">
            P
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-stone-900 uppercase">
              Panda AI <span className="font-serif font-light text-stone-500 italic lowercase">博客</span>
            </h1>
            <p className="hidden text-[9px] font-semibold tracking-widest text-[#6c6764] uppercase sm:block">
              Insights on technology, society & history
            </p>
          </div>
        </div>

        {/* Desktop Menu Section */}
        <nav className="hidden lg:flex items-center space-x-5">
          {MENUS.map((menu) => {
            const isActive = currentView === menu.view;
            return (
              <button
                key={menu.view}
                onClick={() => onNavigate(menu.view)}
                className={`relative py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2 ${
                  isActive 
                    ? "text-stone-900 border-stone-900 font-bold" 
                    : "text-stone-500 border-transparent hover:text-stone-900 hover:border-stone-300"
                }`}
                id={`menu-item-${menu.view}`}
              >
                {menu.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-2">
          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => onNavigate("admin")}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-none border transition-all duration-200 ${
                  currentView === "admin"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-stone-100 border-stone-200 text-stone-800 hover:bg-stone-200"
                }`}
                id="btn-goto-admin"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>创作后台</span>
              </button>
              <button
                onClick={onLogout}
                className="hidden sm:block text-xs text-stone-500 hover:text-stone-800 px-2 py-1.5 font-medium transition-colors border border-transparent hover:border-stone-200"
                id="btn-logout"
              >
                退出
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 border border-stone-200 hover:border-stone-400 bg-stone-50 text-stone-600 hover:text-stone-900 transition-all duration-200"
              title="管理员登录"
              id="btn-trigger-login"
            >
              <Key className="h-3.5 w-3.5 text-stone-500" />
              <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase">写作登入</span>
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center p-2 text-stone-600 hover:text-stone-900 lg:hidden transition-colors"
            id="btn-mobile-menu-toggle"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-stone-200 bg-[#fafaf9] lg:hidden overflow-hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {MENUS.map((menu) => {
                const isActive = currentView === menu.view;
                return (
                  <button
                    key={menu.view}
                    onClick={() => {
                      onNavigate(menu.view);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm font-semibold tracking-wide transition-all border-l-2 ${
                      isActive
                        ? "border-stone-900 bg-stone-100 text-stone-950 font-bold"
                        : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                    id={`mobile-menu-item-${menu.view}`}
                  >
                    {menu.label}
                  </button>
                );
              })}
              {isAdminLoggedIn ? (
                <div className="border-t border-stone-200 pt-3 mt-3">
                  <button
                    onClick={() => {
                      onNavigate("admin");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full justify-center items-center space-x-1.5 bg-stone-900 text-white py-2.5 text-xs font-bold hover:bg-stone-800 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>打开创作者后台</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-stone-200 pt-3 mt-3">
                  <button
                    onClick={() => {
                      onOpenLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex w-full justify-center items-center space-x-1.5 border border-stone-300 text-stone-700 bg-stone-50 py-2.5 text-xs font-semibold hover:bg-stone-100 transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    <span>管理员入口</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
