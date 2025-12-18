import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CHUNK_SIZE = 4000;

export interface GeneratedMcq {
  question: string;
  questionUrdu?: string;
  optionA: string;
  optionAUrdu?: string;
  optionB: string;
  optionBUrdu?: string;
  optionC?: string;
  optionCUrdu?: string;
  optionD?: string;
  optionDUrdu?: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  explanationUrdu?: string;
}

export interface ChunkProgress {
  currentChunk: number;
  totalChunks: number;
  questionsGenerated: number;
}

function splitTextIntoChunks(text: string, chunkSize: number = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = Math.min(currentIndex + chunkSize, text.length);
    
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf(".", endIndex);
      const lastNewline = text.lastIndexOf("\n", endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > currentIndex + chunkSize / 2) {
        endIndex = breakPoint + 1;
      }
    }

    chunks.push(text.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }

  return chunks.filter(chunk => chunk.length > 50);
}

export async function generateMcqsFromChunk(
  chunk: string,
  includeUrdu: boolean = false,
  questionsPerChunk: number = 15
): Promise<GeneratedMcq[]> {
  const urduInstruction = includeUrdu 
    ? `Also provide Urdu translations for each question, options, and explanation using the fields: questionUrdu, optionAUrdu, optionBUrdu, optionCUrdu, optionDUrdu, explanationUrdu.`
    : "";

  const prompt = `You are an expert educational content creator. Analyze the following text and generate ${questionsPerChunk} multiple choice questions that test understanding of the key concepts.

TEXT TO ANALYZE:
${chunk}

INSTRUCTIONS:
1. Extract every distinct fact and concept from the text
2. Generate ${questionsPerChunk} high-quality MCQ questions
3. Each question must have exactly 4 options (A, B, C, D)
4. Provide a clear explanation for the correct answer
5. Focus on testing comprehension, not just memorization
${urduInstruction}

RESPOND WITH VALID JSON ARRAY:
[
  {
    "question": "Question text here?",
    ${includeUrdu ? '"questionUrdu": "سوال کا متن",' : ''}
    "optionA": "First option",
    ${includeUrdu ? '"optionAUrdu": "پہلا آپشن",' : ''}
    "optionB": "Second option",
    ${includeUrdu ? '"optionBUrdu": "دوسرا آپشن",' : ''}
    "optionC": "Third option",
    ${includeUrdu ? '"optionCUrdu": "تیسرا آپشن",' : ''}
    "optionD": "Fourth option",
    ${includeUrdu ? '"optionDUrdu": "چوتھا آپشن",' : ''}
    "correctAnswer": "A",
    "explanation": "Explanation of why this is correct"
    ${includeUrdu ? ',"explanationUrdu": "وضاحت"' : ''}
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No valid JSON array found in response");
      return [];
    }

    const questions: GeneratedMcq[] = JSON.parse(jsonMatch[0]);
    return questions.filter(q => 
      q.question && 
      q.optionA && 
      q.optionB && 
      q.correctAnswer && 
      ["A", "B", "C", "D"].includes(q.correctAnswer)
    );
  } catch (error) {
    console.error("Error generating MCQs:", error);
    throw error;
  }
}

export async function generateMcqsFromText(
  text: string,
  includeUrdu: boolean = false,
  onProgress?: (progress: ChunkProgress) => void
): Promise<GeneratedMcq[]> {
  const chunks = splitTextIntoChunks(text);
  const allQuestions: GeneratedMcq[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const questions = await generateMcqsFromChunk(chunks[i], includeUrdu);
    allQuestions.push(...questions);

    if (onProgress) {
      onProgress({
        currentChunk: i + 1,
        totalChunks: chunks.length,
        questionsGenerated: allQuestions.length,
      });
    }

    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return allQuestions;
}

export async function generateTheorySummary(text: string): Promise<string> {
  const prompt = `You are an expert educational content creator. Create comprehensive study notes from the following text.

TEXT:
${text}

Create well-structured study notes with:
1. Key concepts and definitions
2. Important points highlighted
3. Clear explanations
4. Summary at the end

Format with markdown for readability.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating theory summary:", error);
    throw error;
  }
}

export async function chatWithMentor(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const historyContext = conversationHistory
    .slice(-10)
    .map(msg => `${msg.role === "user" ? "Student" : "Mentor"}: ${msg.content}`)
    .join("\n\n");

  const prompt = `You are an expert educational mentor and tutor. You help students with their studies, explain concepts clearly, and provide guidance on academic matters.

CONVERSATION HISTORY:
${historyContext}

STUDENT'S NEW MESSAGE:
${message}

Respond helpfully and encourage the student's learning. Be supportive but also challenge them to think critically.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error in mentor chat:", error);
    throw error;
  }
}

export async function analyzeArticle(text: string): Promise<{
  vocabulary: Array<{ word: string; definition: string }>;
  keyPoints: string[];
  analyticalAngles: string[];
  counterNarratives: string[];
}> {
  const prompt = `Analyze the following article/text for academic study purposes.

TEXT:
${text}

Provide analysis in this JSON format:
{
  "vocabulary": [{"word": "term", "definition": "meaning"}],
  "keyPoints": ["point 1", "point 2"],
  "analyticalAngles": ["angle 1", "angle 2"],
  "counterNarratives": ["counter 1", "counter 2"]
}

Extract:
1. Important vocabulary terms with definitions
2. Key points and main arguments
3. Different analytical angles/perspectives
4. Potential counter-narratives or opposing viewpoints`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text_response = response.text || "{}";
    return JSON.parse(text_response);
  } catch (error) {
    console.error("Error analyzing article:", error);
    throw error;
  }
}

export async function generateEssayStructure(topic: string): Promise<string> {
  const prompt = `You are a CSS (Central Superior Services) examination expert. Generate a comprehensive essay structure for the following topic that would help a candidate score highly in CSS Essay Paper.

TOPIC: ${topic}

Provide a detailed essay structure in the following format:

# ${topic}

## Introduction
[Provide a compelling introduction with thesis statement, key definitions, and context]

## Key Arguments / Main Body

### 1. [First Major Argument]
- Key points to cover
- Supporting evidence and examples
- Relevant statistics or case studies
- Pakistan-specific context

### 2. [Second Major Argument]
- Key points to cover
- Supporting evidence and examples
- Relevant statistics or case studies
- International perspectives

### 3. [Third Major Argument]
- Key points to cover
- Supporting evidence and examples
- Policy implications
- Future prospects

## Counter-Arguments
[Present opposing viewpoints and address them critically]

## Case Studies
[Provide 2-3 relevant case studies with brief analysis]

## Recommendations / Way Forward
[Practical, policy-oriented recommendations]

## Conclusion
[Summarize key points, restate thesis, and end with impactful closing statement]

## Expert Tips for CSS Examiners
- Writing style recommendations
- Common mistakes to avoid
- Quotations and references to include
- Word count management tips

Make the response comprehensive, analytical, and tailored for CSS/PMS examination standards. Use formal academic language.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Failed to generate essay structure. Please try again.";
  } catch (error) {
    console.error("Error generating essay structure:", error);
    throw error;
  }
}

export function getChunkCount(text: string): number {
  return splitTextIntoChunks(text).length;
}
