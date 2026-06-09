import { Post, Comment, Category } from "../src/types";

interface DBData {
  posts: Post[];
  comments: Comment[];
  adminSettings: {
    title: string;
    bloggerName: string;
    bloggerBio: string;
    bloggerAvatar: string;
    adminPassword?: string;
    aboutContent: string;
  };
}

let kvClient: any = null;
let memoryDB: DBData | null = null;

async function getKV() {
  if (kvClient !== null) return kvClient;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const mod = await import("@vercel/kv");
      kvClient = mod.kv;
      return kvClient;
    } catch (e) {
      console.error("Failed to load @vercel/kv", e);
    }
  }
  return null;
}

async function readDB(): Promise<DBData> {
  try {
    const kv = await getKV();
    if (kv) {
      const data = await kv.get<DBData>("blog_db");
      if (data) {
        return data;
      }
    } else if (memoryDB) {
      return memoryDB;
    }
  } catch (error) {
    console.error("Error reading database from KV, using fallback empty state", error);
  }
  
  const defaultData: DBData = {
    posts: [],
    comments: [],
    adminSettings: {
      title: "Panda AI 博客",
      bloggerName: "熊猫 AI 主理人",
      bloggerBio: "Panda AI 博客主理人",
      bloggerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      adminPassword: "admin",
      aboutContent: "关于我的内容暂未编辑。"
    }
  };
  
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set("blog_db", defaultData);
    } else {
      memoryDB = defaultData;
    }
  } catch (e) {
    console.error("Failed to initialize KV store", e);
  }
  return defaultData;
}

async function writeDB(data: DBData): Promise<void> {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set("blog_db", data);
    } else {
      memoryDB = data;
    }
  } catch (error) {
    console.error("Error writing database to KV", error);
  }
}

export const dbService = {
  // Posts
  getPosts: async (category?: string): Promise<Post[]> => {
    const db = await readDB();
    if (category && category !== "首页") {
      return db.posts.filter(p => p.category === category);
    }
    return db.posts;
  },

  getPostById: async (id: string, incrementViews = false): Promise<Post | null> => {
    const db = await readDB();
    const index = db.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    if (incrementViews) {
      db.posts[index].views += 1;
      await writeDB(db);
    }
    return db.posts[index];
  },

  createPost: async (postData: Omit<Post, "id" | "views" | "likes">): Promise<Post> => {
    const db = await readDB();
    const newPost: Post = {
      ...postData,
      id: `post-${Date.now()}`,
      views: 0,
      likes: 0
    };
    db.posts.unshift(newPost);
    await writeDB(db);
    return newPost;
  },

  updatePost: async (id: string, postData: Partial<Post>): Promise<Post | null> => {
    const db = await readDB();
    const index = db.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    db.posts[index] = {
      ...db.posts[index],
      ...postData,
      id // Ensure ID cannot be changed
    };
    await writeDB(db);
    return db.posts[index];
  },

  deletePost: async (id: string): Promise<boolean> => {
    const db = await readDB();
    const index = db.posts.findIndex(p => p.id === id);
    if (index === -1) return false;
    db.posts.splice(index, 1);
    // Delete associated comments
    db.comments = db.comments.filter(c => c.postId !== id);
    await writeDB(db);
    return true;
  },

  likePost: async (id: string): Promise<Post | null> => {
    const db = await readDB();
    const index = db.posts.findIndex(p => p.id === id);
    if (index === -1) return null;
    db.posts[index].likes += 1;
    await writeDB(db);
    return db.posts[index];
  },

  // Comments
  getCommentsForPost: async (postId: string, includeUnapproved = false): Promise<Comment[]> => {
    const db = await readDB();
    const comments = db.comments.filter(c => c.postId === postId);
    if (includeUnapproved) {
      return comments;
    }
    return comments.filter(c => c.isApproved);
  },

  getAllComments: async (): Promise<Comment[]> => {
    const db = await readDB();
    return db.comments;
  },

  createComment: async (commentData: Omit<Comment, "id" | "createdAt" | "isApproved">): Promise<Comment> => {
    const db = await readDB();
    const newComment: Comment = {
      ...commentData,
      id: `comm-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isApproved: false // Require admin approval by default
    };
    db.comments.push(newComment);
    await writeDB(db);
    return newComment;
  },

  approveComment: async (id: string): Promise<Comment | null> => {
    const db = await readDB();
    const index = db.comments.findIndex(c => c.id === id);
    if (index === -1) return null;
    db.comments[index].isApproved = true;
    await writeDB(db);
    return db.comments[index];
  },

  replyToComment: async (id: string, replyText: string): Promise<Comment | null> => {
    const db = await readDB();
    const index = db.comments.findIndex(c => c.id === id);
    if (index === -1) return null;
    db.comments[index].reply = replyText;
    db.comments[index].isApproved = true; // Auto-approve if replied to
    await writeDB(db);
    return db.comments[index];
  },

  deleteComment: async (id: string): Promise<boolean> => {
    const db = await readDB();
    const index = db.comments.findIndex(c => c.id === id);
    if (index === -1) return false;
    db.comments.splice(index, 1);
    await writeDB(db);
    return true;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const db = await readDB();
    const countsMap: { [key: string]: number } = {};
    db.posts.forEach(p => {
      countsMap[p.category] = (countsMap[p.category] || 0) + 1;
    });

    const categoriesList = [
      { id: "politics", name: "政治", slug: "politics", description: "关于地缘政治、治理结构与公共事务的思考。" },
      { id: "history", name: "历史", slug: "history", description: "穿梭微观史与宏观演进，探索文明之迹。" },
      { id: "culture", name: "文化", slug: "culture", description: "探讨赛博朋克与传统人文的跨国叙事。" },
      { id: "tech", name: "技术", slug: "technical", description: "紧跟大模型与具身智能科技前沿浪潮。" },
      { id: "economy", name: "经济", slug: "economy", description: "拆解宏观价值链、数智转型与经济韧性。" },
      { id: "society", name: "社会", slug: "society", description: "重构消失的附近人生，洞察社会契约。" },
      { id: "diplomacy", name: "外交", slug: "diplomacy", description: "分析大国绿色气候博弈与多极角力。" },
      { id: "geo", name: "地理", slug: "geo", description: "解开陆地海洋撕裂奥秘，领略地球奇迹。" }
    ];

    return categoriesList.map(cat => ({
      ...cat,
      count: countsMap[cat.name] || 0
    }));
  },

  // Settings
  getSettings: async () => {
    const db = await readDB();
    const { adminPassword, ...publicSettings } = db.adminSettings;
    return publicSettings;
  },

  getPrivateSettings: async () => {
    const db = await readDB();
    return db.adminSettings;
  },

  updateSettings: async (settingsData: Partial<DBData["adminSettings"]>): Promise<any> => {
    const db = await readDB();
    db.adminSettings = {
      ...db.adminSettings,
      ...settingsData
    };
    await writeDB(db);
    const { adminPassword, ...publicSettings } = db.adminSettings;
    return publicSettings;
  }
};
