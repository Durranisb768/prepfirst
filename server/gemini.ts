import { GoogleGenAI } from "@google/genai";
import type {
  StudyPlanRequest,
  StudyPlanResponse,
  ArticleAnalysisRequest,
  ArticleAnalysisResponse,
  EssayRequest,
  EssayResponse,
  ChatResponse,
} from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateStudyPlan(request: StudyPlanRequest): Promise<StudyPlanResponse> {
  const systemPrompt = `You are an expert CSS (Central Superior Services) exam preparation coach in Pakistan.
Generate a detailed study plan based on the user's exam date, available hours per day, selected subjects, and focus areas.
The study plan should be realistic, balanced, and prioritize high-yield topics.
Consider the CSS exam format and weight each subject appropriately.

Respond with JSON in this exact format:
{
  "schedule": [
    {
      "date": "YYYY-MM-DD",
      "topics": [
        {
          "subject": "Subject Name",
          "topic": "Specific topic to study",
          "duration": "X hours",
          "priority": "high" | "medium" | "low"
        }
      ]
    }
  ],
  "recommendations": ["Array of personalized study tips"],
  "totalDays": number
}`;

  const userPrompt = `Create a study plan for CSS exam preparation:
- Exam Date: ${request.examDate}
- Available Hours Per Day: ${request.hoursPerDay}
- Selected Subjects: ${request.subjects.join(", ")}
- Focus Areas: ${request.focusAreas || "General preparation"}

Generate a comprehensive study schedule with daily topics, prioritizing based on exam weightage and the time remaining.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as StudyPlanResponse;
    }
    throw new Error("Empty response from model");
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error(`Failed to generate study plan: ${error}`);
  }
}

export async function analyzeArticle(request: ArticleAnalysisRequest): Promise<ArticleAnalysisResponse> {
  const systemPrompt = `You are an expert CSS exam analyst specializing in current affairs and article analysis for Pakistan's CSS exam.
Analyze the provided article and extract key insights relevant to CSS exam preparation.
Consider multiple perspectives (political, economic, social, international) as required in CSS essays.

Respond with JSON in this exact format:
{
  "summary": "Concise summary of the article (2-3 paragraphs)",
  "keyInsights": ["Array of key points relevant for CSS exam"],
  "multiAngleAnalysis": [
    {
      "perspective": "Perspective name (e.g., Political, Economic, Social, International)",
      "analysis": "Detailed analysis from this perspective"
    }
  ],
  "suggestedTopics": ["Array of CSS exam topics this article relates to"]
}`;

  const userPrompt = `Analyze this article for CSS exam preparation:

${request.content}

Provide a comprehensive analysis including multiple perspectives that could be used in CSS essay writing.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as ArticleAnalysisResponse;
    }
    throw new Error("Empty response from model");
  } catch (error) {
    console.error("Error analyzing article:", error);
    throw new Error(`Failed to analyze article: ${error}`);
  }
}

export async function generateEssay(request: EssayRequest): Promise<EssayResponse> {
  const systemPrompt = `You are an expert CSS essay writer and coach for Pakistan's CSS exam.
Generate a comprehensive essay outline and content based on the given topic.
Follow CSS exam essay conventions: balanced arguments, multiple perspectives, relevant case studies, and proper structure.
The essay should demonstrate critical thinking and analytical skills expected in CSS exams.

Respond with JSON in this exact format:
{
  "title": "Essay title",
  "introduction": "Compelling introduction with thesis statement",
  "sections": [
    {
      "title": "Section heading",
      "content": "Detailed content for this section",
      "keyPoints": ["Array of key points in this section"]
    }
  ],
  "conclusion": "Strong conclusion tying all arguments together",
  "caseStudies": [
    {
      "name": "Case study name",
      "relevance": "Why this case study is relevant",
      "details": "Key details about this case study"
    }
  ],
  "writingTips": ["Array of tips for writing this essay effectively"],
  "references": ["Array of suggested references and sources"]
}`;

  const userPrompt = `Generate a CSS exam-style essay on:

Topic: ${request.topic}
Target Word Count: ${request.wordCount || 2000} words
Perspective: ${request.perspective || "Balanced and multi-dimensional"}
Include Case Studies: ${request.includesCaseStudies ? "Yes, include relevant case studies" : "Optional"}

Create a well-structured essay with introduction, multiple body sections, and conclusion.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as EssayResponse;
    }
    throw new Error("Empty response from model");
  } catch (error) {
    console.error("Error generating essay:", error);
    throw new Error(`Failed to generate essay: ${error}`);
  }
}

export async function chatWithAssistant(message: string): Promise<ChatResponse> {
  const systemPrompt = `You are an expert CSS (Central Superior Services) exam preparation assistant for Pakistan.
You have deep knowledge of:
- CSS exam syllabus and format
- All CSS subjects including Pakistan Affairs, Current Affairs, Essay, English, General Science & Ability
- Essay writing techniques for CSS
- Current affairs relevant to Pakistan and international relations
- Study strategies and time management for CSS preparation

Provide helpful, accurate, and concise answers to help aspirants prepare effectively.
When relevant, cite sources or suggest further reading materials.

Respond with JSON in this exact format:
{
  "message": "Your detailed response to the user's question",
  "sources": ["Array of relevant sources, books, or materials for further reading"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as ChatResponse;
    }
    throw new Error("Empty response from model");
  } catch (error) {
    console.error("Error in chat:", error);
    throw new Error(`Failed to get chat response: ${error}`);
  }
}
