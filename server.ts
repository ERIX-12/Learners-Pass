import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as admin from "firebase-admin";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Firebase Admin (lazy)
let firebaseApp: admin.app.App | null = null;
function getFirebaseAdmin() {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp();
  }
  return firebaseApp;
}

// Initialize GoogleGenAI lazily
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

app.use(express.json());

// Multer for file uploads
const upload = multer({ storage: multer.memoryBuffer() });

// --- API Routes ---

app.post("/api/notes/analyze", upload.single("file"), async (req: any, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    let textContent = "";

    if (file.mimetype === "application/pdf") {
      try {
        const data = await pdf(file.buffer);
        textContent = data.text;
      } catch (err) {
        console.error("PDF Parsing Error:", err);
        textContent = "Failed to parse PDF content. Please try another format or ensure the PDF is not encrypted.";
      }
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      textContent = result.value;
    } else if (file.mimetype.startsWith("text/")) {
      textContent = file.buffer.toString("utf-8");
    } else if (file.mimetype.startsWith("image/")) {
      const ai = getGenAI();
      const imagePart = {
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64"),
        },
      };
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: "Extract all text from this image exactly." }] },
      });
      textContent = response.text || "";
    }

    if (!textContent) return res.status(400).json({ error: "Could not extract text from file" });

    const ai = getGenAI();
    const prompt = `
      Analyze the following student notes and provide a structured JSON response.
      Notes Content: "${textContent.substring(0, 30000)}"
      
      REQUIRED JSON SCHEMA:
      {
        "title": "Descriptive title",
        "subject": "Main subject",
        "topic": "Main topic",
        "contentSummary": "Comprehensive summary",
        "extractedConcepts": [{"term": "string", "definition": "string"}],
        "keyPoints": ["string"],
        "difficulty": "easy|medium|hard"
      }
    `;
    
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(analysisResponse.text || "{}"));
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze note" });
  }
});

app.post("/api/notes/generate-quiz", async (req, res) => {
  try {
    const { content, difficulty = "medium" } = req.body;
    const ai = getGenAI();
    
    const prompt = `
      Generate 5 quiz questions from these notes.
      Content: "${content.substring(0, 20000)}"
      Difficulty: ${difficulty}
      
      REQUIRED JSON SCHEMA:
      {
        "questions": [
          {
            "question": "string",
            "type": "mcq|true_false|fill_blank|short_answer",
            "options": ["string"] (only for mcq),
            "correctAnswer": "string",
            "explanation": "string",
            "difficulty": "${difficulty}"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/notes/generate-flashcards", async (req, res) => {
  try {
    const { content, count = 10 } = req.body;
    const ai = getGenAI();
    
    const prompt = `
      Based on the following notes, generate ${count} high-quality study flashcards.
      Each flashcard should have a clear "front" (question or term) and a concise "back" (answer or definition).
      
      Content: "${content.substring(0, 20000)}"
      
      REQUIRED JSON SCHEMA:
      {
        "flashcards": [
          {
            "front": "Question/Term",
            "back": "Answer/Definition"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

app.post("/api/notes/generate-timetable", async (req, res) => {
  try {
    const { subjects, availableHours, studySlotPreference, includeQuizzes, breakFrequency } = req.body;
    const ai = getGenAI();
    
    const prompt = `
      Create a highly customized, optimized, and personalized study timetable / weekly review schedule for a student based on their subjects, exam dates, available study hours, and specific goal/performance preferences.
      
      STUDENT CONFIGURATION:
      - Subjects details: ${JSON.stringify(subjects || [])}
        (Each subject has a difficulty 'easy' | 'medium' | 'hard', an optional 'examDate', an optional 'targetScore' (0-100), and an optional 'targetReviews' representing the desired number of revision/study slots per week.)
      - Available study hours per day: ${availableHours || 4} hours
      - Preferred study slots of the day: ${studySlotPreference || "any"} (e.g. morning, afternoon, evening, any)
      - Include practice quizzes: ${includeQuizzes ? "Yes" : "No"} (If yes, schedule designated 'quiz' sessions at the end of subjects' study)
      - Study break frequency: ${breakFrequency || "short_breaks"} (e.g., 'pomodoro' which means sessions of 25m study + 5m break, or 'short_breaks' which means 50m study + 10m break, or 'none')
      
      GOAL-ORIENTED ALLOCATION SYSTEM (CRITICAL PRIORITY):
      - For each subject:
        * If a 'targetReviews' is specified (e.g. 6), you MUST prioritize scheduling exactly that number of study/revision sessions for this subject across the 7-day week. If available hours are too tight, balance them proportionally but maximize coverage.
        * If a 'targetScore' is specified (e.g. 85%), you MUST tailor both the "topic" and "description" to directly match this ambition. Higher target scores (e.g., 85%+) require advanced techniques in the generated sessions like "Elite Active Recall", "Feynman Technique formulation", "Strict Past Paper Drilling", and "Complex Multi-variant Practice". Moderate target scores (e.g., 70-80%) should emphasize "Recall-based Summaries" and "High-Yield Topic Mapping".
      - Ensure each session's "description" references these targets to inspire accountability (e.g., "Session 2 of 6 towards target score of 85%").
      
      TIMETABLE GENERATION REQUIREMENTS:
      1. Prioritize subjects with closer exam dates, harder difficulty, and higher/ambitious target scores.
      2. Spread the available hours per day across Monday through Sunday (7 days).
      3. Fit the number of study slots for each subject to approach or achieve its specified 'targetReviews' count for the week.
      4. Adjust session focus and intensity based on the 'targetScore' (e.g., subjects with high targets like 85%+ should feature more rigorous active-recall sessions, quiz buffers, and formula application).
      5. For each study block, allocate key topics (be specific and detailed like 'Differential Calculus Practice' instead of just 'Math') to cover.
      6. Balance different subject blocks across the week so the student doesn't study only one subject all day unless it has an extremely urgent exam.
      7. Include specific breakout moments (breaks) based on their study break frequency choice.
      8. Provide 4 high-quality, personalized study tips. At least one of these tips MUST be a goal-centric tip detailing exactly how to systematically reach their 'targetScore' and fulfill 'targetReviews' for their highest-priority subject.
      
      REQUIRED JSON RESPONSE STRUCTURE:
      {
        "timetable": [
          {
            "day": "Monday",
            "date": "Upcoming Monday",
            "sessions": [
              {
                "time": "09:00 - 09:50",
                "duration": 50,
                "subject": "Mathematics",
                "topic": "Calculus Differentiation",
                "type": "study", 
                "description": "Study differentiation rules and work on practice problems towards target score."
              },
              {
                "time": "09:50 - 10:00",
                "duration": 10,
                "subject": "Break",
                "topic": "Rest & Hydrate",
                "type": "break",
                "description": "Walk around and stretch."
              }
            ]
          }
        ],
        "studyTips": [
          "Tip 1: ...",
          "Tip 2: ..."
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Timetable Gen Error:", error);
    res.status(500).json({ error: "Failed to generate study timetable" });
  }
});

app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;
    const ai = getGenAI();
    
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `
          You are "Learners Pass AI Tutor". You help students understand their notes.
          Use simple language. Provide step-by-step explanations.
          Context from notes: ${context}
        `,
      },
    });
    
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage({ message: lastMessage });
    
    res.json({ content: result.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to chat" });
  }
});

async function startServer() {
  try {
    console.log("Server startup sequence initiated...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    
    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite dev server (middleware mode)...");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false 
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached successfully.");
    } else {
      console.log("Serving production build from dist/");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    console.log(`Attempting to listen on port ${PORT}...`);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is now listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("FATAL ERROR DURING SERVER STARTUP:", error);
    process.exit(1);
  }
}

startServer();
