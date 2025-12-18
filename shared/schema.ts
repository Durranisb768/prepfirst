import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const materialTypeEnum = pgEnum("material_type", ["book", "past_paper", "essay", "mcq", "theory"]);

// User roles table (extends auth users)
export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id").primaryKey(),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema for user roles
export const insertUserRoleSchema = createInsertSchema(userRoles).pick({ userId: true, role: true });
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

// Subjects table
export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
}));

export const insertSubjectSchema = createInsertSchema(subjects, {
  name: (schema) => schema.min(1, "Name is required").max(255),
}).pick({ name: true, description: true, icon: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Topics table (supports hierarchical sub-topics via parentTopicId)
export const topics = pgTable("topics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  parentTopicId: integer("parent_topic_id"), // For sub-topics - references parent topic
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // Direct content for the topic (admin editable)
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }),
  parentTopic: one(topics, { fields: [topics.parentTopicId], references: [topics.id], relationName: "subTopics" }),
  subTopics: many(topics, { relationName: "subTopics" }),
  materials: many(materials),
}));

export const insertTopicSchema = createInsertSchema(topics, {
  name: (schema) => schema.min(1, "Name is required").max(255),
}).pick({ subjectId: true, parentTopicId: true, name: true, description: true, content: true, order: true });
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

// Materials table (base for all content types)
export const materials = pgTable("materials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  topicId: integer("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  type: materialTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // For theory, essays, etc.
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialsRelations = relations(materials, ({ one, many }) => ({
  topic: one(topics, { fields: [materials.topicId], references: [topics.id] }),
  mcqQuestions: many(mcqQuestions),
  bookChapters: many(bookChapters),
}));

export const insertMaterialSchema = createInsertSchema(materials, {
  title: (schema) => schema.min(1, "Title is required").max(255),
}).pick({ topicId: true, type: true, title: true, description: true, content: true, order: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// MCQ Questions table
export const mcqQuestions = pgTable("mcq_questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionUrdu: text("question_urdu"), // Urdu translation
  optionA: varchar("option_a", { length: 500 }).notNull(),
  optionAUrdu: varchar("option_a_urdu", { length: 500 }),
  optionB: varchar("option_b", { length: 500 }).notNull(),
  optionBUrdu: varchar("option_b_urdu", { length: 500 }),
  optionC: varchar("option_c", { length: 500 }),
  optionCUrdu: varchar("option_c_urdu", { length: 500 }),
  optionD: varchar("option_d", { length: 500 }),
  optionDUrdu: varchar("option_d_urdu", { length: 500 }),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(), // A, B, C, or D
  explanation: text("explanation"),
  explanationUrdu: text("explanation_urdu"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mcqQuestionsRelations = relations(mcqQuestions, ({ one }) => ({
  material: one(materials, { fields: [mcqQuestions.materialId], references: [materials.id] }),
}));

export const insertMcqQuestionSchema = createInsertSchema(mcqQuestions, {
  question: (schema) => schema.min(1, "Question is required"),
}).pick({ 
  materialId: true, question: true, questionUrdu: true, 
  optionA: true, optionAUrdu: true, optionB: true, optionBUrdu: true, 
  optionC: true, optionCUrdu: true, optionD: true, optionDUrdu: true, 
  correctAnswer: true, explanation: true, explanationUrdu: true, order: true 
});
export type InsertMcqQuestion = z.infer<typeof insertMcqQuestionSchema>;
export type McqQuestion = typeof mcqQuestions.$inferSelect;

// Book Chapters table
export const bookChapters = pgTable("book_chapters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookChaptersRelations = relations(bookChapters, ({ one }) => ({
  material: one(materials, { fields: [bookChapters.materialId], references: [materials.id] }),
}));

export const insertBookChapterSchema = createInsertSchema(bookChapters, {
  title: (schema) => schema.min(1, "Title is required").max(255),
}).pick({ materialId: true, title: true, content: true, order: true });
export type InsertBookChapter = z.infer<typeof insertBookChapterSchema>;
export type BookChapter = typeof bookChapters.$inferSelect;

// Essay Submissions table (for student submissions)
export const essaySubmissions = pgTable("essay_submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("submitted"), // submitted, reviewed, graded
  feedback: text("feedback"),
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEssaySubmissionSchema = createInsertSchema(essaySubmissions, {
  title: (schema) => schema.min(1, "Title is required").max(255),
  content: (schema) => schema.min(1, "Content is required"),
}).pick({ materialId: true, userId: true, title: true, content: true, status: true, feedback: true, score: true });
export type InsertEssaySubmission = z.infer<typeof insertEssaySubmissionSchema>;
export type EssaySubmission = typeof essaySubmissions.$inferSelect;

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }), // subject, topic, material, etc.
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({ userId: true, action: true, entityType: true, entityId: true, details: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Quiz Sessions table (for saving student progress)
export const quizSessions = pgTable("quiz_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  answeredQuestions: text("answered_questions"), // JSON array of answered question IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).pick({
  userId: true, materialId: true, currentQuestionIndex: true, correctAnswers: true, totalQuestions: true, isCompleted: true, answeredQuestions: true
});
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;

// Mentor Chat Messages table
export const mentorChats = pgTable("mentor_chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorChatSchema = createInsertSchema(mentorChats).pick({ userId: true, role: true, content: true });
export type InsertMentorChat = z.infer<typeof insertMentorChatSchema>;
export type MentorChat = typeof mentorChats.$inferSelect;

// Quiz Attempts table (stores detailed per-question answers)
export const quizAttempts = pgTable("quiz_attempts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  score: integer("score").notNull(), // Percentage 0-100
  answers: text("answers").notNull(), // JSON array of {questionId, selectedAnswer, isCorrect}
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true, materialId: true, totalQuestions: true, correctAnswers: true, score: true, answers: true
});
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// AI Generation Jobs table (for tracking MCQ generation)
export const aiGenerationJobs = pgTable("ai_generation_jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  jobType: varchar("job_type", { length: 50 }).notNull(), // "mcq_generation", "theory_summary", etc.
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processing, completed, failed
  inputText: text("input_text"),
  outputData: text("output_data"), // JSON result
  totalChunks: integer("total_chunks"),
  processedChunks: integer("processed_chunks").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAiGenerationJobSchema = createInsertSchema(aiGenerationJobs).pick({
  userId: true, jobType: true, status: true, inputText: true, outputData: true, totalChunks: true, processedChunks: true, errorMessage: true, completedAt: true
});
export type InsertAiGenerationJob = z.infer<typeof insertAiGenerationJobSchema>;
export type AiGenerationJob = typeof aiGenerationJobs.$inferSelect;

// Zod schemas for API validation
export const createSubjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
});

export const createTopicSchema = z.object({
  subjectId: z.number().int().positive(),
  parentTopicId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createMaterialSchema = z.object({
  topicId: z.number().int().positive(),
  type: z.enum(["book", "past_paper", "essay", "mcq", "theory"]),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createMcqQuestionSchema = z.object({
  materialId: z.number().int().positive(),
  question: z.string().min(1, "Question is required"),
  optionA: z.string().min(1, "Option A is required").max(500),
  optionB: z.string().min(1, "Option B is required").max(500),
  optionC: z.string().max(500).optional(),
  optionD: z.string().max(500).optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createBookChapterSchema = z.object({
  materialId: z.number().int().positive(),
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createEssaySubmissionSchema = z.object({
  materialId: z.number().int().positive(),
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
});

// Site Settings table (for global editable text)
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  label: varchar("label", { length: 255 }), // Human-readable label for admin UI
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).pick({ key: true, value: true, label: true });
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

// Types for API responses
export interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

export interface TopicWithMaterials extends Topic {
  materials: Material[];
}

export interface MaterialWithContent extends Material {
  mcqQuestions?: McqQuestion[];
  bookChapters?: BookChapter[];
}

export interface UserWithRole {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "student" | "admin";
  createdAt: Date | null;
}
