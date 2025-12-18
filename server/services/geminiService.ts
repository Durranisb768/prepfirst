import { GoogleGenAI, Type } from "@google/genai";

interface GeneratedQuestion {
  question: string;
  question_urdu?: string;
  options: string[];
  options_urdu?: string[];
  correct_answer: string;
  explanation: string;
  explanation_urdu?: string;
}

interface GeneratedQuizResult {
  questions: GeneratedQuestion[];
  theory: string;
}

const getApiKey = (): string | undefined => {
  return process.env.GEMINI_API_KEY;
};

let aiInstance: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI | null => {
  if (aiInstance) return aiInstance;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (e) {
    console.error("Could not initialize Gemini AI:", e);
    return null;
  }
};

const chunkText = (text: string, chunkSize: number = 4000): string[] => {
  if (text.length <= chunkSize) return [text];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + chunkSize, text.length);
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const cutPoint = Math.max(lastPeriod, lastNewline);
      if (cutPoint > i) {
        end = cutPoint + 1;
      }
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getQuizSchema = (enableUrdu: boolean) => {
  const requiredItemFields = ["question", "options", "correct_answer", "explanation"];
  if (enableUrdu) {
    requiredItemFields.push("question_urdu", "options_urdu", "explanation_urdu");
  }

  return {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            question_urdu: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            options_urdu: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_answer: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Concise factual explanation (max 2 sentences)." },
            explanation_urdu: { type: Type.STRING }
          },
          required: requiredItemFields
        }
      }
    },
    required: ["questions"]
  };
};

const generateChunk = async <T>(
  modelId: string,
  prompt: string,
  schema: any,
  instruction: string
): Promise<T> => {
  const ai = getAi();
  if (!ai) throw new Error("AI not initialized - GEMINI_API_KEY not found");

  let lastError: any;
  for (let i = 0; i < 3; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 8192,
          systemInstruction: instruction
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as T;
      }
    } catch (error: any) {
      console.warn(`Chunk generation attempt ${i + 1} failed:`, error?.message || error);
      lastError = error;
      await wait(2000 * Math.pow(2, i));
    }
  }
  throw new Error(`Chunk failed: ${lastError?.message || 'Unknown error'}`);
};

export const generateMCQsFromText = async (
  text: string,
  topicName: string,
  enableUrdu: boolean = false,
  onProgress?: (processed: number, total: number) => void
): Promise<GeneratedQuizResult> => {
  const chunks = chunkText(text);
  let allQuestions: GeneratedQuestion[] = [];

  let instruction = "You are a Forensic Educational Examiner for CSS/PMS exam preparation. Create COMPREHENSIVE MCQ assessments.";
  if (enableUrdu) instruction += " You are also an expert translator to Urdu.";

  console.log(`Processing ${chunks.length} text chunks for topic: ${topicName}`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const prompt = `
    Task: Create an EXHAUSTIVE MCQ quiz based ONLY on the provided text segment (Part ${i + 1} of ${chunks.length}).
    
    Rules:
    1.  **EXHAUSTIVE COVERAGE**: Extract EVERY distinct fact, definition, date, and concept from this text segment into a question.
    2.  **SEQUENCE**: Follow the chronological order of this text segment.
    3.  **QUANTITY**: Generate between 12 to 20 questions for this segment. If the text is dense, aim for 20. If sparse, aim for 12.
    4.  **DEPTH**: Include "Why" and "How" questions, not just "What".
    5.  **OPTIONS**: Provide exactly 4 options (A, B, C, D) for each question.
    6.  **CORRECT_ANSWER**: The correct_answer field must be one of the exact option texts (not A/B/C/D).
    7.  **EXPLANATIONS**: Provide factual explanations for why the answer is correct.
    
    ${enableUrdu ? "REQUIREMENT: PROVIDE URDU TRANSLATIONS for every item including question, options, and explanation." : ""}
    
    Topic Context: "${topicName}"
    
    INPUT TEXT SEGMENT:
    ${chunk}
    `;

    try {
      const result = await generateChunk<{ questions: GeneratedQuestion[] }>(
        'gemini-2.5-flash',
        prompt,
        getQuizSchema(enableUrdu),
        instruction
      );

      if (result && result.questions) {
        allQuestions = [...allQuestions, ...result.questions];
      }

      if (onProgress) {
        onProgress(i + 1, chunks.length);
      }

      if (i < chunks.length - 1) await wait(1500);

    } catch (e) {
      console.error(`Error processing chunk ${i + 1}:`, e);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error("Failed to generate questions from the text. Please check the content.");
  }

  return {
    questions: allQuestions,
    theory: text
  };
};

export const convertToMcqQuestionFormat = (
  questions: GeneratedQuestion[],
  materialId: number
): Array<{
  materialId: number;
  question: string;
  questionUrdu?: string;
  optionA: string;
  optionAUrdu?: string;
  optionB: string;
  optionBUrdu?: string;
  optionC: string;
  optionCUrdu?: string;
  optionD: string;
  optionDUrdu?: string;
  correctAnswer: string;
  explanation?: string;
  explanationUrdu?: string;
  order: number;
}> => {
  return questions.map((q, index) => {
    const options = q.options || [];
    const optionsUrdu = q.options_urdu || [];
    
    const correctIndex = options.findIndex(opt => opt === q.correct_answer);
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] || 'A';

    return {
      materialId,
      question: q.question,
      questionUrdu: q.question_urdu,
      optionA: options[0] || '',
      optionAUrdu: optionsUrdu[0],
      optionB: options[1] || '',
      optionBUrdu: optionsUrdu[1],
      optionC: options[2] || '',
      optionCUrdu: optionsUrdu[2],
      optionD: options[3] || '',
      optionDUrdu: optionsUrdu[3],
      correctAnswer: correctLetter,
      explanation: q.explanation,
      explanationUrdu: q.explanation_urdu,
      order: index
    };
  });
};

export const isGeminiConfigured = (): boolean => {
  return !!getApiKey();
};
