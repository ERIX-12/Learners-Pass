export async function analyzeNote(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/notes/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze note");
  }

  return response.json();
}

export async function generateQuiz(content: string, difficulty: "easy" | "medium" | "hard" = "medium") {
  const response = await fetch("/api/notes/generate-quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, difficulty }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate quiz");
  }

  return response.json();
}

export async function chatWithTutor(messages: { role: string; content: string }[], context: string) {
  const response = await fetch("/api/tutor/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    throw new Error("Failed to chat with tutor");
  }

  return response.json();
}

export async function generateFlashcards(content: string, count: number = 10) {
  const response = await fetch("/api/notes/generate-flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, count }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate flashcards");
  }

  return response.json();
}

export interface TimetableSubject {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  examDate?: string;
  targetScore?: number;
  targetReviews?: number;
}

export interface TimetableConfig {
  subjects: TimetableSubject[];
  availableHours: number;
  studySlotPreference: "morning" | "afternoon" | "evening" | "any";
  includeQuizzes: boolean;
  breakFrequency: "pomodoro" | "short_breaks" | "none";
}

export async function generateTimetable(config: TimetableConfig) {
  const response = await fetch("/api/notes/generate-timetable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error("Failed to generate study timetable");
  }

  return response.json();
}
