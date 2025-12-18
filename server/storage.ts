import { 
  subjects, topics, materials, mcqQuestions, bookChapters, essaySubmissions, activityLogs, userRoles,
  quizSessions, mentorChats, aiGenerationJobs, siteSettings, quizAttempts,
  type Subject, type InsertSubject, 
  type Topic, type InsertTopic,
  type Material, type InsertMaterial,
  type McqQuestion, type InsertMcqQuestion,
  type BookChapter, type InsertBookChapter,
  type EssaySubmission, type InsertEssaySubmission,
  type ActivityLog, type InsertActivityLog,
  type QuizSession, type InsertQuizSession,
  type MentorChat, type InsertMentorChat,
  type AiGenerationJob, type InsertAiGenerationJob,
  type SiteSetting, type InsertSiteSetting,
  type QuizAttempt, type InsertQuizAttempt,
  type SubjectWithTopics, type TopicWithMaterials, type MaterialWithContent,
  type UserWithRole
} from "@shared/schema";
import { users } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectWithTopics(id: number): Promise<SubjectWithTopics | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Topics
  getTopics(subjectId: number, parentTopicId?: number | null): Promise<Topic[]>;
  getSubTopics(parentTopicId: number): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | undefined>;
  getTopicWithSubTopics(id: number): Promise<(Topic & { subTopics: Topic[] }) | undefined>;
  getTopicWithMaterials(id: number): Promise<TopicWithMaterials | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: number): Promise<boolean>;

  // Materials
  getMaterials(topicId: number, type?: string): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialWithContent(id: number): Promise<MaterialWithContent | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;

  // MCQ Questions
  getMcqQuestions(materialId: number): Promise<McqQuestion[]>;
  createMcqQuestion(question: InsertMcqQuestion): Promise<McqQuestion>;
  updateMcqQuestion(id: number, question: Partial<InsertMcqQuestion>): Promise<McqQuestion | undefined>;
  deleteMcqQuestion(id: number): Promise<boolean>;

  // Book Chapters
  getBookChapters(materialId: number): Promise<BookChapter[]>;
  createBookChapter(chapter: InsertBookChapter): Promise<BookChapter>;
  updateBookChapter(id: number, chapter: Partial<InsertBookChapter>): Promise<BookChapter | undefined>;
  deleteBookChapter(id: number): Promise<boolean>;

  // Essay Submissions
  getEssaySubmissions(materialId: number): Promise<EssaySubmission[]>;
  getUserEssaySubmissions(userId: string): Promise<EssaySubmission[]>;
  createEssaySubmission(submission: InsertEssaySubmission): Promise<EssaySubmission>;
  updateEssaySubmission(id: number, submission: Partial<InsertEssaySubmission>): Promise<EssaySubmission | undefined>;

  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;

  // User Roles
  getUserRole(userId: string): Promise<"student" | "admin">;
  setUserRole(userId: string, role: "student" | "admin"): Promise<void>;
  getAllUsersWithRoles(): Promise<UserWithRole[]>;

  // Quiz Sessions
  getQuizSession(userId: string, materialId: number): Promise<QuizSession | undefined>;
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: number, session: Partial<InsertQuizSession>): Promise<QuizSession | undefined>;
  
  // Mentor Chats
  getMentorChats(userId: string, limit?: number): Promise<MentorChat[]>;
  createMentorChat(chat: InsertMentorChat): Promise<MentorChat>;
  clearMentorChats(userId: string): Promise<void>;

  // AI Generation Jobs
  createAiJob(job: InsertAiGenerationJob): Promise<AiGenerationJob>;
  updateAiJob(id: number, job: Partial<InsertAiGenerationJob>): Promise<AiGenerationJob | undefined>;
  getAiJobs(userId?: string): Promise<AiGenerationJob[]>;

  // Bulk MCQ operations
  createMcqQuestionsBulk(questions: InsertMcqQuestion[]): Promise<McqQuestion[]>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: string, materialId?: number): Promise<QuizAttempt[]>;
  getUserProgress(userId: string): Promise<{ materialId: number; bestScore: number; attempts: number }[]>;

  // Site Settings
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(key: string, value: string, label?: string): Promise<SiteSetting>;
}

export class DatabaseStorage implements IStorage {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectWithTopics(id: number): Promise<SubjectWithTopics | undefined> {
    const subject = await this.getSubject(id);
    if (!subject) return undefined;
    const subjectTopics = await this.getTopics(id);
    return { ...subject, topics: subjectTopics };
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updated] = await db.update(subjects)
      .set({ ...subject, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return result.length > 0;
  }

  // Topics
  async getTopics(subjectId: number, parentTopicId?: number | null): Promise<Topic[]> {
    if (parentTopicId === null) {
      // Get only root-level topics (no parent)
      return await db.select().from(topics)
        .where(and(eq(topics.subjectId, subjectId), isNull(topics.parentTopicId)))
        .orderBy(topics.order, topics.name);
    } else if (parentTopicId !== undefined) {
      // Get sub-topics of a specific parent
      return await db.select().from(topics)
        .where(and(eq(topics.subjectId, subjectId), eq(topics.parentTopicId, parentTopicId)))
        .orderBy(topics.order, topics.name);
    }
    // Get all topics for subject
    return await db.select().from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(topics.order, topics.name);
  }

  async getSubTopics(parentTopicId: number): Promise<Topic[]> {
    return await db.select().from(topics)
      .where(eq(topics.parentTopicId, parentTopicId))
      .orderBy(topics.order, topics.name);
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getTopicWithSubTopics(id: number): Promise<(Topic & { subTopics: Topic[] }) | undefined> {
    const topic = await this.getTopic(id);
    if (!topic) return undefined;
    const subTopics = await this.getSubTopics(id);
    return { ...topic, subTopics };
  }

  async getTopicWithMaterials(id: number): Promise<TopicWithMaterials | undefined> {
    const topic = await this.getTopic(id);
    if (!topic) return undefined;
    const topicMaterials = await this.getMaterials(id);
    return { ...topic, materials: topicMaterials };
  }

  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [updated] = await db.update(topics)
      .set({ ...topic, updatedAt: new Date() })
      .where(eq(topics.id, id))
      .returning();
    return updated;
  }

  async deleteTopic(id: number): Promise<boolean> {
    const result = await db.delete(topics).where(eq(topics.id, id)).returning();
    return result.length > 0;
  }

  // Materials
  async getMaterials(topicId: number, type?: string): Promise<Material[]> {
    if (type) {
      return await db.select().from(materials)
        .where(and(eq(materials.topicId, topicId), eq(materials.type, type as any)))
        .orderBy(materials.order, materials.title);
    }
    return await db.select().from(materials)
      .where(eq(materials.topicId, topicId))
      .orderBy(materials.order, materials.title);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async getMaterialWithContent(id: number): Promise<MaterialWithContent | undefined> {
    const material = await this.getMaterial(id);
    if (!material) return undefined;
    
    const result: MaterialWithContent = { ...material };
    
    if (material.type === "mcq") {
      result.mcqQuestions = await this.getMcqQuestions(id);
    } else if (material.type === "book") {
      result.bookChapters = await this.getBookChapters(id);
    }
    
    return result;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [updated] = await db.update(materials)
      .set({ ...material, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();
    return updated;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id)).returning();
    return result.length > 0;
  }

  // MCQ Questions
  async getMcqQuestions(materialId: number): Promise<McqQuestion[]> {
    return await db.select().from(mcqQuestions)
      .where(eq(mcqQuestions.materialId, materialId))
      .orderBy(mcqQuestions.order);
  }

  async createMcqQuestion(question: InsertMcqQuestion): Promise<McqQuestion> {
    const [newQuestion] = await db.insert(mcqQuestions).values(question).returning();
    return newQuestion;
  }

  async updateMcqQuestion(id: number, question: Partial<InsertMcqQuestion>): Promise<McqQuestion | undefined> {
    const [updated] = await db.update(mcqQuestions)
      .set(question)
      .where(eq(mcqQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteMcqQuestion(id: number): Promise<boolean> {
    const result = await db.delete(mcqQuestions).where(eq(mcqQuestions.id, id)).returning();
    return result.length > 0;
  }

  // Book Chapters
  async getBookChapters(materialId: number): Promise<BookChapter[]> {
    return await db.select().from(bookChapters)
      .where(eq(bookChapters.materialId, materialId))
      .orderBy(bookChapters.order);
  }

  async createBookChapter(chapter: InsertBookChapter): Promise<BookChapter> {
    const [newChapter] = await db.insert(bookChapters).values(chapter).returning();
    return newChapter;
  }

  async updateBookChapter(id: number, chapter: Partial<InsertBookChapter>): Promise<BookChapter | undefined> {
    const [updated] = await db.update(bookChapters)
      .set(chapter)
      .where(eq(bookChapters.id, id))
      .returning();
    return updated;
  }

  async deleteBookChapter(id: number): Promise<boolean> {
    const result = await db.delete(bookChapters).where(eq(bookChapters.id, id)).returning();
    return result.length > 0;
  }

  // Essay Submissions
  async getEssaySubmissions(materialId: number): Promise<EssaySubmission[]> {
    return await db.select().from(essaySubmissions)
      .where(eq(essaySubmissions.materialId, materialId))
      .orderBy(desc(essaySubmissions.createdAt));
  }

  async getUserEssaySubmissions(userId: string): Promise<EssaySubmission[]> {
    return await db.select().from(essaySubmissions)
      .where(eq(essaySubmissions.userId, userId))
      .orderBy(desc(essaySubmissions.createdAt));
  }

  async createEssaySubmission(submission: InsertEssaySubmission): Promise<EssaySubmission> {
    const [newSubmission] = await db.insert(essaySubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateEssaySubmission(id: number, submission: Partial<InsertEssaySubmission>): Promise<EssaySubmission | undefined> {
    const [updated] = await db.update(essaySubmissions)
      .set({ ...submission, updatedAt: new Date() })
      .where(eq(essaySubmissions.id, id))
      .returning();
    return updated;
  }

  // Activity Logs
  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // User Roles
  async getUserRole(userId: string): Promise<"student" | "admin"> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role?.role ?? "student";
  }

  async setUserRole(userId: string, role: "student" | "admin"): Promise<void> {
    await db.insert(userRoles)
      .values({ userId, role })
      .onConflictDoUpdate({
        target: userRoles.userId,
        set: { role, updatedAt: new Date() },
      });
  }

  async getAllUsersWithRoles(): Promise<UserWithRole[]> {
    const allUsers = await db.select().from(users);
    const roles = await db.select().from(userRoles);
    
    const roleMap = new Map(roles.map(r => [r.userId, r.role]));
    
    return allUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: roleMap.get(user.id) ?? "student",
      createdAt: user.createdAt,
    }));
  }

  // Quiz Sessions
  async getQuizSession(userId: string, materialId: number): Promise<QuizSession | undefined> {
    const [session] = await db.select().from(quizSessions)
      .where(and(
        eq(quizSessions.userId, userId),
        eq(quizSessions.materialId, materialId),
        eq(quizSessions.isCompleted, false)
      ));
    return session;
  }

  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const [newSession] = await db.insert(quizSessions).values(session).returning();
    return newSession;
  }

  async updateQuizSession(id: number, session: Partial<InsertQuizSession>): Promise<QuizSession | undefined> {
    const [updated] = await db.update(quizSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(quizSessions.id, id))
      .returning();
    return updated;
  }

  // Mentor Chats
  async getMentorChats(userId: string, limit = 50): Promise<MentorChat[]> {
    return await db.select().from(mentorChats)
      .where(eq(mentorChats.userId, userId))
      .orderBy(mentorChats.createdAt)
      .limit(limit);
  }

  async createMentorChat(chat: InsertMentorChat): Promise<MentorChat> {
    const [newChat] = await db.insert(mentorChats).values(chat).returning();
    return newChat;
  }

  async clearMentorChats(userId: string): Promise<void> {
    await db.delete(mentorChats).where(eq(mentorChats.userId, userId));
  }

  // AI Generation Jobs
  async createAiJob(job: InsertAiGenerationJob): Promise<AiGenerationJob> {
    const [newJob] = await db.insert(aiGenerationJobs).values(job).returning();
    return newJob;
  }

  async updateAiJob(id: number, job: Partial<InsertAiGenerationJob>): Promise<AiGenerationJob | undefined> {
    const [updated] = await db.update(aiGenerationJobs)
      .set(job)
      .where(eq(aiGenerationJobs.id, id))
      .returning();
    return updated;
  }

  async getAiJobs(userId?: string): Promise<AiGenerationJob[]> {
    if (userId) {
      return await db.select().from(aiGenerationJobs)
        .where(eq(aiGenerationJobs.userId, userId))
        .orderBy(desc(aiGenerationJobs.createdAt));
    }
    return await db.select().from(aiGenerationJobs)
      .orderBy(desc(aiGenerationJobs.createdAt));
  }

  // Bulk MCQ operations
  async createMcqQuestionsBulk(questions: InsertMcqQuestion[]): Promise<McqQuestion[]> {
    if (questions.length === 0) return [];
    return await db.insert(mcqQuestions).values(questions).returning();
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSiteSetting(key: string, value: string, label?: string): Promise<SiteSetting> {
    const [updated] = await db.insert(siteSettings)
      .values({ key, value, label })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return updated;
  }

  // Quiz Attempts
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttempts(userId: string, materialId?: number): Promise<QuizAttempt[]> {
    if (materialId) {
      return await db.select().from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.materialId, materialId)))
        .orderBy(desc(quizAttempts.completedAt));
    }
    return await db.select().from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getUserProgress(userId: string): Promise<{ materialId: number; bestScore: number; attempts: number }[]> {
    const attempts = await db.select().from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));
    
    const progressMap = new Map<number, { bestScore: number; attempts: number }>();
    
    for (const attempt of attempts) {
      const existing = progressMap.get(attempt.materialId);
      if (existing) {
        existing.attempts++;
        if (attempt.score > existing.bestScore) {
          existing.bestScore = attempt.score;
        }
      } else {
        progressMap.set(attempt.materialId, { bestScore: attempt.score, attempts: 1 });
      }
    }
    
    return Array.from(progressMap.entries()).map(([materialId, data]) => ({
      materialId,
      ...data
    }));
  }
}

export const storage = new DatabaseStorage();
