import { Mail, Compass, Shield, Award, Heart, MessageSquare, ExternalLink, ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";

interface AboutMeProps {
  settings: {
    title: string;
    bloggerName: string;
    bloggerBio: string;
    bloggerAvatar: string;
    aboutContent: string;
  };
  totalPosts: number;
  onBack: () => void;
}

export default function AboutMe({ settings, totalPosts, onBack }: AboutMeProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="about-me-container">
      
      {/* Page Header with prominent Back Button */}
      <div className="mb-10 border-b border-stone-200 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#6c6764]">主理人自传</span>
            <h2 className="font-display text-4xl font-black tracking-tight text-stone-950 mt-1.5 leading-none">
              关于我 (About Me)
            </h2>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-850 text-[#fafaf9] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 rounded-none shadow-xs border border-stone-900 cursor-pointer self-start sm:self-auto group active:scale-[0.98]"
            title="返回博客首页"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>返回博客首页</span>
          </button>
        </div>
        <p className="font-serif text-stone-600 max-w-2xl text-sm italic">
          跨学科求索知识的智慧自留地，用文字记录宏观世界的潮落与微观生活的闪光。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Column Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-none border border-stone-200 bg-white p-6 text-center flex flex-col items-center">
            
            {/* Avatar */}
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-none border-2 border-stone-900 shadow-xs">
              <img
                src={settings.bloggerAvatar}
                alt={settings.bloggerName}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Blogger bio */}
            <h3 className="font-display text-sm font-bold text-stone-950 mb-1">{settings.bloggerName}</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-none border border-stone-300">
              Panda AI 博客主理人
            </p>
            
            <p className="font-serif text-xs text-stone-600 leading-relaxed max-w-xs mt-3.5 border-t border-stone-100 pt-3.5">
              {settings.bloggerBio}
            </p>

            {/* Contact details */}
            <div className="w-full space-y-3 mt-6 border-t border-stone-100 pt-5">
              <div className="flex items-center space-x-3 text-xs text-stone-600">
                <Mail className="h-4 w-4 text-stone-900/85 shrink-0" />
                <span>电子邮箱: <a href="mailto:admin@panda.ai" className="hover:text-stone-950 font-semibold hover:underline">admin@panda.ai</a></span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-stone-600">
                <Compass className="h-4 w-4 text-stone-900/85 shrink-0" />
                <span>常驻：上海 • 物理与数字真空缝隙</span>
              </div>
            </div>
          </div>

          {/* Simple Statistics Card */}
          <div className="rounded-none border border-stone-200 bg-white p-5 grid grid-cols-2 gap-4 text-center">
            <div className="border-r border-stone-200 p-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">已撰博文</p>
              <p className="font-display text-2xl font-bold text-stone-950">{totalPosts}</p>
            </div>
            <div className="p-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">内建版块</p>
              <p className="font-display text-2xl font-bold text-stone-950">8 个</p>
            </div>
          </div>

          {/* Little Zen widget */}
          <div className="rounded-none border border-stone-950 bg-stone-950 p-6 text-white relative overflow-hidden">
            <h4 className="font-display text-xs font-bold tracking-wider uppercase text-stone-350 mb-2 flex items-center gap-1.5 border-b border-stone-800 pb-2">
              <Award className="h-4 w-4 text-stone-300" />
              <span>主理人的执念</span>
            </h4>
            <p className="font-serif text-xs leading-relaxed text-[#eae6df]">
              在这个追求快餐和信息噪鸣的时代，我们坚持撰写字数充实、论点多维、格调有底蕴的原创内容，希望能给你提供一寸幽静纯粹的思考空间。
            </p>
          </div>
        </div>

        {/* Right Column Detailed BIO via Markdown rendering */}
        <div className="lg:col-span-2 bg-white rounded-none border border-stone-200 p-6 sm:p-10">
          <div className="prose max-w-none">
            <div className="markdown-body" id="about-markdown-render">
              <Markdown
                components={{
                  a: ({ href, children, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-950 bg-stone-100 border border-stone-300 hover:bg-stone-200 hover:border-stone-900 hover:text-black transition-all duration-150 rounded-none shadow-xs my-1 font-sans cursor-pointer group break-all select-all align-middle"
                      {...props}
                    >
                      <span>{children}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  )
                }}
              >
                {settings.aboutContent}
              </Markdown>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
