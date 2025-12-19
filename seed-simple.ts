import Database from "better-sqlite3";

const db = new Database("./local.db");

console.log("Seeding demo data...");

try {
  // Site settings
  db.exec(`
    INSERT OR IGNORE INTO site_settings (key, value, label) VALUES
      ('site_title', 'CSS/PMS Exam Prep', 'Site Title'),
      ('site_description', 'Complete preparation platform for CSS and PMS exams', 'Site Description'),
      ('hero_title', 'Master Your CSS/PMS Exams', 'Hero Title'),
      ('hero_subtitle', 'AI-powered learning platform with comprehensive study materials', 'Hero Subtitle');
  `);
  console.log("✓ Site settings added");

  // Subjects
  db.exec(`
    INSERT OR IGNORE INTO subjects (id, name, description, icon) VALUES
      (1, 'Pakistan Affairs', 'Complete coverage of Pakistan''s history, politics, and current affairs', '🇵🇰'),
      (2, 'English Essay', 'Essay writing techniques and practice materials', '✍️'),
      (3, 'Current Affairs', 'Latest national and international affairs', '📰'),
      (4, 'Economics', 'Economic theories and Pakistan''s economy', '💰'),
      (5, 'International Relations', 'Global politics and Pakistan''s foreign policy', '🌍');
  `);
  console.log("✓ Subjects added");

  // Topics
  db.exec(`
    INSERT OR IGNORE INTO topics (id, subject_id, name, description, "order") VALUES
      (1, 1, 'Creation of Pakistan', 'Historical background and the independence movement', 1),
      (2, 1, 'Political System', 'Constitutional development and political institutions', 2),
      (3, 1, 'Foreign Policy', 'Pakistan''s relations with other countries', 3),
      (4, 2, 'Essay Writing Basics', 'Fundamental techniques for effective essay writing', 1),
      (5, 2, 'Sample Essays', 'Collection of high-quality sample essays', 2),
      (6, 3, 'International Affairs 2024', 'Major international events and developments', 1),
      (7, 3, 'National Affairs 2024', 'Important national events and policies', 2),
      (8, 4, 'Microeconomics', 'Individual economic decisions and markets', 1),
      (9, 4, 'Macroeconomics', 'National economy and policy', 2),
      (10, 5, 'UN and Global Organizations', 'Role and functions of international bodies', 1);
  `);
  console.log("✓ Topics added");

  // Materials
  db.exec(`
    INSERT OR IGNORE INTO materials (id, topic_id, type, title, description, content, "order") VALUES
      (1, 1, 'theory', 'Pakistan Movement Overview', 'Comprehensive notes on the Pakistan Movement',
       'The Pakistan Movement was a political movement in the 20th century that aimed for the creation of Pakistan from British India. The movement was led by the All-India Muslim League under the leadership of Muhammad Ali Jinnah.

Key Events:
- Lahore Resolution (1940): Demanded separate states for Muslims
- Cabinet Mission Plan (1946): Attempted to keep India united
- Direct Action Day (16 August 1946): Led to communal violence
- Indian Independence Act (1947): Created Pakistan and India
- Partition (14-15 August 1947): Pakistan gained independence

The movement was based on the Two-Nation Theory, which stated that Muslims and Hindus were two distinct nations with their own customs, religion, and traditions.', 1),

      (2, 1, 'mcq', 'Pakistan Movement Quiz', 'Test your knowledge with 10 questions', NULL, 2),

      (3, 2, 'theory', 'Constitutional History', 'Evolution of Pakistan''s constitution',
       'Pakistan has had three constitutions: 1956, 1962, and 1973. The current constitution was adopted in 1973 and established Pakistan as a federal parliamentary republic.', 1),

      (4, 4, 'essay', 'Essay Structure Guide', 'How to structure a perfect essay',
       'A good essay has three main parts: Introduction, Body, and Conclusion.

Introduction: Hook the reader, provide context, state your thesis.

Body: Present arguments with evidence, use topic sentences, maintain logical flow.

Conclusion: Summarize main points, restate thesis, provide closure.

Remember: Plan before writing, use clear language, proofread carefully.', 1),

      (5, 6, 'theory', 'Middle East Crisis', 'Current situation in the Middle East',
       'The Middle East continues to face multiple challenges including the Israeli-Palestinian conflict, political instability, and economic pressures. Recent developments have significant implications for regional and global security.', 1);
  `);
  console.log("✓ Materials added");

  // MCQ Questions
  db.exec(`
    INSERT OR IGNORE INTO mcq_questions (material_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, "order") VALUES
      (2, 'When was Pakistan created?', '14th August 1947', '15th August 1947', '14th August 1948', '15th August 1948', 'A', 'Pakistan gained independence on 14th August 1947', 0),
      (2, 'Who was the founder of Pakistan?', 'Allama Iqbal', 'Quaid-e-Azam Muhammad Ali Jinnah', 'Liaquat Ali Khan', 'Fatima Jinnah', 'B', 'Quaid-e-Azam Muhammad Ali Jinnah is recognized as the founder of Pakistan', 1),
      (2, 'What was the Lahore Resolution?', 'A declaration of war', 'Demand for separate Muslim states', 'A peace treaty', 'Economic reform plan', 'B', 'The Lahore Resolution of 1940 demanded separate states for Muslims in British India', 2),
      (2, 'Who was the first Prime Minister of Pakistan?', 'Muhammad Ali Jinnah', 'Liaquat Ali Khan', 'Khawaja Nazimuddin', 'Iskander Mirza', 'B', 'Liaquat Ali Khan served as the first Prime Minister of Pakistan', 3),
      (2, 'What does "Pakistan" mean?', 'Land of Rivers', 'Land of the Pure', 'Land of Freedom', 'Land of Peace', 'B', 'Pakistan means "Land of the Pure" in Urdu and Persian', 4),
      (2, 'When was the Lahore Resolution passed?', '1940', '1945', '1947', '1935', 'A', 'The Lahore Resolution was passed on 23rd March 1940', 5),
      (2, 'Who presented the Pakistan Resolution?', 'Muhammad Ali Jinnah', 'Allama Iqbal', 'A.K. Fazlul Huq', 'Liaquat Ali Khan', 'C', 'A.K. Fazlul Huq presented the Pakistan Resolution in Lahore', 6),
      (2, 'What was the capital of Pakistan initially?', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'B', 'Karachi was the first capital of Pakistan from 1947-1959', 7);
  `);
  console.log("✓ MCQ questions added");

  console.log("\n✅ Demo data seeded successfully!");
  console.log("📊 Summary:");

  const counts = {
    subjects: db.prepare("SELECT COUNT(*) as count FROM subjects").get() as any,
    topics: db.prepare("SELECT COUNT(*) as count FROM topics").get() as any,
    materials: db.prepare("SELECT COUNT(*) as count FROM materials").get() as any,
    questions: db.prepare("SELECT COUNT(*) as count FROM mcq_questions").get() as any,
  };

  console.log(`   - ${counts.subjects.count} Subjects`);
  console.log(`   - ${counts.topics.count} Topics`);
  console.log(`   - ${counts.materials.count} Materials`);
  console.log(`   - ${counts.questions.count} MCQ Questions`);

} catch (error) {
  console.error("Error seeding data:", error);
  throw error;
} finally {
  db.close();
}
