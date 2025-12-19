import { db } from "./server/db";
import { subjects, topics, materials, mcqQuestions, siteSettings } from "./shared/schema";

async function seedDemoData() {
  console.log("Seeding demo data...");

  try {
    // Add site settings
    await db.insert(siteSettings).values([
      { key: "site_title", value: "CSS/PMS Exam Prep", label: "Site Title" },
      { key: "site_description", value: "Complete preparation platform for CSS and PMS exams", label: "Site Description" },
      { key: "hero_title", value: "Master Your CSS/PMS Exams", label: "Hero Title" },
      { key: "hero_subtitle", value: "AI-powered learning platform with comprehensive study materials", label: "Hero Subtitle" },
    ]).onConflictDoNothing();

    // Add subjects
    const subject1 = await db.insert(subjects).values({
      name: "Pakistan Affairs",
      description: "Complete coverage of Pakistan's history, politics, and current affairs",
      icon: "🇵🇰",
    }).returning().then(r => r[0]).catch(() => null);

    const subject2 = await db.insert(subjects).values({
      name: "English Essay",
      description: "Essay writing techniques and practice materials",
      icon: "✍️",
    }).returning().then(r => r[0]).catch(() => null);

    const subject3 = await db.insert(subjects).values({
      name: "Current Affairs",
      description: "Latest national and international affairs",
      icon: "📰",
    }).returning().then(r => r[0]).catch(() => null);

    console.log("✓ Subjects added");

    if (subject1) {
      // Add topics for Pakistan Affairs
      const topic1 = await db.insert(topics).values({
        subjectId: subject1.id,
        name: "Creation of Pakistan",
        description: "Historical background and the independence movement",
        order: 1,
      }).returning().then(r => r[0]).catch(() => null);

      const topic2 = await db.insert(topics).values({
        subjectId: subject1.id,
        name: "Political System",
        description: "Constitutional development and political institutions",
        order: 2,
      }).returning().then(r => r[0]).catch(() => null);

      console.log("✓ Topics added");

      if (topic1) {
        // Add sample material
        const material1 = await db.insert(materials).values({
          topicId: topic1.id,
          type: "theory",
          title: "Pakistan Movement Overview",
          description: "Comprehensive notes on the Pakistan Movement",
          content: "The Pakistan Movement was a political movement in the 20th century that aimed for the creation of Pakistan...",
          order: 1,
        }).returning().then(r => r[0]).catch(() => null);

        const material2 = await db.insert(materials).values({
          topicId: topic1.id,
          type: "mcq",
          title: "Pakistan Movement Quiz",
          description: "Test your knowledge with 10 questions",
          order: 2,
        }).returning().then(r => r[0]).catch(() => null);

        console.log("✓ Materials added");

        if (material2) {
          // Add sample MCQ questions
          await db.insert(mcqQuestions).values([
            {
              materialId: material2.id,
              question: "When was Pakistan created?",
              optionA: "14th August 1947",
              optionB: "15th August 1947",
              optionC: "14th August 1948",
              optionD: "15th August 1948",
              correctAnswer: "A",
              explanation: "Pakistan gained independence on 14th August 1947",
              order: 0,
            },
            {
              materialId: material2.id,
              question: "Who was the founder of Pakistan?",
              optionA: "Allama Iqbal",
              optionB: "Quaid-e-Azam Muhammad Ali Jinnah",
              optionC: "Liaquat Ali Khan",
              optionD: "Fatima Jinnah",
              correctAnswer: "B",
              explanation: "Quaid-e-Azam Muhammad Ali Jinnah is recognized as the founder of Pakistan",
              order: 1,
            },
          ]).onConflictDoNothing();

          console.log("✓ MCQ questions added");
        }
      }
    }

    if (subject2) {
      await db.insert(topics).values({
        subjectId: subject2.id,
        name: "Essay Writing Basics",
        description: "Fundamental techniques for effective essay writing",
        order: 1,
      }).onConflictDoNothing();

      await db.insert(topics).values({
        subjectId: subject2.id,
        name: "Sample Essays",
        description: "Collection of high-quality sample essays",
        order: 2,
      }).onConflictDoNothing();
    }

    if (subject3) {
      await db.insert(topics).values({
        subjectId: subject3.id,
        name: "International Affairs 2024",
        description: "Major international events and developments",
        order: 1,
      }).onConflictDoNothing();

      await db.insert(topics).values({
        subjectId: subject3.id,
        name: "National Affairs 2024",
        description: "Important national events and policies",
        order: 2,
      }).onConflictDoNothing();
    }

    console.log("\n✅ Demo data seeded successfully!");
    console.log("You can now browse subjects, topics, and materials in the UI");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

seedDemoData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
