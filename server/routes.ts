import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import {
  createSubjectSchema,
  createTopicSchema,
  createMaterialSchema,
  createMcqQuestionSchema,
  createBookChapterSchema,
  createEssaySubmissionSchema,
} from "@shared/schema";
import { ZodError } from "zod";

// Middleware to check if user is admin
const isAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.user as any)?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const role = await storage.getUserRole(userId);
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
};

// Helper to log activity
async function logActivity(userId: string, action: string, entityType?: string, entityId?: number, details?: string) {
  try {
    await storage.logActivity({ userId, action, entityType, entityId, details });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);
  registerAuthRoutes(app);

  // ==================== PUBLIC CATALOG ROUTES (No auth required) ====================
  
  // Get all subjects (public - no auth required)
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  // Get subject with topics (public)
  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubjectWithTopics(id);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ error: "Failed to fetch subject" });
    }
  });

  // Get topics for a subject (public)
  app.get("/api/subjects/:id/topics", async (req, res) => {
    try {
      const subjectId = parseInt(req.params.id);
      const topics = await storage.getTopics(subjectId);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  // Get all materials for all topics in a subject (authenticated)
  app.get("/api/subjects/:id/materials", isAuthenticated, async (req, res) => {
    try {
      const subjectId = parseInt(req.params.id);
      const topics = await storage.getTopics(subjectId);
      const allMaterials: any[] = [];
      for (const topic of topics) {
        const materials = await storage.getMaterials(topic.id);
        allMaterials.push(...materials);
      }
      res.json(allMaterials);
    } catch (error) {
      console.error("Error fetching subject materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  // Get topic with materials and sub-topics (public - can see list, but accessing material content requires auth)
  app.get("/api/topics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const topic = await storage.getTopicWithMaterials(id);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      const subTopics = await storage.getSubTopics(id);
      res.json({ ...topic, subTopics });
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ error: "Failed to fetch topic" });
    }
  });

  // Get sub-topics for a topic
  app.get("/api/topics/:id/subtopics", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const subTopics = await storage.getSubTopics(topicId);
      res.json(subTopics);
    } catch (error) {
      console.error("Error fetching sub-topics:", error);
      res.status(500).json({ error: "Failed to fetch sub-topics" });
    }
  });

  // Get materials for a topic (optionally filtered by type)
  app.get("/api/topics/:id/materials", isAuthenticated, async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const type = req.query.type as string | undefined;
      const materials = await storage.getMaterials(topicId, type);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  // Get material with content
  app.get("/api/materials/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterialWithContent(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });

  // ==================== ESSAY SUBMISSION ROUTES ====================
  
  // Submit an essay (students)
  app.post("/api/essays/submit", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createEssaySubmissionSchema.parse(req.body);
      const submission = await storage.createEssaySubmission({
        ...validatedData,
        userId,
        status: "submitted",
      });
      await logActivity(userId, "submit_essay", "essay_submission", submission.id);
      res.json(submission);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error submitting essay:", error);
      res.status(500).json({ error: "Failed to submit essay" });
    }
  });

  // Get user's essay submissions
  app.get("/api/essays/my-submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const submissions = await storage.getUserEssaySubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // ==================== USER ROLE ROUTES ====================
  
  // Get current user's role
  app.get("/api/user/role", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const role = await storage.getUserRole(userId);
      res.json({ role });
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Admin: Create subject
  app.post("/api/admin/subjects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      await logActivity(userId, "create_subject", "subject", subject.id, `Created subject: ${subject.name}`);
      res.json(subject);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating subject:", error);
      res.status(500).json({ error: "Failed to create subject" });
    }
  });

  // Admin: Update subject
  app.put("/api/admin/subjects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const validatedData = createSubjectSchema.partial().parse(req.body);
      const subject = await storage.updateSubject(id, validatedData);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      await logActivity(userId, "update_subject", "subject", id, `Updated subject: ${subject.name}`);
      res.json(subject);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating subject:", error);
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  // Admin: Delete subject
  app.delete("/api/admin/subjects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubject(id);
      if (!deleted) {
        return res.status(404).json({ error: "Subject not found" });
      }
      await logActivity(userId, "delete_subject", "subject", id, `Deleted subject ID: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  // Admin: Create topic
  app.post("/api/admin/topics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createTopicSchema.parse(req.body);
      const topic = await storage.createTopic(validatedData);
      await logActivity(userId, "create_topic", "topic", topic.id, `Created topic: ${topic.name}`);
      res.json(topic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating topic:", error);
      res.status(500).json({ error: "Failed to create topic" });
    }
  });

  // Admin: Update topic
  app.put("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const validatedData = createTopicSchema.partial().parse(req.body);
      const topic = await storage.updateTopic(id, validatedData);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      await logActivity(userId, "update_topic", "topic", id, `Updated topic: ${topic.name}`);
      res.json(topic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating topic:", error);
      res.status(500).json({ error: "Failed to update topic" });
    }
  });

  // Admin: Delete topic
  app.delete("/api/admin/topics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTopic(id);
      if (!deleted) {
        return res.status(404).json({ error: "Topic not found" });
      }
      await logActivity(userId, "delete_topic", "topic", id, `Deleted topic ID: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ error: "Failed to delete topic" });
    }
  });

  // Admin: Create material
  app.post("/api/admin/materials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      await logActivity(userId, "create_material", "material", material.id, `Created ${material.type}: ${material.title}`);
      res.json(material);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating material:", error);
      res.status(500).json({ error: "Failed to create material" });
    }
  });

  // Admin: Update material
  app.put("/api/admin/materials/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const validatedData = createMaterialSchema.partial().parse(req.body);
      const material = await storage.updateMaterial(id, validatedData);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      await logActivity(userId, "update_material", "material", id, `Updated material: ${material.title}`);
      res.json(material);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating material:", error);
      res.status(500).json({ error: "Failed to update material" });
    }
  });

  // Admin: Delete material
  app.delete("/api/admin/materials/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMaterial(id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      await logActivity(userId, "delete_material", "material", id, `Deleted material ID: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Admin: Create MCQ question
  app.post("/api/admin/mcq-questions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createMcqQuestionSchema.parse(req.body);
      const question = await storage.createMcqQuestion(validatedData);
      await logActivity(userId, "create_mcq", "mcq_question", question.id);
      res.json(question);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating MCQ:", error);
      res.status(500).json({ error: "Failed to create MCQ" });
    }
  });

  // Admin: Update MCQ question
  app.put("/api/admin/mcq-questions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const validatedData = createMcqQuestionSchema.partial().parse(req.body);
      const question = await storage.updateMcqQuestion(id, validatedData);
      if (!question) {
        return res.status(404).json({ error: "MCQ not found" });
      }
      await logActivity(userId, "update_mcq", "mcq_question", id);
      res.json(question);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating MCQ:", error);
      res.status(500).json({ error: "Failed to update MCQ" });
    }
  });

  // Admin: Delete MCQ question
  app.delete("/api/admin/mcq-questions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMcqQuestion(id);
      if (!deleted) {
        return res.status(404).json({ error: "MCQ not found" });
      }
      await logActivity(userId, "delete_mcq", "mcq_question", id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting MCQ:", error);
      res.status(500).json({ error: "Failed to delete MCQ" });
    }
  });

  // Admin: Generate MCQs from text using AI (with chunking strategy)
  app.post("/api/admin/topics/:topicId/generate-quiz", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const topicId = parseInt(req.params.topicId);
      const { text, title, includeUrdu = false } = req.body;

      if (!text || !title) {
        return res.status(400).json({ error: "Text and title are required" });
      }

      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      // Import Gemini service
      const { generateMCQsFromText, convertToMcqQuestionFormat, isGeminiConfigured } = await import("./services/geminiService");

      if (!isGeminiConfigured()) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      // Create AI job for tracking
      const aiJob = await storage.createAiJob({
        userId,
        jobType: "mcq_generation",
        status: "processing",
        inputText: text.substring(0, 1000) + "...", // Store first 1000 chars for reference
        totalChunks: Math.ceil(text.length / 4000),
        processedChunks: 0,
      });

      try {
        // Generate MCQs from text
        const result = await generateMCQsFromText(text, topic.name, includeUrdu, async (processed, total) => {
          await storage.updateAiJob(aiJob.id, { processedChunks: processed });
        });

        // Save theory (source text) to topic's content field
        await storage.updateTopic(topicId, { content: result.theory });

        // Create MCQ material
        const material = await storage.createMaterial({
          topicId,
          type: "mcq",
          title,
          description: `AI-generated quiz with ${result.questions.length} questions`,
        });

        // Convert and bulk insert questions
        const formattedQuestions = convertToMcqQuestionFormat(result.questions, material.id);
        await storage.createMcqQuestionsBulk(formattedQuestions);

        // Update AI job as completed
        await storage.updateAiJob(aiJob.id, {
          status: "completed",
          outputData: JSON.stringify({ materialId: material.id, questionCount: result.questions.length }),
          completedAt: new Date(),
        });

        await logActivity(userId, "generate_quiz", "material", material.id, `Generated ${result.questions.length} MCQs for topic: ${topic.name}`);

        res.json({
          success: true,
          materialId: material.id,
          questionCount: result.questions.length,
          theoryLength: result.theory.length,
        });
      } catch (genError: any) {
        await storage.updateAiJob(aiJob.id, {
          status: "failed",
          errorMessage: genError?.message || "Generation failed",
        });
        throw genError;
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: error?.message || "Failed to generate quiz" });
    }
  });

  // Admin: Import MCQs from JSON
  app.post("/api/admin/topics/:topicId/import-quiz", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const topicId = parseInt(req.params.topicId);
      const { title, questions } = req.body;

      if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Title and questions array are required" });
      }

      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      // Create MCQ material
      const material = await storage.createMaterial({
        topicId,
        type: "mcq",
        title,
        description: `Imported quiz with ${questions.length} questions`,
      });

      // Format and bulk insert questions
      const formattedQuestions = questions.map((q: any, index: number) => ({
        materialId: material.id,
        question: q.question || "",
        questionUrdu: q.questionUrdu || q.question_urdu,
        optionA: q.optionA || q.options?.[0] || "",
        optionAUrdu: q.optionAUrdu || q.options_urdu?.[0],
        optionB: q.optionB || q.options?.[1] || "",
        optionBUrdu: q.optionBUrdu || q.options_urdu?.[1],
        optionC: q.optionC || q.options?.[2] || "",
        optionCUrdu: q.optionCUrdu || q.options_urdu?.[2],
        optionD: q.optionD || q.options?.[3] || "",
        optionDUrdu: q.optionDUrdu || q.options_urdu?.[3],
        correctAnswer: q.correctAnswer || q.correct_answer || "A",
        explanation: q.explanation || "",
        explanationUrdu: q.explanationUrdu || q.explanation_urdu,
        order: index,
      }));

      await storage.createMcqQuestionsBulk(formattedQuestions);

      await logActivity(userId, "import_quiz", "material", material.id, `Imported ${questions.length} MCQs for topic: ${topic.name}`);

      res.json({
        success: true,
        materialId: material.id,
        questionCount: questions.length,
      });
    } catch (error: any) {
      console.error("Error importing quiz:", error);
      res.status(500).json({ error: error?.message || "Failed to import quiz" });
    }
  });

  // ==================== QUIZ ATTEMPT ROUTES ====================

  // Submit quiz attempt (save results)
  app.post("/api/quiz-attempts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { materialId, totalQuestions, correctAnswers, score, answers } = req.body;

      if (!materialId || totalQuestions === undefined || correctAnswers === undefined || score === undefined || !answers) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const attempt = await storage.createQuizAttempt({
        userId,
        materialId,
        totalQuestions,
        correctAnswers,
        score,
        answers: JSON.stringify(answers),
      });

      res.json(attempt);
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
      res.status(500).json({ error: "Failed to save quiz attempt" });
    }
  });

  // Get user's quiz attempts for a material
  app.get("/api/quiz-attempts/:materialId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const materialId = parseInt(req.params.materialId);
      const attempts = await storage.getQuizAttempts(userId, materialId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  // Get user's overall progress
  app.get("/api/user/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Admin: Create book chapter
  app.post("/api/admin/book-chapters", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const validatedData = createBookChapterSchema.parse(req.body);
      const chapter = await storage.createBookChapter(validatedData);
      await logActivity(userId, "create_chapter", "book_chapter", chapter.id);
      res.json(chapter);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating chapter:", error);
      res.status(500).json({ error: "Failed to create chapter" });
    }
  });

  // Admin: Update book chapter
  app.put("/api/admin/book-chapters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const validatedData = createBookChapterSchema.partial().parse(req.body);
      const chapter = await storage.updateBookChapter(id, validatedData);
      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      await logActivity(userId, "update_chapter", "book_chapter", id);
      res.json(chapter);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating chapter:", error);
      res.status(500).json({ error: "Failed to update chapter" });
    }
  });

  // Admin: Delete book chapter
  app.delete("/api/admin/book-chapters/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBookChapter(id);
      if (!deleted) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      await logActivity(userId, "delete_chapter", "book_chapter", id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ error: "Failed to delete chapter" });
    }
  });

  // Admin: Get activity logs
  app.get("/api/admin/activity-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Admin: Get all users with roles
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin: Update user role
  app.put("/api/admin/users/:id/role", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any)?.claims?.sub;
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!["student", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      await storage.setUserRole(userId, role);
      await logActivity(adminId, "update_user_role", "user", undefined, `Changed user ${userId} role to ${role}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Admin: Review essay submission
  app.put("/api/admin/essays/:id/review", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any)?.claims?.sub;
      const id = parseInt(req.params.id);
      const { feedback, score, status } = req.body;
      
      const submission = await storage.updateEssaySubmission(id, { feedback, score, status });
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      await logActivity(adminId, "review_essay", "essay_submission", id);
      res.json(submission);
    } catch (error) {
      console.error("Error reviewing essay:", error);
      res.status(500).json({ error: "Failed to review essay" });
    }
  });

  // Admin: Get essay submissions for a material
  app.get("/api/admin/materials/:id/essays", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const materialId = parseInt(req.params.id);
      const submissions = await storage.getEssaySubmissions(materialId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // ==================== SITE SETTINGS (INLINE EDITING) ====================

  // Get all site settings (public - for displaying text)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  // Admin: Update a site setting (inline edit)
  app.patch("/api/admin/site-settings/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any)?.claims?.sub;
      const { key } = req.params;
      const { value, label } = req.body;
      
      if (typeof value !== "string") {
        return res.status(400).json({ error: "Value must be a string" });
      }
      
      const setting = await storage.upsertSiteSetting(key, value, label);
      await logActivity(adminId, "update_site_setting", "site_setting", setting.id, `Updated ${key}`);
      res.json(setting);
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ error: "Failed to update site setting" });
    }
  });

  // Admin: Batch update multiple site settings
  app.patch("/api/admin/site-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any)?.claims?.sub;
      const updates = req.body as Record<string, string>;
      
      const results = [];
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string") {
          const setting = await storage.upsertSiteSetting(key, value);
          results.push(setting);
        }
      }
      
      await logActivity(adminId, "batch_update_site_settings", "site_settings", undefined, `Updated ${results.length} settings`);
      res.json(results);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ error: "Failed to update site settings" });
    }
  });

  // ==================== AI FEATURES ====================
  
  // Create Topic + Generate MCQs in one step (MCQ Maker workflow)
  app.post("/api/ai/create-topic-with-mcqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { text, subjectId, topicName, includeUrdu = false } = req.body;

      if (!text || !subjectId || !topicName) {
        return res.status(400).json({ error: "Text, subjectId, and topicName are required" });
      }

      // Verify subject exists
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      // Create the topic first
      const topic = await storage.createTopic({
        subjectId,
        name: topicName,
        description: `Auto-created topic with AI-generated MCQs`,
      });

      const { generateMcqsFromText, getChunkCount } = await import("./services/gemini");
      
      const totalChunks = getChunkCount(text);
      
      // Create AI job for tracking
      const job = await storage.createAiJob({
        userId,
        jobType: "mcq_generation",
        status: "processing",
        inputText: text.substring(0, 1000),
        totalChunks,
        processedChunks: 0,
      });

      // Create MCQ material
      const mcqMaterial = await storage.createMaterial({
        topicId: topic.id,
        type: "mcq",
        title: `${topicName} - MCQs`,
        description: `AI-generated MCQs from ${totalChunks} text chunks`,
      });

      // Save original text as Theory
      await storage.createMaterial({
        topicId: topic.id,
        type: "theory",
        title: `${topicName} - Study Notes`,
        content: text,
        description: `Original study material`,
      });

      // Generate MCQs asynchronously
      generateMcqsFromText(text, includeUrdu, async (progress) => {
        await storage.updateAiJob(job.id, { processedChunks: progress.currentChunk });
      }).then(async (questions) => {
        const mcqsToInsert = questions.map((q, index) => ({
          materialId: mcqMaterial.id,
          question: q.question,
          questionUrdu: q.questionUrdu,
          optionA: q.optionA,
          optionAUrdu: q.optionAUrdu,
          optionB: q.optionB,
          optionBUrdu: q.optionBUrdu,
          optionC: q.optionC,
          optionCUrdu: q.optionCUrdu,
          optionD: q.optionD,
          optionDUrdu: q.optionDUrdu,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          explanationUrdu: q.explanationUrdu,
          order: index,
        }));

        await storage.createMcqQuestionsBulk(mcqsToInsert);
        await storage.updateAiJob(job.id, {
          status: "completed",
          outputData: JSON.stringify({ topicId: topic.id, materialId: mcqMaterial.id, questionsCount: questions.length }),
          completedAt: new Date(),
        });
        await logActivity(userId, "create_topic_with_mcqs", "topic", topic.id, `Created topic and generated ${questions.length} MCQs`);
      }).catch(async (error) => {
        await storage.updateAiJob(job.id, {
          status: "failed",
          errorMessage: error.message,
        });
      });

      res.json({ 
        jobId: job.id, 
        topicId: topic.id,
        materialId: mcqMaterial.id,
        totalChunks,
        message: "Topic created and MCQ generation started." 
      });
    } catch (error) {
      console.error("Error creating topic with MCQs:", error);
      res.status(500).json({ error: "Failed to create topic with MCQs" });
    }
  });

  // Generate MCQs from text using Gemini AI (admin only for content creation)
  app.post("/api/ai/generate-mcqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { text, topicId, includeUrdu = false, title } = req.body;

      if (!text || !topicId || !title) {
        return res.status(400).json({ error: "Text, topicId, and title are required" });
      }

      // Verify topic exists before creating materials
      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const { generateMcqsFromText, getChunkCount } = await import("./services/gemini");
      
      const totalChunks = getChunkCount(text);
      
      const job = await storage.createAiJob({
        userId,
        jobType: "mcq_generation",
        status: "processing",
        inputText: text.substring(0, 1000),
        totalChunks,
        processedChunks: 0,
      });

      const material = await storage.createMaterial({
        topicId,
        type: "mcq",
        title,
        description: `AI-generated MCQs from ${totalChunks} text chunks`,
      });

      // Also save the original text as Theory for reference
      const theoryMaterial = await storage.createMaterial({
        topicId,
        type: "theory",
        title: `${title} - Study Notes`,
        content: text,
        description: `Original study material used to generate MCQs`,
      });

      generateMcqsFromText(text, includeUrdu, async (progress) => {
        await storage.updateAiJob(job.id, { processedChunks: progress.currentChunk });
      }).then(async (questions) => {
        const mcqsToInsert = questions.map((q, index) => ({
          materialId: material.id,
          question: q.question,
          questionUrdu: q.questionUrdu,
          optionA: q.optionA,
          optionAUrdu: q.optionAUrdu,
          optionB: q.optionB,
          optionBUrdu: q.optionBUrdu,
          optionC: q.optionC,
          optionCUrdu: q.optionCUrdu,
          optionD: q.optionD,
          optionDUrdu: q.optionDUrdu,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          explanationUrdu: q.explanationUrdu,
          order: index,
        }));

        await storage.createMcqQuestionsBulk(mcqsToInsert);
        await storage.updateAiJob(job.id, {
          status: "completed",
          outputData: JSON.stringify({ materialId: material.id, questionsCount: questions.length }),
          completedAt: new Date(),
        });
        await logActivity(userId, "generate_mcqs", "material", material.id, `Generated ${questions.length} MCQs`);
      }).catch(async (error) => {
        await storage.updateAiJob(job.id, {
          status: "failed",
          errorMessage: error.message,
        });
        // Clean up orphaned material on failure
        try {
          await storage.deleteMaterial(material.id);
        } catch (cleanupError) {
          console.error("Failed to clean up material after MCQ generation failure:", cleanupError);
        }
      });

      res.json({ 
        jobId: job.id, 
        materialId: material.id,
        totalChunks,
        message: "MCQ generation started. Check job status for progress." 
      });
    } catch (error) {
      console.error("Error starting MCQ generation:", error);
      res.status(500).json({ error: "Failed to start MCQ generation" });
    }
  });

  // Get AI job status (only own jobs or admin can see all)
  app.get("/api/ai/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const role = await storage.getUserRole(userId);
      
      const jobs = await storage.getAiJobs();
      const job = jobs.find(j => j.id === parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Only allow access to own jobs or if admin
      if (job.userId !== userId && role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Mentor Chat - Send message
  app.post("/api/ai/mentor-chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      await storage.createMentorChat({ userId, role: "user", content: message });
      
      const history = await storage.getMentorChats(userId);
      
      const { chatWithMentor } = await import("./services/gemini");
      const response = await chatWithMentor(
        message,
        history.map(h => ({ role: h.role, content: h.content }))
      );

      const assistantMessage = await storage.createMentorChat({ 
        userId, 
        role: "assistant", 
        content: response 
      });

      res.json({ response, messageId: assistantMessage.id });
    } catch (error) {
      console.error("Error in mentor chat:", error);
      res.status(500).json({ error: "Failed to get mentor response" });
    }
  });

  // Get mentor chat history
  app.get("/api/ai/mentor-chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const chats = await storage.getMentorChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Clear mentor chat history
  app.delete("/api/ai/mentor-chat", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      await storage.clearMentorChats(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing chat:", error);
      res.status(500).json({ error: "Failed to clear chat" });
    }
  });

  // Generate theory summary (admin only for content creation)
  app.post("/api/ai/generate-theory", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { text, topicId, title } = req.body;

      if (!text || !topicId || !title) {
        return res.status(400).json({ error: "Text, topicId, and title are required" });
      }

      // Verify topic exists before creating materials
      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const { generateTheorySummary } = await import("./services/gemini");
      const summary = await generateTheorySummary(text);

      const material = await storage.createMaterial({
        topicId,
        type: "theory",
        title,
        description: "AI-generated study notes",
        content: summary,
      });

      await logActivity(userId, "generate_theory", "material", material.id);
      res.json({ material, summary });
    } catch (error) {
      console.error("Error generating theory:", error);
      res.status(500).json({ error: "Failed to generate theory summary" });
    }
  });

  // Analyze article
  app.post("/api/ai/analyze-article", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const { analyzeArticle } = await import("./services/gemini");
      const analysis = await analyzeArticle(text);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing article:", error);
      res.status(500).json({ error: "Failed to analyze article" });
    }
  });

  // Generate Essay Structure
  app.post("/api/ai/generate-essay", isAuthenticated, async (req, res) => {
    try {
      const { topic } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const { generateEssayStructure } = await import("./services/gemini");
      const structure = await generateEssayStructure(topic);
      res.json({ content: structure });
    } catch (error) {
      console.error("Error generating essay structure:", error);
      res.status(500).json({ error: "Failed to generate essay structure" });
    }
  });

  // Quiz session - Get or create
  app.get("/api/quiz/session/:materialId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const materialId = parseInt(req.params.materialId);
      
      let session = await storage.getQuizSession(userId, materialId);
      
      if (!session) {
        const questions = await storage.getMcqQuestions(materialId);
        session = await storage.createQuizSession({
          userId,
          materialId,
          totalQuestions: questions.length,
          currentQuestionIndex: 0,
          correctAnswers: 0,
          isCompleted: false,
          answeredQuestions: "[]",
        });
      }
      
      const questions = await storage.getMcqQuestions(materialId);
      res.json({ session, questions });
    } catch (error) {
      console.error("Error with quiz session:", error);
      res.status(500).json({ error: "Failed to get quiz session" });
    }
  });

  // Quiz session - Update progress
  app.put("/api/quiz/session/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentQuestionIndex, correctAnswers, answeredQuestions, isCompleted } = req.body;
      
      const session = await storage.updateQuizSession(id, {
        currentQuestionIndex,
        correctAnswers,
        answeredQuestions,
        isCompleted,
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error updating quiz session:", error);
      res.status(500).json({ error: "Failed to update quiz session" });
    }
  });

  // Admin: Get AI jobs
  app.get("/api/admin/ai-jobs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAiJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching AI jobs:", error);
      res.status(500).json({ error: "Failed to fetch AI jobs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
