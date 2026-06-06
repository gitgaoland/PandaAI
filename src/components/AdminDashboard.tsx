import { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit2, Trash2, Check, MessageSquare, Settings, 
  Sparkles, FileText, Bot, HelpCircle, Eye, Heart, ArrowRightLeft,
  X, CheckCircle, Info, RefreshCw, KeyRound, Link2, Upload, Image as ImageIcon
} from "lucide-react";
import { Post, Comment } from "../types";

interface AdminDashboardProps {
  posts: Post[];
  token: string;
  onRefreshPosts: () => void;
  onNavigate: (view: string) => void;
  onTokenChange?: (newToken: string) => void;
}

export default function AdminDashboard({
  posts,
  token,
  onRefreshPosts,
  onNavigate,
  onTokenChange
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "settings">("posts");
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [categoriesList] = useState<string[]>([
    "政治", "历史", "文化", "技术", "经济", "社会", "外交", "地理"
  ]);

  // Settings State
  const [settings, setSettings] = useState({
    title: "",
    bloggerName: "",
    bloggerBio: "",
    bloggerAvatar: "",
    aboutContent: "",
    adminPassword: ""
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Post Editor Form State
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null); // null means "Creating"
  const [postForm, setPostForm] = useState({
    title: "",
    category: "技术",
    tagsString: "",
    summary: "",
    content: "",
    coverImage: "",
    author: "熊猫 AI 主理人",
    readingTime: "5 分钟"
  });
  const [postFormStatus, setPostFormStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // AI Writer Assistant State
  const [aiWriterTask, setAiWriterTask] = useState<"summary" | "outline" | "expand">("summary");
  const [aiWriterTitleInput, setAiWriterTitleInput] = useState("");
  const [aiWriterPromptInput, setAiWriterPromptInput] = useState("");
  const [aiWriterOutput, setAiWriterOutput] = useState("");
  const [isAiWriterLoading, setIsAiWriterLoading] = useState(false);

  // Comment reply state
  const [replyInputMap, setReplyInputMap] = useState<{ [id: string]: string }>({});

  // Hyperlink helper refs and states
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [helperLinkText, setHelperLinkText] = useState("");
  const [helperLinkUrl, setHelperLinkUrl] = useState("");

  // Image Upload States & Handlers
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFileToServer(files[0]);
    }
  };

  const uploadFileToServer = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("只支持上传图片格式的文件！");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("文件大小超过 15MB 限制！");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              image: base64Data,
              filename: file.name
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setPostForm(prev => ({
              ...prev,
              coverImage: data.url
            }));
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
          } else {
            setUploadError(data.error || "照片上传解析失败，请检查网络阻抗");
          }
        } catch {
          setUploadError("网络或接口错误，上传失败");
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError("读取本地图片失败");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError("本地文件选择模块发生异常");
      setIsUploading(false);
    }
  };

  // Drag and Drop handlers
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFileToServer(files[0]);
    }
  };

  const handleInsertHyperlink = () => {
    if (!helperLinkUrl || !helperLinkUrl.trim()) return;
    const textToInsert = `[${(helperLinkText || "超级链接").trim()}](${helperLinkUrl.trim()})`;
    
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = postForm.content;
      
      const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
      
      setPostForm({
        ...postForm,
        content: newValue
      });
      
      // Refocus and place cursor position
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + textToInsert.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 50);
    } else {
      setPostForm({
        ...postForm,
        content: postForm.content + (postForm.content ? "\n" : "") + textToInsert
      });
    }
    
    setHelperLinkText("");
    setHelperLinkUrl("");
  };

  const fillExampleLink = () => {
    setHelperLinkText("飞书云端文档");
    setHelperLinkUrl("https://eong2ghef0.feishu.cn/docx/NVG7do0jqonBphx3DvJcQjVNngf?from=from_copylink");
  };

  // Sync AI writer title with current editor form title automatically
  useEffect(() => {
    if (postForm.title) {
      setAiWriterTitleInput(postForm.title);
    }
  }, [postForm.title]);

  // Load all comments
  const fetchAllComments = async () => {
    try {
      const res = await fetch("/api/comments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllComments(data);
      }
    } catch (e) {
      console.error("Error loading all comments", e);
    }
  };

  // Load backend private settings
  const fetchPrivateSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Since getSettings returns public, let's also pull standard
        setSettings({
          title: data.title || "Panda AI 博客",
          bloggerName: data.bloggerName || "熊猫 AI 主理人",
          bloggerBio: data.bloggerBio || "",
          bloggerAvatar: data.bloggerAvatar || "",
          aboutContent: data.aboutContent || "",
          adminPassword: token // Use active token as fallback password display
        });
      }
    } catch (e) {
      console.error("Error loading settings", e);
    }
  };

  useEffect(() => {
    fetchAllComments();
    fetchPrivateSettings();
  }, [activeTab]);

  // Handle Settings Save
  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check for empty password
    if (!settings.adminPassword || !settings.adminPassword.trim()) {
      alert("密码不能为空！已为您恢复默认或当前密码。");
      setSettings(prev => ({ ...prev, adminPassword: token }));
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveStatus("success");
        // Propagate newly secured password back up to replace standard token
        if (onTokenChange && settings.adminPassword !== token) {
          onTokenChange(settings.adminPassword);
        }
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      setSaveStatus("error");
    }
  };

  // Handle Comment Approve
  const handleApproveComment = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAllComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Comment Reply
  const handleReplyComment = async (id: string) => {
    const replyText = replyInputMap[id];
    if (!replyText || !replyText.trim()) return;

    try {
      const res = await fetch(`/api/comments/${id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        setReplyInputMap({ ...replyInputMap, [id]: "" });
        fetchAllComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Comment Delete
  const handleCommentDelete = async (id: string) => {
    if (!confirm("确定要彻底删除这条评论吗？")) return;
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAllComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Post Form (New or Edit)
  const handleOpenPostForm = (post: Post | null) => {
    if (post) {
      // Edit mode
      setEditingPostId(post.id);
      setPostForm({
        title: post.title,
        category: post.category,
        tagsString: post.tags.join(", "),
        summary: post.summary,
        content: post.content,
        coverImage: post.coverImage,
        author: post.author,
        readingTime: post.readingTime
      });
      setAiWriterTitleInput(post.title);
    } else {
      // Create mode
      setEditingPostId(null);
      setPostForm({
        title: "",
        category: "技术",
        tagsString: "技术, AI",
        summary: "",
        content: "",
        coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
        author: "熊猫 AI 主理人",
        readingTime: "5 分钟"
      });
      setAiWriterTitleInput("");
    }
    setAiWriterOutput("");
    setPostFormStatus("idle");
    setIsEditingPost(true);
  };

  // Handle Post Save Submit
  const handlePostSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content || !postForm.summary) {
      alert("请填写标题、内容及摘要！");
      return;
    }
    setPostFormStatus("saving");

    const tags = postForm.tagsString
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      title: postForm.title,
      category: postForm.category,
      tags,
      summary: postForm.summary,
      content: postForm.content,
      coverImage: postForm.coverImage,
      author: postForm.author,
      readingTime: postForm.readingTime,
      createdAt: new Date().toISOString()
    };

    try {
      const url = editingPostId ? `/api/posts/${editingPostId}` : "/api/posts";
      const method = editingPostId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPostFormStatus("success");
        onRefreshPosts(); // Trigger reload
        setTimeout(() => {
          setIsEditingPost(false);
          setEditingPostId(null);
        }, 1200);
      } else {
        setPostFormStatus("error");
      }
    } catch (err) {
      setPostFormStatus("error");
    }
  };

  // Handle Post Delete
  const handlePostDelete = async (id: string) => {
    if (!confirm("确定要彻底删除这篇文章和它相关的所有留言吗？操作无法撤清。")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle AI Writer Activation
  const handleCallAiWriter = async () => {
    if (!aiWriterTitleInput.trim()) {
      alert("请至少输入文章标题，以便 AI 助手为您提供灵感！");
      return;
    }
    setIsAiWriterLoading(true);
    setAiWriterOutput("");

    // Read full markdown or outline details context
    const contentContext = aiWriterTask === "summary" ? postForm.content : aiWriterPromptInput;

    try {
      const res = await fetch("/api/ai/writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          task: aiWriterTask,
          title: aiWriterTitleInput,
          content: contentContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiWriterOutput(data.result);
      } else {
        setAiWriterOutput("【提示】未配置 GEMINI_API_KEY，或 AI 无法正常连线。请验证环境变量。");
      }
    } catch (error) {
      setAiWriterOutput("请求失败，请稍后重发。");
    } finally {
      setIsAiWriterLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="admin-dashboard-wrapper">
      
      {/* Dashboard Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#6c6764]">控制面板</span>
          <h2 className="font-display text-3xl font-bold text-stone-950 mt-1">
            博客创作者中心
          </h2>
          <p className="font-serif text-stone-600 text-xs mt-1 italic">欢迎回归主理人！在这发布新观点、审核评论及微调博客参数。</p>
        </div>

        {/* Top Actions navigation shortcut */}
        <div className="flex space-x-2 shrink-0">
          <button
            onClick={() => onNavigate("首页")}
            className="rounded-none border border-stone-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            返回首页查看
          </button>
          {!isEditingPost && (
            <button
              onClick={() => handleOpenPostForm(null)}
              className="flex items-center space-x-1 border border-stone-950 bg-stone-950 px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-[#fafaf9] hover:bg-stone-850 transition-all cursor-pointer rounded-none"
            >
              <Plus className="h-4 w-4" />
              <span>新写博文</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dashboard Segment */}
      {!isEditingPost ? (
        <div className="space-y-6">
          {/* Main Module Tabs selector */}
          <div className="flex border-b border-stone-200">
            {[
              { id: "posts", label: `博文管理 (${posts.length})`, icon: FileText },
              { id: "comments", label: `留言审核 (${allComments.length})`, icon: MessageSquare },
              { id: "settings", label: "核心参数", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-5 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer uppercase tracking-wider text-xs ${
                    isActive
                      ? "border-stone-900 text-stone-950 font-bold"
                      : "border-transparent text-stone-500 hover:text-stone-850"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Pages */}
          <div>
            {/* POSTS MANAGEMENT TAB */}
            {activeTab === "posts" && (
              <div className="bg-white rounded-none border border-stone-200 overflow-hidden shadow-xs">
                {posts.length === 0 ? (
                  <div className="p-12 text-center text-stone-400">
                    目前还没有发表任何博文，点击右上角写下第一篇思考大作！
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100 text-xs font-bold uppercase text-stone-400 tracking-wider">
                          <th className="p-4 pl-6">文章标题</th>
                          <th className="p-4">分类归属</th>
                          <th className="p-4">发表时间</th>
                          <th className="p-4 text-center">数据指标</th>
                          <th className="p-4 pr-6 text-right">管理操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-stone-900 max-w-[300px] truncate">
                              {post.title}
                            </td>
                            <td className="p-4">
                              <span className="rounded-none bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-900 border border-stone-200">
                                {post.category}
                              </span>
                            </td>
                            <td className="p-4 text-stone-550 font-mono text-xs">
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center space-x-4 text-xs font-semibold text-stone-500">
                                <span className="flex items-center space-x-1" title="Views">
                                  <Eye className="h-3.5 w-3.5 text-stone-400" />
                                  <span>{post.views}</span>
                                </span>
                                <span className="flex items-center space-x-1" title="Likes">
                                  <Heart className="h-3.5 w-3.5 text-stone-400" />
                                  <span>{post.likes}</span>
                                </span>
                              </div>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenPostForm(post)}
                                className="inline-flex items-center p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-none border border-transparent hover:border-stone-200 transition-colors cursor-pointer"
                                title="编辑博文"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handlePostDelete(post.id)}
                                className="inline-flex items-center p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-none border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                title="删除博文"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* COMMENTS APPROVAL TAB */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                {allComments.length === 0 ? (
                  <div className="bg-white rounded-none border border-stone-200 p-12 text-center text-stone-500 font-serif text-sm">
                    博文下目前干干净净，暂无任何交流留言。
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allComments.map((comm) => (
                      <div 
                        key={comm.id} 
                        className={`bg-white rounded-none border p-5 shadow-xs transition-colors ${
                          !comm.isApproved ? "border-stone-400 bg-stone-50/50" : "border-stone-200"
                        }`}
                      >
                        {/* Status Label header */}
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{comm.authorName}</span>
                            <span className="text-xs text-stone-400">({comm.authorEmail})</span>
                            <span className="text-stone-350"> • </span>
                            <span className="text-xs text-stone-500 font-mono">
                              针对文章ID：<code className="bg-stone-100 px-1 rounded-none text-stone-700 font-sans">{comm.postId}</code>
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!comm.isApproved ? (
                              <span className="inline-flex items-center space-x-1 rounded-none bg-stone-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                <Info className="h-3 w-3" />
                                <span>待审核</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 rounded-none bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-850 border border-stone-200">
                                <CheckCircle className="h-3 w-3" />
                                <span>已发表</span>
                              </span>
                            )}
                            <span className="text-xs text-stone-400 font-mono">{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Comment Core Content */}
                        <p className="font-serif text-xs leading-relaxed text-stone-700 mb-4 bg-stone-50/80 p-3 rounded-none border border-stone-200 whitespace-pre-line">{comm.content}</p>

                        {/* Reply detail if exists */}
                        {comm.reply && (
                          <div className="bg-[#fafaf9] p-3 mb-4 rounded-none border border-stone-250 text-xs text-stone-900">
                            <p className="font-bold text-stone-950 mb-0.5 uppercase tracking-widest text-[9px]">博主历史答复：</p>
                            <p className="font-serif text-stone-600 italic">{comm.reply}</p>
                          </div>
                        )}

                        {/* Operation tools panel */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-stone-100 pt-3.5">
                          
                          {/* Write dynamic reply box */}
                          <div className="flex-1 max-w-lg relative flex items-center">
                            <input
                              type="text"
                              value={replyInputMap[comm.id] || ""}
                              onChange={(e) => setReplyInputMap({ ...replyInputMap, [comm.id]: e.target.value })}
                              placeholder={comm.reply ? "修改答复内容..." : "回复他点拨思路..."}
                              className="block w-full rounded-none text-stone-950 border border-stone-300 bg-white px-3.5 py-2 text-xs focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden"
                            />
                            <button
                              onClick={() => handleReplyComment(comm.id)}
                              className="absolute right-1 text-[10px] font-bold uppercase tracking-wider text-stone-900 bg-stone-100 px-3 py-1 rounded-none border border-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
                            >
                              回复
                            </button>
                          </div>

                          {/* Quick audit buttons */}
                          <div className="flex items-center space-x-2 shrink-0 justify-end">
                            {!comm.isApproved && (
                              <button
                                onClick={() => handleApproveComment(comm.id)}
                                className="flex items-center space-x-1 rounded-none bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-850 cursor-pointer"
                              >
                                <Check className="h-4.5 w-4.5" />
                                <span>批准通过</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCommentDelete(comm.id)}
                              className="flex items-center space-x-1 rounded-none border border-stone-300 text-stone-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>彻底删除</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS AND BIOGRAPHY TAB */}
            {activeTab === "settings" && (
              <form onSubmit={handleSettingsSave} className="bg-white rounded-none border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-3xl">
                <div className="border-b border-stone-100 pb-4">
                  <h3 className="font-display text-lg font-bold text-stone-950 uppercase tracking-wider">核心博客设置</h3>
                  <p className="font-serif text-stone-500 text-xs mt-1 italic">定制博客的基础文案，使你的品牌与众不同。</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1.5">博客网站名称</label>
                    <input
                      type="text"
                      required
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden font-sans uppercase tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1.5">主理人署名</label>
                    <input
                      type="text"
                      required
                      value={settings.bloggerName}
                      onChange={(e) => setSettings({ ...settings, bloggerName: e.target.value })}
                      className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1.5">主理人头像 (图片URL)</label>
                    <input
                      type="text"
                      required
                      value={settings.bloggerAvatar}
                      onChange={(e) => setSettings({ ...settings, bloggerAvatar: e.target.value })}
                      className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1.5">副标题一句话简介</label>
                    <input
                      type="text"
                      required
                      value={settings.bloggerBio}
                      onChange={(e) => setSettings({ ...settings, bloggerBio: e.target.value })}
                      className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-1.5">创作者后台登入新密码 (留空则默认为当前可用旧密)</label>
                  <div className="relative flex items-center max-w-sm">
                    <span className="absolute left-3 text-stone-400">
                      <KeyRound className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      value={settings.adminPassword}
                      onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                      placeholder="设置安全密码"
                      className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden uppercase tracking-wider font-semibold font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-550 mb-2">“关于我” 自传内容 (支持标准 Markdown 语法)</label>
                  <textarea
                    rows={8}
                    required
                    value={settings.aboutContent}
                    onChange={(e) => setSettings({ ...settings, aboutContent: e.target.value })}
                    className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden leading-relaxed"
                  />
                </div>

                {saveStatus === "success" && (
                  <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 bg-stone-100 p-3 rounded-none border border-stone-300 font-serif">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>核心设置与自传信息，已全部成功安全存档！</span>
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="text-xs font-bold text-rose-700 bg-rose-50 p-3 rounded-none border border-rose-100">
                    保存出错，密码或网络接口异常。
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-stone-150">
                  <button
                    type="submit"
                    disabled={saveStatus === "saving"}
                    className="rounded-none bg-stone-950 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fafaf9] hover:bg-stone-850 cursor-pointer transition-colors shadow-xs"
                  >
                    {saveStatus === "saving" ? "正在保存中..." : "保存核心参数"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* EDITING / WRITING ORIGINAL BLOG FORM SECTION WITH AI ASSISTANT */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fade-in" id="form-post-editor">
          
          {/* Main write area (2/3 width) */}
          <form onSubmit={postFormSaveClick} className="xl:col-span-2 bg-white rounded-none border border-stone-200 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-stone-950 uppercase tracking-wider">
                  {editingPostId ? "📝 修纂历史大作" : "✨ 新著思考博文"}
                </h3>
                <p className="font-serif text-stone-500 text-xs mt-1 italic">编辑元标题和正文深度论证，支持标准 Markdown 渲染。</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPost(false)}
                className="p-1.5 px-3 border border-stone-300 text-xs font-bold uppercase tracking-wider text-stone-600 rounded-none hover:bg-stone-50 cursor-pointer"
              >
                退出编辑
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">文章大标题 *</label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="请输入文章的核心主标题..."
                  className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">分类归属归档 *</label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer focus:border-stone-900 focus:outline-hidden"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">估算阅读时间 *</label>
                <input
                  type="text"
                  required
                  value={postForm.readingTime}
                  onChange={(e) => setPostForm({ ...postForm, readingTime: e.target.value })}
                  placeholder="例如: 5 分钟"
                  className="block text-[#1c1917] w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider focus:border-stone-900 focus:outline-hidden"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1.5">标签数组 (用英文逗号隔载)</label>
                <input
                  type="text"
                  required
                  value={postForm.tagsString}
                  onChange={(e) => setPostForm({ ...postForm, tagsString: e.target.value })}
                  placeholder="例如: 技术, AI, 机器人"
                  className="block text-[#1c1917] w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Custom Interactive Cover Image Block with Dual Input and File Dnd/Upload */}
            <div className="border border-stone-250 bg-stone-50 p-4 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">封面海报与作者署名 (Cover Poster & Author Name)</span>
                <span className="text-[9px] text-stone-500 font-serif">支持直接拖拽/点击上传本地图片，或手动贴入 URL 地址</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Visual Preview + Drag and Drop Module */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-full min-h-[110px] border border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-stone-950 bg-stone-100/80"
                        : "border-stone-300 bg-white hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center space-y-1.5">
                        <RefreshCw className="h-5 w-5 text-stone-900 animate-spin" />
                        <span className="text-[10px] font-bold text-stone-900">正在往服务器上传并存储...</span>
                      </div>
                    ) : postForm.coverImage ? (
                      <div className="relative group w-full h-full flex flex-col items-center justify-center">
                        <img 
                          src={postForm.coverImage} 
                          alt="Cover preview" 
                          referrerPolicy="no-referrer"
                          className="h-16 w-full object-cover border border-stone-200 shadow-2xs mb-1"
                        />
                        <span className="text-[9px] text-stone-600 font-serif group-hover:text-stone-900 group-hover:underline">点击或拖拽本地图片可更换</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1 text-stone-500">
                        <Upload className="h-5 w-5 text-stone-700" />
                        <span className="text-[10px] font-bold text-stone-950">电脑本地图片拽到这里</span>
                        <span className="text-[9px] font-serif">或 点击选择上传 (15MB以内)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status labels */}
                  {uploadError && (
                    <p className="text-[9px] font-bold text-rose-800 mt-1.5 bg-rose-50 border border-rose-200 p-1 text-center">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="text-[9px] font-bold text-emerald-800 mt-1.5 bg-emerald-50 border border-emerald-100 p-1 text-center font-serif">🎉 图片上传已成功安全关联！</p>
                  )}
                </div>

                {/* Form fields */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 mb-1">封面海报 URL (由上传自适应生成、亦可在此手动贴写)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={postForm.coverImage}
                        onChange={(e) => setPostForm({ ...postForm, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-... 或点击右侧上传"
                        className="flex-1 block text-[#1c1917] rounded-none border border-stone-300 bg-white px-3 py-1.5 text-xs font-mono focus:border-stone-900 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-stone-900 hover:bg-stone-850 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-none shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>上传本地图片</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-stone-500 mb-1">写作者署名</label>
                    <input
                      type="text"
                      required
                      value={postForm.author}
                      onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                      placeholder="署作者大名"
                      className="block text-[#1c1917] w-full rounded-none border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500">博文列表简明摘要 （100-150字，至为关键） *</label>
                <span className="text-[9px] text-stone-900 bg-stone-150 px-1.5 py-0.5 border border-stone-200 rounded-none font-bold uppercase tracking-widest leading-none">
                  📌 提示：可让右侧 Panda AI 智能为你一键提制
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={postForm.summary}
                onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })}
                placeholder="作为博客首页和列表页的引子，需要吸引读者垂青。"
                className="block text-[#1c1917] w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-serif leading-relaxed focus:border-stone-900 focus:outline-hidden"
                id="form-post-summary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-500">写正文 (支持完全 Markdown 丰富语法) *</label>
                <span className="text-[10px] text-stone-400 font-serif">支持 Markdown 超级链接</span>
              </div>

              {/* Enhanced Quick Link helper inputs block */}
              <div className="mb-3 border border-stone-300 bg-stone-50/50 p-2.5 rounded-none text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-stone-800">
                    <Link2 className="h-3.5 w-3.5 text-stone-900" />
                    <span>超级链接助手 (Link Assistant)</span>
                  </div>
                  <button
                    type="button"
                    onClick={fillExampleLink}
                    className="text-[9px] font-bold text-stone-500 hover:text-stone-950 font-sans uppercase tracking-wider underline cursor-pointer"
                  >
                    一键填入飞书范例
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="显示文本 (如: 飞书文档)"
                    value={helperLinkText}
                    onChange={(e) => setHelperLinkText(e.target.value)}
                    className="flex-1 block leading-none text-stone-950 bg-white border border-stone-300 px-2 py-1 text-[11px] placeholder-stone-400 focus:border-stone-900 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="粘贴或输入超级链接 URL 地址..."
                    value={helperLinkUrl}
                    onChange={(e) => setHelperLinkUrl(e.target.value)}
                    className="flex-2 block leading-none text-stone-955 bg-white border border-stone-300 px-2 py-1 text-[11px] font-mono placeholder-stone-400 focus:border-stone-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleInsertHyperlink}
                    disabled={!helperLinkUrl || !helperLinkUrl.trim()}
                    className="bg-stone-950 text-white hover:bg-stone-850 px-4 py-1 text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    插入链接
                  </button>
                </div>
                <p className="text-[9px] text-stone-500 font-serif leading-tight">
                  输入参数并点击“插入链接”，即可在下方写入区域的光标聚焦处自动生成 `[显示文本](URL)` 语法的超链接。
                </p>
              </div>

              <textarea
                ref={contentTextareaRef}
                required
                rows={12}
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                placeholder="开始书写你震撼视听的作品内容吧！"
                className="block text-[#1c1917] w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-xs font-mono leading-relaxed focus:border-stone-900 focus:outline-hidden"
                id="form-post-content"
              />
            </div>

            {postFormStatus === "success" && (
              <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 bg-stone-100 p-3 rounded-none border border-stone-300">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>发表及归档成功！正在安全返回列表目录...</span>
              </div>
            )}
            {postStatusErrorMessage()}

            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsEditingPost(false)}
                className="rounded-none border border-stone-300 bg-white px-4.5 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={postFormStatus === "saving" || postFormStatus === "success"}
                className="rounded-none bg-stone-950 px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#fafaf9] hover:bg-stone-850 cursor-pointer disabled:opacity-50"
                id="btn-post-save-submit"
              >
                {postFormStatus === "saving" ? "正在发表中..." : "立刻发表归集"}
              </button>
            </div>
          </form>

          {/* AI Helper panels (1/3 width) */}
          <div className="xl:col-span-1 space-y-5 sticky top-24">
            
            {/* AI Helper Workspace */}
            <div className="rounded-none border border-stone-200 bg-stone-50 p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-stone-250 pb-3">
                <div className="h-7 w-7 rounded-none bg-stone-950 text-stone-100 font-black flex items-center justify-center font-display text-xs">
                  P
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-950 uppercase tracking-widest">Panda AI 创作伙伴</h3>
                  <p className="text-[9px] text-stone-500 font-serif italic">人机共创，效率如风</p>
                </div>
              </div>

              {/* Task select */}
              <div>
                <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">调配智能任务：</label>
                <div className="grid grid-cols-3 gap-1 px-1 py-1 rounded-none border border-stone-200 bg-white shadow-inner font-medium">
                  {[
                    { id: "summary", label: "自动摘要" },
                    { id: "outline", label: "大纲推衍" },
                    { id: "expand", label: "草稿润增" }
                  ].map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setAiWriterTask(task.id as any)}
                      className={`py-1 rounded-none text-[10px] font-bold text-center transition-all cursor-pointer ${
                        aiWriterTask === task.id
                          ? "bg-stone-950 text-white"
                          : "text-stone-500 hover:text-stone-950"
                      }`}
                    >
                      {task.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for AI title context */}
              <div>
                <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">文章标题关联：</label>
                <input
                  type="text"
                  value={aiWriterTitleInput}
                  onChange={(e) => setAiWriterTitleInput(e.target.value)}
                  placeholder="当前博文草拟标题"
                  className="block text-stone-950 w-full rounded-none border border-stone-300 bg-white px-3 py-1.5 text-xs focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              {/* Inputs specific to tasks */}
              {aiWriterTask === "summary" && (
                <div className="text-[10px] text-stone-600 leading-normal bg-white p-2.5 rounded-none border border-stone-200 font-serif italic">
                  ℹ️ <span className="font-sans font-bold uppercase tracking-wider text-stone-850">自动摘要任务</span> 关联并提取您左侧“正文”输入框里的最新段落，为您自动精缩优雅博文摘要。
                </div>
              )}

              {aiWriterTask !== "summary" && (
                <div>
                  <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                    {aiWriterTask === "outline" ? "希望提现的子要求 (选填)：" : "断篇短论/想要展开的粗略想法 *："}
                  </label>
                  <textarea
                    rows={4}
                    value={aiWriterPromptInput}
                    onChange={(e) => setAiWriterPromptInput(e.target.value)}
                    placeholder={
                      aiWriterTask === "outline"
                        ? "列举特定流派或者重点小标题偏好..."
                        : "在这里留下一两句随性想法，让 AI 帮您润色扩写出千字成文..."
                    }
                    className="block text-stone-900 w-full rounded-none border border-stone-300 bg-white px-3 py-1.5 text-xs font-serif leading-relaxed focus:ring-1 focus:ring-stone-900 focus:border-stone-900 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCallAiWriter}
                disabled={isAiWriterLoading || !aiWriterTitleInput}
                className="w-full flex items-center justify-center space-x-1 py-2 rounded-none bg-stone-950 text-white hover:bg-stone-850 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>{isAiWriterLoading ? "正在冥想精思中..." : "启动 AI 共创撰拟"}</span>
              </button>

              {/* AI Writer Output display with direct COPY capabilities */}
              {aiWriterOutput && (
                <div className="border border-stone-300 p-3.5 rounded-none bg-white space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="text-[10px] font-bold text-stone-950 uppercase tracking-wider">🐼 PANDA AI 解构回执</span>
                    <button
                      type="button"
                      onClick={applyAiOutputToPost}
                      className="text-[9px] font-bold text-stone-950 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-none hover:bg-stone-200 transition-colors uppercase tracking-widest shadow-xs cursor-pointer"
                    >
                      直填左侧编辑区
                    </button>
                  </div>
                  <div className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap font-serif">{aiWriterOutput}</div>
                </div>
              )}

            </div>

            {/* Quick Unsplash collection picker to ease adding cover images */}
            <div className="rounded-none border border-stone-200 bg-white p-4.5 space-y-3">
              <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">推荐海报库一键替换</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "科技", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80" },
                  { label: "历史", image: "https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=600&q=80" },
                  { label: "地缘", image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80" },
                  { label: "自然", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPostForm({ ...postForm, coverImage: item.image })}
                    className="group relative overflow-hidden rounded-none h-14 w-full border border-stone-200 cursor-pointer"
                  >
                    <img src={item.image} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#fafaf9] tracking-widest uppercase">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  // Forms helper to validate input or submit content
  function postFormSaveClick(e: React.FormEvent) {
    handlePostSaveSubmit(e);
  }

  // Inject AI Output to form fields
  function applyAiOutputToPost() {
    if (!aiWriterOutput) return;
    if (aiWriterTask === "summary") {
      setPostForm(prev => ({
        ...prev,
        summary: aiWriterOutput.trim()
      }));
    } else {
      // For outline/expand, append to content body with newline
      setPostForm(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${aiWriterOutput.trim()}` : aiWriterOutput.trim()
      }));
    }
  }

  function postStatusErrorMessage() {
    if (postFormStatus === "error") {
      return (
        <div className="text-xs font-semibold text-rose-800 bg-rose-50 p-3 rounded-none border border-rose-200">
          保存文章出错，请检查接口网络阻抗及您的授权。
        </div>
      );
    }
    return null;
  }
}
