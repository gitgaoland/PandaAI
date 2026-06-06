var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// server/db.ts
var import_promises = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = import_path.default.join(process.cwd(), "server", "db.json");
async function readDB() {
  try {
    const data = await import_promises.default.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, using fallback empty state", error);
    return {
      posts: [],
      comments: [],
      adminSettings: {
        title: "Panda AI \u535A\u5BA2",
        bloggerName: "\u718A\u732B AI \u4E3B\u7406\u4EBA",
        bloggerBio: "Panda AI \u535A\u5BA2\u4E3B\u7406\u4EBA",
        bloggerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        adminPassword: "admin",
        aboutContent: "\u5173\u4E8E\u6211\u7684\u5185\u5BB9\u6682\u672A\u7F16\u8F91\u3002"
      }
    };
  }
}
async function writeDB(data) {
  await import_promises.default.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}
var dbService = {
  // Posts
  getPosts: async (category) => {
    const db = await readDB();
    if (category && category !== "\u9996\u9875") {
      return db.posts.filter((p) => p.category === category);
    }
    return db.posts;
  },
  getPostById: async (id, incrementViews = false) => {
    const db = await readDB();
    const index = db.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    if (incrementViews) {
      db.posts[index].views += 1;
      await writeDB(db);
    }
    return db.posts[index];
  },
  createPost: async (postData) => {
    const db = await readDB();
    const newPost = {
      ...postData,
      id: `post-${Date.now()}`,
      views: 0,
      likes: 0
    };
    db.posts.unshift(newPost);
    await writeDB(db);
    return newPost;
  },
  updatePost: async (id, postData) => {
    const db = await readDB();
    const index = db.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    db.posts[index] = {
      ...db.posts[index],
      ...postData,
      id
      // Ensure ID cannot be changed
    };
    await writeDB(db);
    return db.posts[index];
  },
  deletePost: async (id) => {
    const db = await readDB();
    const index = db.posts.findIndex((p) => p.id === id);
    if (index === -1) return false;
    db.posts.splice(index, 1);
    db.comments = db.comments.filter((c) => c.postId !== id);
    await writeDB(db);
    return true;
  },
  likePost: async (id) => {
    const db = await readDB();
    const index = db.posts.findIndex((p) => p.id === id);
    if (index === -1) return null;
    db.posts[index].likes += 1;
    await writeDB(db);
    return db.posts[index];
  },
  // Comments
  getCommentsForPost: async (postId, includeUnapproved = false) => {
    const db = await readDB();
    const comments = db.comments.filter((c) => c.postId === postId);
    if (includeUnapproved) {
      return comments;
    }
    return comments.filter((c) => c.isApproved);
  },
  getAllComments: async () => {
    const db = await readDB();
    return db.comments;
  },
  createComment: async (commentData) => {
    const db = await readDB();
    const newComment = {
      ...commentData,
      id: `comm-${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isApproved: false
      // Require admin approval by default
    };
    db.comments.push(newComment);
    await writeDB(db);
    return newComment;
  },
  approveComment: async (id) => {
    const db = await readDB();
    const index = db.comments.findIndex((c) => c.id === id);
    if (index === -1) return null;
    db.comments[index].isApproved = true;
    await writeDB(db);
    return db.comments[index];
  },
  replyToComment: async (id, replyText) => {
    const db = await readDB();
    const index = db.comments.findIndex((c) => c.id === id);
    if (index === -1) return null;
    db.comments[index].reply = replyText;
    db.comments[index].isApproved = true;
    await writeDB(db);
    return db.comments[index];
  },
  deleteComment: async (id) => {
    const db = await readDB();
    const index = db.comments.findIndex((c) => c.id === id);
    if (index === -1) return false;
    db.comments.splice(index, 1);
    await writeDB(db);
    return true;
  },
  // Categories
  getCategories: async () => {
    const db = await readDB();
    const countsMap = {};
    db.posts.forEach((p) => {
      countsMap[p.category] = (countsMap[p.category] || 0) + 1;
    });
    const categoriesList = [
      { id: "politics", name: "\u653F\u6CBB", slug: "politics", description: "\u5173\u4E8E\u5730\u7F18\u653F\u6CBB\u3001\u6CBB\u7406\u7ED3\u6784\u4E0E\u516C\u5171\u4E8B\u52A1\u7684\u601D\u8003\u3002" },
      { id: "history", name: "\u5386\u53F2", slug: "history", description: "\u7A7F\u68AD\u5FAE\u89C2\u53F2\u4E0E\u5B8F\u89C2\u6F14\u8FDB\uFF0C\u63A2\u7D22\u6587\u660E\u4E4B\u8FF9\u3002" },
      { id: "culture", name: "\u6587\u5316", slug: "culture", description: "\u63A2\u8BA8\u8D5B\u535A\u670B\u514B\u4E0E\u4F20\u7EDF\u4EBA\u6587\u7684\u8DE8\u56FD\u53D9\u4E8B\u3002" },
      { id: "tech", name: "\u6280\u672F", slug: "technical", description: "\u7D27\u8DDF\u5927\u6A21\u578B\u4E0E\u5177\u8EAB\u667A\u80FD\u79D1\u6280\u524D\u6CBF\u6D6A\u6F6E\u3002" },
      { id: "economy", name: "\u7ECF\u6D4E", slug: "economy", description: "\u62C6\u89E3\u5B8F\u89C2\u4EF7\u503C\u94FE\u3001\u6570\u667A\u8F6C\u578B\u4E0E\u7ECF\u6D4E\u97E7\u6027\u3002" },
      { id: "society", name: "\u793E\u4F1A", slug: "society", description: "\u91CD\u6784\u6D88\u5931\u7684\u9644\u8FD1\u4EBA\u751F\uFF0C\u6D1E\u5BDF\u793E\u4F1A\u5951\u7EA6\u3002" },
      { id: "diplomacy", name: "\u5916\u4EA4", slug: "diplomacy", description: "\u5206\u6790\u5927\u56FD\u7EFF\u8272\u6C14\u5019\u535A\u5F08\u4E0E\u591A\u6781\u89D2\u529B\u3002" },
      { id: "geo", name: "\u5730\u7406", slug: "geo", description: "\u89E3\u5F00\u9646\u5730\u6D77\u6D0B\u6495\u88C2\u5965\u79D8\uFF0C\u9886\u7565\u5730\u7403\u5947\u8FF9\u3002" }
    ];
    return categoriesList.map((cat) => ({
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
  updateSettings: async (settingsData) => {
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

// server/gemini.ts
var import_genai = require("@google/genai");
var aiInstance = null;
function getGeminiClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
async function askPostAssistant(postTitle, postContent, question, chatHistory = []) {
  try {
    const ai = getGeminiClient();
    const systemInstruction = `\u4F60\u662F\u7531\u201CPanda AI \u535A\u5BA2\u201D\u5F00\u53D1\u7684\u667A\u80FD\u9605\u8BFB\u52A9\u7406\uFF08\u718A\u732B AI \u667A\u80FD\u52A9\u624B\uFF09\u3002\u4E3A\u4F60\u96C6\u6210\u4E86\u9488\u5BF9\u5F53\u524D\u6587\u7AE0\u7684\u7CBE\u8BFB\u5206\u6790\u80FD\u529B\u3002
\u5F53\u524D\u6587\u7AE0\u6807\u9898\uFF1A\u300A${postTitle}\u300B
\u5F53\u524D\u6587\u7AE0\u6B63\u6587\u5185\u5BB9\u5982\u4E0B\uFF1A
----------
${postContent}
----------

\u8BF7\u6839\u636E\u4E0A\u8FF0\u6587\u7AE0\u5185\u5BB9\u3001\u4EE5\u53CA\u8BFB\u8005\u7684\u63D0\u95EE\uFF0C\u63D0\u4F9B\u6DF1\u5EA6\u3001\u5BA2\u89C2\u3001\u4E13\u4E1A\u4E14\u63AA\u8F9E\u4EB2\u5207\u8010\u5FC3\u7684\u89E3\u7B54\u3002\u5982\u679C\u662F\u53D1\u6563\u6027\u95EE\u9898\uFF0C\u53EF\u5728\u6587\u7AE0\u8BBA\u70B9\u57FA\u7840\u4E0A\u8FDB\u884C\u5408\u7406\u6F14\u7ECE\u4E0E\u77E5\u8BC6\u62D3\u5C55\u3002\u8BF7\u4F7F\u7528\u6807\u51C6 Markdown \u683C\u5F0F\u6392\u7248\uFF0C\u5E76\u5B8C\u5168\u7528\u4E2D\u6587\u56DE\u7B54\u3002`;
    const formattedContents = chatHistory.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));
    formattedContents.push({
      role: "user",
      parts: [{ text: question }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    return response.text || "Panda AI \u601D\u8003\u540E\u672A\u80FD\u751F\u6210\u6709\u6548\u56DE\u7B54\u3002";
  } catch (error) {
    console.error("Gemini API Error in askPostAssistant:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "\u3010\u7CFB\u7EDF\u63D0\u793A\u3011\u68C0\u6D4B\u5230\u672A\u914D\u7F6E `GEMINI_API_KEY` \u73AF\u5883\u53D8\u91CF\u3002\u8BF7\u5728 AI Studio \u7684\u201CSettings > Secrets\u201D\u9762\u677F\u4E2D\u589E\u52A0\u4F60\u7684 Gemini \u5BC6\u94A5\u4EE5\u6FC0\u6D3B\u771F\u5B9E\u7684 AI \u4E92\u52A8\u95EE\u7B54\u3002";
    }
    return `\u3010\u670D\u52A1\u63D0\u793A\u3011\u718A\u732B AI \u52A9\u7406\u6B63\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002\u9519\u8BEF\u4FE1\u606F\uFF1A${error.message || error}`;
  }
}
async function helpWriter(task, title, content) {
  try {
    const ai = getGeminiClient();
    let prompt = "";
    let systemInstruction = "\u4F60\u662F\u4E00\u4E2A\u9AD8\u6C34\u5E73\u3001\u8F9E\u85FB\u96C5\u81F4\u3001\u8868\u8FBE\u7CBE\u70BC\u7684\u9AD8\u7EA7\u7F16\u8F91\u548C\u5199\u4F5C\u52A9\u624B\u3002\u8BF7\u5B8C\u5168\u7528\u4E2D\u6587\u751F\u6210\u6807\u51C6 Markdown \u683C\u5F0F\u7684\u5185\u5BB9\u3002";
    if (task === "summary") {
      systemInstruction += " \u4F60\u7684\u4EFB\u52A1\u662F\u4E3A\u4E00\u7BC7\u6587\u7AE0\u751F\u6210\u7CBE\u70BC\u4F18\u96C5\u3001\u5B57\u6570\u5728 100-150 \u5B57\u5DE6\u53F3\u7684\u4E2D\u6587\u6458\u8981\uFF08Summary\uFF09\uFF0C\u7528\u4E8E\u535A\u5BA2\u5217\u8868\u9884\u89C8\u3002\u6458\u8981\u5E94\u5F53\u5BCC\u6709\u7A7F\u900F\u529B\u548C\u5438\u5F15\u529B\u3002";
      prompt = `\u6587\u7AE0\u6807\u9898\uFF1A\u300A${title}\u300B
\u6587\u7AE0\u5185\u5BB9\uFF1A
${content || ""}

\u8BF7\u76F4\u63A5\u8F93\u51FA\u6458\u8981\u6587\u672C\uFF0C\u4E0D\u8981\u5305\u542B\u201C\u597D\u7684\u201D\u3001\u201C\u4EE5\u4E0B\u662F\u6458\u8981\u201D\u7B49\u4EFB\u4F55\u5E9F\u8BDD\u3002`;
    } else if (task === "outline") {
      systemInstruction += " \u4F60\u7684\u4EFB\u52A1\u662F\u6839\u636E\u4E00\u4E2A\u6587\u7AE0\u6807\u9898\uFF0C\u5EFA\u8BAE\u4E00\u5957\u5BCC\u6709\u903B\u8F91\u3001\u6761\u7406\u6E05\u6670\u7684\u535A\u5BA2\u5927\u7EB2\uFF08Outline\uFF09\u3002\u7ED3\u6784\u9700\u7531\u6D45\u5165\u6DF1\uFF0C\u5F15\u5165\u73B0\u4EE3\u524D\u6CBF\u89C2\u70B9\u3002";
      prompt = `\u62DF\u5199\u7684\u6587\u7AE0\u6807\u9898\u4E3A\uFF1A\u300A${title}\u300B

\u8BF7\u8F93\u51FA\u535A\u5BA2\u5199\u4F5C\u5927\u7EB2\uFF0C\u5305\u542B\u6838\u5FC3\u5C0F\u6807\u9898\u548C\u5199\u4F5C\u8981\u70B9\u5F15\u5BFC\u3002`;
    } else if (task === "expand") {
      systemInstruction += " \u4F60\u7684\u4EFB\u52A1\u662F\u6839\u636E\u7528\u6237\u7684\u6807\u9898\u548C\u63D0\u4F9B\u7684\u4E00\u4E9B\u96F6\u788E\u8BBA\u70B9\u3001\u8349\u7A3F\uFF0C\u6DA6\u8272\u5E76\u6269\u5199\u6210\u4E00\u6BB5\u903B\u8F91\u4E25\u5BC6\u3001\u8BBA\u8BC1\u6709\u529B\u3001\u6587\u91C7\u4E0A\u4F73\u7684\u6B63\u5F0F\u535A\u5BA2\u7AE0\u8282\uFF08Content Expansion\uFF09\u3002";
      prompt = `\u62DF\u5199\u6587\u7AE0\u6807\u9898\uFF1A\u300A${title}\u300B
\u73B0\u6709\u8349\u7A3F/\u70B9\u5B50\uFF1A
${content || ""}

\u8BF7\u6269\u5199\u6269\u5199\u8FD9\u6BB5\u8349\u7A3F\u3002\u8981\u6C42\u8FC7\u6E21\u81EA\u7136\uFF0C\u8BBA\u8FF0\u9971\u6EE1\uFF0C\u91CD\u70B9\u6BB5\u843D\u53EF\u52A0\u5165\u5F15\u8A00\u6216\u6392\u7248\u6280\u5DE7\u3002`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });
    return response.text || "\u672A\u80FD\u751F\u6210\u7075\u611F\u5185\u5BB9\u3002";
  } catch (error) {
    console.error("Gemini API Error in helpWriter:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "\u3010\u7CFB\u7EDF\u63D0\u793A\u3011\u672A\u53D1\u73B0 `GEMINI_API_KEY`\u3002\u8BF7\u5728 Settings > Secrets \u9762\u677F\u4E2D\u589E\u52A0\u4F60\u7684 API \u5BC6\u94A5\uFF0C\u5373\u53EF\u4F7F\u7528 AI \u81EA\u52A8\u6458\u8981\u3001\u63D0\u7EB2\u7B56\u5212\u548C\u8349\u7A3F\u6269\u5199\uFF01";
    }
    return `\u5199\u4F5C\u52A9\u624B\u6682\u65F6\u65E0\u6CD5\u8C03\u7528\uFF0C\u9519\u8BEF\u539F\u56E0\uFF1A${error.message || error}`;
  }
}

// server.ts
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.substring(7);
    const privateSettings = await dbService.getPrivateSettings();
    if (token === privateSettings.adminPassword) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Incorrect credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Auth Error" });
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "25mb" }));
  app.use(import_express.default.urlencoded({ limit: "25mb", extended: true }));
  const uploadDir = import_path2.default.join(process.cwd(), "uploads");
  if (!import_fs.default.existsSync(uploadDir)) {
    import_fs.default.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", import_express.default.static(uploadDir));
  app.post("/api/upload", authMiddleware, async (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image || !filename) {
        res.status(400).json({ error: "\u7F3A\u5C11\u56FE\u7247\u6570\u636E\u6216\u6587\u4EF6\u540D" });
        return;
      }
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ error: "\u56FE\u7247\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u5FC5\u987B\u4E3A Base64 \u683C\u5F0F" });
        return;
      }
      const buffer = Buffer.from(matches[2], "base64");
      const ext = import_path2.default.extname(filename) || ".jpg";
      const safeName = `cover-${Date.now()}-${Math.floor(Math.random() * 1e5)}${ext}`;
      const filePath = import_path2.default.join(uploadDir, safeName);
      import_fs.default.writeFileSync(filePath, buffer);
      res.json({ url: `/uploads/${safeName}`, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "\u6587\u4EF6\u5199\u5165\u670D\u52A1\u5668\u51FA\u9519" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = req.body;
      const privateSettings = await dbService.getPrivateSettings();
      if (password === privateSettings.adminPassword) {
        res.json({ token: privateSettings.adminPassword, success: true });
      } else {
        res.status(401).json({ success: false, error: "\u5BC6\u7801\u9519\u8BEF" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });
  app.get("/api/auth/check", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.json({ authenticated: false });
        return;
      }
      const token = authHeader.substring(7);
      const privateSettings = await dbService.getPrivateSettings();
      if (token === privateSettings.adminPassword) {
        res.json({ authenticated: true });
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Check failed" });
    }
  });
  app.get("/api/posts", async (req, res) => {
    try {
      const category = req.query.category;
      const posts = await dbService.getPosts(category);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u6587\u7AE0\u5931\u8D25" });
    }
  });
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const post = await dbService.getPostById(id, true);
      if (post) {
        res.json(post);
      } else {
        res.status(404).json({ error: "\u6587\u7AE0\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u6587\u7AE0\u8BE6\u60C5\u5931\u8D25" });
    }
  });
  app.post("/api/posts", authMiddleware, async (req, res) => {
    try {
      const post = await dbService.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "\u521B\u5EFA\u6587\u7AE0\u5931\u8D25" });
    }
  });
  app.put("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedPost = await dbService.updatePost(id, req.body);
      if (updatedPost) {
        res.json(updatedPost);
      } else {
        res.status(404).json({ error: "\u66F4\u65B0\u5931\u8D25\uFF1A\u6587\u7AE0\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u66F4\u65B0\u6587\u7AE0\u5931\u8D25" });
    }
  });
  app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await dbService.deletePost(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "\u5220\u9664\u5931\u8D25\uFF1A\u6587\u7AE0\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u5220\u9664\u6587\u7AE0\u5931\u8D25" });
    }
  });
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const id = req.params.id;
      const post = await dbService.likePost(id);
      if (post) {
        res.json({ success: true, likes: post.likes });
      } else {
        res.status(404).json({ error: "\u6587\u7AE0\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u70B9\u8D5E\u5931\u8D25" });
    }
  });
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;
      const includeUnapproved = req.query.includeUnapproved === "true";
      const comments = await dbService.getCommentsForPost(postId, includeUnapproved);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;
      const { authorName, authorEmail, content } = req.body;
      if (!authorName || !authorEmail || !content) {
        res.status(400).json({ error: "\u8BF7\u586B\u5199\u6240\u6709\u5FC5\u586B\u5B57\u6BB5" });
        return;
      }
      const comment = await dbService.createComment({
        postId,
        authorName,
        authorEmail,
        content
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: "\u53D1\u8868\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.get("/api/comments", authMiddleware, async (req, res) => {
    try {
      const comments = await dbService.getAllComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u6240\u6709\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.post("/api/comments/:id/approve", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const comment = await dbService.approveComment(id);
      if (comment) {
        res.json(comment);
      } else {
        res.status(404).json({ error: "\u8BC4\u8BBA\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u5BA1\u6838\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.post("/api/comments/:id/reply", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { reply } = req.body;
      const comment = await dbService.replyToComment(id, reply);
      if (comment) {
        res.json(comment);
      } else {
        res.status(404).json({ error: "\u8BC4\u8BBA\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u56DE\u590D\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await dbService.deleteComment(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "\u8BC4\u8BBA\u672A\u627E\u5230" });
      }
    } catch (error) {
      res.status(500).json({ error: "\u5220\u9664\u8BC4\u8BBA\u5931\u8D25" });
    }
  });
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbService.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u5206\u7C7B\u5931\u8D25" });
    }
  });
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await dbService.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "\u83B7\u53D6\u535A\u4E3B\u8BBE\u7F6E\u5931\u8D25" });
    }
  });
  app.post("/api/settings", authMiddleware, async (req, res) => {
    try {
      const updatedSettings = await dbService.updateSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: "\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25" });
    }
  });
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { postTitle, postContent, question, chatHistory } = req.body;
      if (!postTitle || !postContent || !question) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      const answer = await askPostAssistant(postTitle, postContent, question, chatHistory);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ error: error.message || "AI fail" });
    }
  });
  app.post("/api/ai/writer", authMiddleware, async (req, res) => {
    try {
      const { task, title, content } = req.body;
      if (!task || !title) {
        res.status(400).json({ error: "Missing task or title" });
        return;
      }
      const result = await helpWriter(task, title, content);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message || "AI fail" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Panda AI Blog Server is strictly running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
