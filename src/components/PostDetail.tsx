import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Calendar, Eye, Heart, Clock, Send, 
  Bot, Sparkles, MessageSquare, AlertCircle, CheckCircle, RefreshCw,
  ExternalLink
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Post, Comment } from "../types";

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  onLike: (id: string, updatedLikes: number) => void;
}

export default function PostDetail({ post, onBack, onLike }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  
  // Comment Form State
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentStatus, setCommentStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // AI Chat Assistant State
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    // Scroll to top when post changes
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchComments();
    setLikes(post.likes);
    setChatHistory([
      { 
        role: "model", 
        text: `你好！我是本站的 **Panda AI 智能助理**。🐼\n我已读完大作《${post.title}》。关于本篇博文，不论是论点探讨、技术疑问、还是想让我帮你梳理提纲、归纳总结或扩充延伸，都欢迎你在下方直接询问我！` 
      }
    ]);
  }, [post.id]);

  // Handle Like
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        onLike(post.id, data.likes);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentEmail || !commentContent) return;
    setCommentStatus("submitting");

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: commentName,
          authorEmail: commentEmail,
          content: commentContent
        })
      });

      if (res.ok) {
        setCommentStatus("success");
        setCommentContent("");
        // Refresh comments (in case comment doesn't require moderation or to see new list)
        fetchComments();
      } else {
        setCommentStatus("error");
      }
    } catch (error) {
      setCommentStatus("error");
    }
  };

  // Ask AI Assistant
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAiLoading) return;

    const userMsg = question.trim();
    setQuestion("");
    const updatedHistory = [...chatHistory, { role: "user" as const, text: userMsg }];
    setChatHistory(updatedHistory);
    setIsAiLoading(true);

    // Auto scroll chat to bottom
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postTitle: post.title,
          postContent: post.content,
          question: userMsg,
          chatHistory: chatHistory.slice(1) // skip the initial greeting to keep token clean
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory([...updatedHistory, { role: "model" as const, text: data.answer }]);
      } else {
        setChatHistory([...updatedHistory, { role: "model" as const, text: "【助理回执】抱歉，连通 AI 脑神经元出现些许抖动，请稍后再次发送。" }]);
      }
    } catch (error) {
      setChatHistory([...updatedHistory, { role: "model" as const, text: "【助理回执】网络似乎断线，无法问询 Panda AI。" }]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="post-detail-container">
      {/* Back button */}
      <button
        onClick={onBack}
        className="group mb-6 flex items-center space-x-2 rounded-none border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 shadow-xs hover:text-stone-950 hover:bg-stone-50 transition-all cursor-pointer"
        id="btn-back-to-list"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-stone-900" />
        <span>返回文章列表</span>
      </button>

      {/* Main Layout containing Article and AI Sidepanel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Article content (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-8 bg-white rounded-none border border-stone-200 p-6 sm:p-10">
          
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-block rounded-none bg-stone-100 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900 border border-stone-900/10">
              {post.category}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-bold leading-tight tracking-tight text-stone-950" id="post-detail-title">
              {post.title}
            </h1>
            
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-400 border-y border-stone-100 py-3 mt-4">
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-stone-900/80" />
                <span>发布于：{formattedDate}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-stone-900/80" />
                <span>估读：{post.readingTime}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Eye className="h-4 w-4 text-stone-900/80" />
                <span>阅读量：{post.views}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Heart className="h-4 w-4 text-stone-900/80" />
                <span>喜欢数：{likes}</span>
              </span>
            </div>
          </div>

          {/* Cover image banner */}
          <div className="w-full overflow-hidden rounded-none bg-stone-50 border border-stone-200">
            <img
              src={post.coverImage}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full object-cover max-h-[400px]"
            />
          </div>

          {/* Post Summary Region */}
          {post.summary && (
            <div className="bg-stone-50 border-l-4 border-stone-950 p-5 sm:p-6 rounded-none space-y-2" id="post-detail-summary-section">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-1.5 w-full">
                <Sparkles className="h-3.5 w-3.5 text-stone-850" />
                <span>内容导读 / 文章摘要 (Reading Guide & Excerpt)</span>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed font-serif italic pl-0.5 whitespace-pre-line">
                {post.summary}
              </p>
            </div>
          )}

          {/* Real markdown rendered body */}
          <div className="prose max-w-none">
            <div className="markdown-body" id="post-markdown-content">
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
                {post.content}
              </Markdown>
            </div>
          </div>

          {/* Social interaction footer */}
          <div className="border-t border-stone-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, i) => (
                <span key={i} className="text-[10px] font-semibold text-stone-600 bg-stone-105 border border-stone-200/50 px-2.5 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 rounded-none px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                likes > post.likes 
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 border border-stone-200"
              }`}
              id="btn-like-post"
            >
              <Heart className={`h-4 w-4 ${likes > post.likes ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
              <span>{likes > post.likes ? "已赞过" : "点赞支持"} ({likes})</span>
            </button>
          </div>

          {/* Comments list section */}
          <div className="border-t border-stone-200 pt-8 mt-10">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-stone-950 mb-6 flex items-center space-x-2 border-b border-stone-100 pb-2">
              <MessageSquare className="h-4.5 w-4.5 text-stone-900" />
              <span>本篇留言 ({comments.length})</span>
            </h3>

            {/* Empty Comments */}
            {comments.length === 0 ? (
              <div className="bg-[#fafaf9] rounded-none p-6 text-center text-stone-500 font-serif text-sm border-dashed border border-stone-300">
                暂无留言。写下第一条真诚意见吧。
              </div>
            ) : (
              <div className="space-y-4" id="comments-timeline">
                {comments.map((comm) => (
                  <div key={comm.id} className="rounded-none border border-stone-200 bg-[#fafaf9]/50 p-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                      <span className="text-stone-900">{comm.authorName}</span>
                      <span className="text-stone-400">{new Date(comm.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <p className="font-serif text-sm leading-relaxed text-stone-700 whitespace-pre-line pl-0.5">{comm.content}</p>

                    {/* Admin Reply */}
                    {comm.reply && (
                      <div className="mt-3 bg-white border border-stone-250 p-3 flex items-start space-x-2 rounded-none">
                        <div className="h-5 w-5 bg-stone-950 text-white flex items-center justify-center font-display text-[9px] font-black shrink-0 mt-0.5">
                          主
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-stone-900 mb-0.5">主理人回复：</p>
                          <p className="font-serif text-stone-600 leading-relaxed">{comm.reply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment Post Form */}
            <form onSubmit={handleCommentSubmit} className="mt-8 space-y-4 border-t border-stone-100 pt-6">
              <h4 className="font-display text-xs font-bold uppercase tracking-widest text-[#6c6764]">发表探讨意见</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1">您的昵称 *</label>
                  <input
                    type="text"
                    required
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="给自己起个好听的名字"
                    className="block w-full text-stone-900 text-xs rounded-none border border-stone-300 bg-white px-3 py-2 placeholder-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1">您的电子邮箱 * (不公开)</label>
                  <input
                    type="email"
                    required
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    placeholder="用于接收回复通知"
                    className="block w-full text-stone-900 text-xs rounded-none border border-stone-300 bg-white px-3 py-2 placeholder-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1">留言文本内容 *</label>
                <textarea
                  required
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="畅所欲言，共同探讨..."
                  className="block w-full text-stone-900 text-xs rounded-none border border-stone-300 bg-white px-3 py-2 placeholder-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden font-medium"
                />
              </div>

              {commentStatus === "success" && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-stone-800 bg-stone-100 p-3 rounded-none border border-stone-200">
                  <CheckCircle className="h-4 w-4 shrink-0 text-stone-900" />
                  <span>留言提交成功！出于防止垃圾广告，本站启用审核机制。审核完后随即公开生效！</span>
                </div>
              )}

              {commentStatus === "error" && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-none border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>留言失败，请检查网络后再发。</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentStatus === "submitting"}
                  className="rounded-none bg-stone-900 px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-850 cursor-pointer disabled:opacity-55 transition-colors"
                >
                  {commentStatus === "submitting" ? "处理中..." : "发送留言"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Panda AI Assistant Widget (1/3 width on desktop) */}
        <div className="lg:col-span-1 sticky top-24 space-y-6">
          <div className="rounded-none border border-stone-200 bg-stone-50 flex flex-col overflow-hidden h-[540px]">
            {/* Header */}
            <div className="bg-stone-950 p-4 shrink-0 text-white flex items-center justify-between border-b border-stone-850">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 border border-white/50 text-[#fafaf9] flex items-center justify-center font-display text-[10px] font-bold">
                  AI
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase">Panda AI 智能精读馆</h3>
                  <p className="text-[8px] text-stone-400 font-semibold tracking-wider uppercase">Deep Insight Research Model</p>
                </div>
              </div>
              <button 
                onClick={() => setChatHistory([{ role: "model", text: `你好！我是本站的 **Panda AI 智能研读助理**。🐼\n关于本篇博文，你可以在下方直接向我提问探索。` }])}
                className="text-stone-400 hover:text-white p-1 rounded-none hover:bg-white/10 transition-colors"
                title="重置对话"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-none p-3 text-xs leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-stone-900 text-stone-50 border-stone-900"
                        : "bg-white border-stone-200 text-stone-800 shadow-xs"
                    }`}
                  >
                    {msg.role === "model" && (
                      <div className="flex items-center space-x-1.5 text-[9px] font-bold text-stone-900 tracking-wider uppercase mb-1.5 select-none border-b border-stone-100 pb-1">
                        <Bot className="h-3 w-3 text-stone-800" />
                        <span>PANDA AI REFLECTION</span>
                      </div>
                    )}
                    <div className="prose max-w-none text-xs break-words font-serif">
                      <Markdown
                        components={{
                          a: ({ href, children, ...props }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-900 bg-stone-100 border border-stone-300 hover:bg-stone-200 hover:text-black transition-colors rounded-none shadow-2xs my-1 cursor-pointer break-all"
                              {...props}
                            >
                              <span>{children}</span>
                              <ExternalLink className="h-3 w-3 text-stone-700" />
                            </a>
                          )
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    </div>
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-250 rounded-none p-3 shadow-xs space-y-1 w-32">
                    <div className="flex items-center space-x-1 text-[9px] text-stone-500 font-bold uppercase tracking-wider">
                      <Sparkles className="h-3 w-3 text-stone-800 animate-pulse" />
                      <span>正在提炼...</span>
                    </div>
                    <div className="flex space-x-1 pl-1 pt-1.5">
                      <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Submit Question Box */}
            <form onSubmit={handleAskAi} className="p-3 border-t border-stone-200 bg-white shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="问询主理人观点、提炼摘要或扩充论点..."
                  disabled={isAiLoading}
                  className="block w-full rounded-none border border-stone-350 bg-stone-50 py-2.5 pl-3.5 pr-10 text-xs text-stone-950 placeholder-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden disabled:opacity-50 transition-all font-medium"
                  id="input-ai-chat-question"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !question.trim()}
                  className="absolute right-1.5 p-1.5 text-stone-900 hover:bg-stone-100 disabled:opacity-30 rounded-none transition-colors cursor-pointer"
                  id="btn-send-ai-question"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick AI Suggestions Panel */}
          <div className="rounded-none border border-stone-200 bg-white p-4.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">提问角度模板：</h4>
            <div className="flex flex-col gap-2">
              {[
                "梳理此文章中的3大核心观点是什么？",
                "请将这篇文章扩充生成一篇小长演讲稿大纲。",
                "有哪些相关的跨学科交叉命题可以用来延伸阅读？"
              ].map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuestion(rec)}
                  className="w-full text-left text-xs font-semibold text-stone-650 hover:text-stone-950 hover:bg-stone-50 p-2 border border-stone-200 rounded-none transition-all"
                >
                  📝 {rec}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
