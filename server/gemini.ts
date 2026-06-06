import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export async function askPostAssistant(
  postTitle: string,
  postContent: string,
  question: string,
  chatHistory: { role: "user" | "model"; text: string }[] = []
): Promise<string> {
  try {
    const ai = getGeminiClient();
    
    const systemInstruction = 
      `你是由“Panda AI 博客”开发的智能阅读助理（熊猫 AI 智能助手）。为你集成了针对当前文章的精读分析能力。\n` +
      `当前文章标题：《${postTitle}》\n` +
      `当前文章正文内容如下：\n` +
      `----------\n` +
      `${postContent}\n` +
      `----------\n\n` +
      `请根据上述文章内容、以及读者的提问，提供深度、客观、专业且措辞亲切耐心的解答。如果是发散性问题，可在文章论点基础上进行合理演绎与知识拓展。请使用标准 Markdown 格式排版，并完全用中文回答。`;

    // Map history to the required parts formats
    const formattedContents = chatHistory.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Add current question
    formattedContents.push({
      role: "user",
      parts: [{ text: question }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Panda AI 思考后未能生成有效回答。";
  } catch (error: any) {
    console.error("Gemini API Error in askPostAssistant:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "【系统提示】检测到未配置 `GEMINI_API_KEY` 环境变量。请在 AI Studio 的“Settings > Secrets”面板中增加你的 Gemini 密钥以激活真实的 AI 互动问答。";
    }
    return `【服务提示】熊猫 AI 助理正忙，请稍后再试。错误信息：${error.message || error}`;
  }
}

export async function helpWriter(
  task: "summary" | "outline" | "expand",
  title: string,
  content?: string
): Promise<string> {
  try {
    const ai = getGeminiClient();
    let prompt = "";
    let systemInstruction = "你是一个高水平、辞藻雅致、表达精炼的高级编辑和写作助手。请完全用中文生成标准 Markdown 格式的内容。";

    if (task === "summary") {
      systemInstruction += " 你的任务是为一篇文章生成精炼优雅、字数在 100-150 字左右的中文摘要（Summary），用于博客列表预览。摘要应当富有穿透力和吸引力。";
      prompt = `文章标题：《${title}》\n文章内容：\n${content || ""}\n\n请直接输出摘要文本，不要包含“好的”、“以下是摘要”等任何废话。`;
    } else if (task === "outline") {
      systemInstruction += " 你的任务是根据一个文章标题，建议一套富有逻辑、条理清晰的博客大纲（Outline）。结构需由浅入深，引入现代前沿观点。";
      prompt = `拟写的文章标题为：《${title}》\n\n请输出博客写作大纲，包含核心小标题和写作要点引导。`;
    } else if (task === "expand") {
      systemInstruction += " 你的任务是根据用户的标题和提供的一些零碎论点、草稿，润色并扩写成一段逻辑严密、论证有力、文采上佳的正式博客章节（Content Expansion）。";
      prompt = `拟写文章标题：《${title}》\n现有草稿/点子：\n${content || ""}\n\n请扩写扩写这段草稿。要求过渡自然，论述饱满，重点段落可加入引言或排版技巧。`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    return response.text || "未能生成灵感内容。";
  } catch (error: any) {
    console.error("Gemini API Error in helpWriter:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "【系统提示】未发现 `GEMINI_API_KEY`。请在 Settings > Secrets 面板中增加你的 API 密钥，即可使用 AI 自动摘要、提纲策划和草稿扩写！";
    }
    return `写作助手暂时无法调用，错误原因：${error.message || error}`;
  }
}
