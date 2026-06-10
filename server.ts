import express from "express";
import path from "path";
import fs from "fs";
import { dbService } from "./server/db.js";
import { put } from "@vercel/blob";
import { askPostAssistant, helpWriter } from "./server/gemini.js";

// Helper to authenticate Admin requests via password in database
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
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

const app = express();
const PORT = process.env.PORT || 3000;

  // Request body parsing - increased limits for base64 image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // --- API Routes ---

  // Upload Image - Vercel Blob client upload token handler
  app.post("/api/upload", async (req, res) => {
    try {
      const { handleUpload } = await import("@vercel/blob/client");

      // handleUpload expects a standard Web API Request, not Express req.
      // We must build it manually so Vercel Blob can resolve the callback URL correctly.
      const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;

      const headerEntries: [string, string][] = Object.entries(req.headers)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v)]);

      const webRequest = new Request(fullUrl, {
        method: "POST",
        headers: new Headers(headerEntries),
        body: JSON.stringify(req.body),
      });

      const response = await handleUpload({
        body: req.body,
        request: webRequest,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          // Verify the auth token passed as clientPayload by the browser
          const token = clientPayload;
          const privateSettings = await dbService.getPrivateSettings();
          if (!token || token !== privateSettings.adminPassword) {
            throw new Error("Unauthorized: invalid token");
          }
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"],
            maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          };
        },
        onUploadCompleted: async ({ blob }) => {
          console.log("Image upload completed:", blob.url);
        },
      });

      res.json(response);
    } catch (error: any) {
      console.error("Upload error:", error);
      const statusCode = String(error.message).startsWith("Unauthorized") ? 401 : 500;
      res.status(statusCode).json({ error: error.message || "上传凭证获取失败" });
    }
  });
  
  // Auth Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = req.body;
      const privateSettings = await dbService.getPrivateSettings();
      if (password === privateSettings.adminPassword) {
        res.json({ token: privateSettings.adminPassword, success: true });
      } else {
        res.status(401).json({ success: false, error: "密码错误" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Auth Status Check
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

  // Get Posts (with optional Category filter)
  app.get("/api/posts", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const posts = await dbService.getPosts(category);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "获取文章失败" });
    }
  });

  // Get Single Post (and increment view count)
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const post = await dbService.getPostById(id, true);
      if (post) {
        res.json(post);
      } else {
        res.status(404).json({ error: "文章未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "获取文章详情失败" });
    }
  });

  // Create Post
  app.post("/api/posts", authMiddleware, async (req, res) => {
    try {
      const post = await dbService.createPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: "创建文章失败" });
    }
  });

  // Update Post
  app.put("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedPost = await dbService.updatePost(id, req.body);
      if (updatedPost) {
        res.json(updatedPost);
      } else {
        res.status(404).json({ error: "更新失败：文章未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "更新文章失败" });
    }
  });

  // Delete Post
  app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await dbService.deletePost(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "删除失败：文章未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "删除文章失败" });
    }
  });

  // Like Post
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const id = req.params.id;
      const post = await dbService.likePost(id);
      if (post) {
        res.json({ success: true, likes: post.likes });
      } else {
        res.status(404).json({ error: "文章未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "点赞失败" });
    }
  });

  // Get Comments for Post
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;
      const includeUnapproved = req.query.includeUnapproved === "true";
      const comments = await dbService.getCommentsForPost(postId, includeUnapproved);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "获取评论失败" });
    }
  });

  // Create Comment
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = req.params.postId;
      const { authorName, authorEmail, content } = req.body;
      if (!authorName || !authorEmail || !content) {
        res.status(400).json({ error: "请填写所有必填字段" });
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
      res.status(500).json({ error: "发表评论失败" });
    }
  });

  // Admin: Get all Comments for moderation
  app.get("/api/comments", authMiddleware, async (req, res) => {
    try {
      const comments = await dbService.getAllComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "获取所有评论失败" });
    }
  });

  // Admin: Approve Comment
  app.post("/api/comments/:id/approve", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const comment = await dbService.approveComment(id);
      if (comment) {
        res.json(comment);
      } else {
        res.status(404).json({ error: "评论未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "审核评论失败" });
    }
  });

  // Admin: Reply and Auto-approve Comment
  app.post("/api/comments/:id/reply", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { reply } = req.body;
      const comment = await dbService.replyToComment(id, reply);
      if (comment) {
        res.json(comment);
      } else {
        res.status(404).json({ error: "评论未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "回复评论失败" });
    }
  });

  // Admin: Delete Comment
  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await dbService.deleteComment(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "评论未找到" });
      }
    } catch (error) {
      res.status(500).json({ error: "删除评论失败" });
    }
  });

  // Get Categories with article counts
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbService.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "获取分类失败" });
    }
  });

  // Get Blog Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await dbService.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "获取博主设置失败" });
    }
  });

  // Admin: Update Settings
  app.post("/api/settings", authMiddleware, async (req, res) => {
    try {
      const updatedSettings = await dbService.updateSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: "保存设置失败" });
    }
  });

  // --- AI Interactive Assistant Helper ---
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { postTitle, postContent, question, chatHistory } = req.body;
      if (!postTitle || !postContent || !question) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      const answer = await askPostAssistant(postTitle, postContent, question, chatHistory);
      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "AI fail" });
    }
  });

  // --- AI Writer Helper in Editor ---
  app.post("/api/ai/writer", authMiddleware, async (req, res) => {
    try {
      const { task, title, content } = req.body;
      if (!task || !title) {
        res.status(400).json({ error: "Missing task or title" });
        return;
      }
      const result = await helpWriter(task, title, content);
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "AI fail" });
    }
  });

  // --- Vite & Production static serving ---
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Local Dev Server is running on http://localhost:${PORT}`);
      });
    });
  } else {
    // 生产环境中，由 Vercel 托管静态页面。保留此回退可兼顾本地 build 测试。
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

export default app;
