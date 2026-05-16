import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      const systemInstruction = `أنت الآن محرك ألعاب تفاعلية عالي الذكاء (Game Master). دورك هو إدارة لعبة مغامرات وبقاء تفاعلية للمستخدم.
قواعد اللعبة الدائمة التي يجب أن تلتزم بها:
1. ابدأ اللعبة بوضع المستخدم في سيناريو غامض أو حماسي (مثلاً: داخل مدينة مستقبلية مظلمة، أو جزيرة معزولة).
2. في نهاية كل رد، اعرض على اللاعب 3 خيارات مرقمة فقط (1، 2، 3) ليختار منها خطوته القادمة.
3. انتظر رد اللاعب (سيكتب رقم الخيار فقط أو يكتب تصرفاً مخصصاً).
4. بناءً على خيار اللاعب، قم بتحديث مجرى القصة، واصنع تحدياً جديداً.
5. حافظ على العدادات التالية في أسفل كل رد بشكل منظم:
[❤️ الصحة: X% | 🎒 الحقيبة: Y | 🏅 مستوى التركيز: Z%]
(استبدل X و Y و Z بالقيم الحالية بناءً على أحداث القصة).
6. لا تخرج عن دورك أبداً، واجعل الأسلوب غامضاً ومثيراً ومشوقاً.
7. الردود يجب أن تكون باللغة العربية.
8. تأكد من أن الخيارات الثلاثة واضحة ومثيرة للاهتمام.`;

      const contents = [
        ...history,
        { role: 'user', parts: [{ text: message || "ابدأ اللعبة" }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate story" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
