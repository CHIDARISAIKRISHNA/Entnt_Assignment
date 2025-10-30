import Dexie from "dexie";
import { faker } from "@faker-js/faker";

export const db = new Dexie("talentflow-db");

db.version(1).stores({
  jobs: "id, slug, status, order",
  candidates: "id, email, stage, jobId",
  timelines: "++id, candidateId, at",
  notes: "++id, candidateId, at",
  assessments: "jobId",
  responses: "++id, jobId, candidateId, submittedAt"
});

export async function seedIfEmpty() {
  const jobCount = await db.jobs.count();
  if (jobCount > 0) return; // already seeded

  const tags = ["frontend", "backend", "fullstack", "intern", "mid", "senior"];
  const jobs = Array.from({ length: 25 }).map((_, i) => ({
    id: crypto.randomUUID(),
    title: `Job ${i + 1} — ${tags[i % tags.length]}`,
    slug: `job-${i + 1}`,
    status: i % 5 === 0 ? "archived" : "active",
    tags: [tags[i % tags.length]],
    order: i + 1
  }));
  await db.jobs.bulkAdd(jobs);

  const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];
  const candidates = Array.from({ length: 1000 }).map(() => ({
    id: crypto.randomUUID(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    stage: stages[Math.floor(Math.random() * stages.length)],
    jobId: jobs[Math.floor(Math.random() * jobs.length)].id
  }));
  await db.candidates.bulkAdd(candidates);

  const timelines = candidates.flatMap((c) => {
    const steps = faker.number.int({ min: 1, max: 4 });
    const events = [];
    let ts =
      Date.now() - faker.number.int({ min: 3, max: 15 }) * 24 * 3600 * 1000;
    for (let i = 0; i < steps; i++) {
      const toStage = stages[Math.floor(Math.random() * stages.length)];
      events.push({ candidateId: c.id, at: ts, action: "stage_change", toStage });
      ts += faker.number.int({ min: 1, max: 5 }) * 24 * 3600 * 1000;
    }
    return events;
  });
  if (timelines.length) await db.timelines.bulkAdd(timelines);

  // -------------------------
  // Assessments (fixed version)
  // -------------------------

  const assessmentCount = await db.assessments.count();
  if (assessmentCount > 0) return; // already seeded assessments

  const assessmentJobs = jobs.slice(0, 3);

  for (const job of assessmentJobs) {
    // create a new question bank per job (to avoid repeated objects)
    const questionBank = [
      {
        type: "single",
        label: "Do you have experience with React?",
        required: true,
        options: ["Yes", "No"].map((l) => ({
          id: crypto.randomUUID(),
          label: l
        }))
      },
      {
        type: "short",
        label: "What is your current role?",
        required: true,
        maxLength: 80
      },
      {
        type: "long",
        label: "Briefly describe a project you're proud of.",
        required: false,
        maxLength: 500
      },
      {
        type: "number",
        label: "How many years of JavaScript experience?",
        required: true,
        min: 0,
        max: 20
      },
      {
        type: "single",
        label: "Are you comfortable with TypeScript?",
        required: true,
        options: ["Yes", "No", "Learning"].map((l) => ({
          id: crypto.randomUUID(),
          label: l
        }))
      },
      {
        type: "multi",
        label: "Which frontend tools have you used?",
        required: false,
        options: ["React", "Vue", "Angular", "Vite", "Webpack"].map((l) => ({
          id: crypto.randomUUID(),
          label: l
        }))
      },
      {
        type: "short",
        label: "Preferred working style (remote/hybrid/office)?",
        required: true,
        maxLength: 40
      },
      {
        type: "number",
        label: "What is your notice period (weeks)?",
        required: false,
        min: 0,
        max: 16
      },
      {
        type: "single",
        label: "Do you have experience with state management libraries?",
        required: false,
        options: ["Redux", "Zustand", "MobX", "No"].map((l) => ({
          id: crypto.randomUUID(),
          label: l
        }))
      },
      {
        type: "file",
        label: "Upload a sample or portfolio (filename only)",
        required: false
      },
      {
        type: "single",
        label: "Have you worked with testing libraries?",
        required: true,
        options: ["Yes", "No"].map((l) => ({
          id: crypto.randomUUID(),
          label: l
        }))
      }
    ];

    const section1 = { id: crypto.randomUUID(), title: "Basics", questions: [] };
    const section2 = {
      id: crypto.randomUUID(),
      title: "Experience",
      questions: []
    };

    // first 5 → section1, next 5 → section2
    questionBank.slice(0, 5).forEach((q) => {
      section1.questions.push({ id: crypto.randomUUID(), ...q });
    });
    questionBank.slice(5, 10).forEach((q) => {
      section2.questions.push({ id: crypto.randomUUID(), ...q });
    });

    // conditional: only show section2[0] if React experience = Yes
    const dependsOnId = section1.questions[0].id;
    section2.questions[0].showIf = { questionId: dependsOnId, equals: "Yes" };

    await db.assessments.put({ jobId: job.id, sections: [section1, section2] });
  }

  console.log("✅ Seed complete: jobs, candidates, timelines, assessments added.");
}

// Remove duplicate jobs by slug and normalize order
export async function dedupeJobs() {
  const jobs = await db.jobs.toArray();
  if (!jobs || jobs.length === 0) return;
  const seen = new Map();
  const toDelete = [];
  for (const j of jobs) {
    const key = j.slug || j.id;
    if (seen.has(key)) {
      toDelete.push(j.id);
    } else {
      seen.set(key, j);
    }
  }
  if (toDelete.length) {
    await db.jobs.bulkDelete(toDelete);
  }
  // Re-number order field sequentially based on current sort
  const remaining = (await db.jobs.toArray()).sort((a,b)=> (a.order||0) - (b.order||0));
  await db.transaction("rw", db.jobs, async () => {
    for (let i = 0; i < remaining.length; i++) {
      const j = remaining[i];
      if (j.order !== i + 1) await db.jobs.update(j.id, { order: i + 1 });
    }
  });
}

// Ensure at least the first 3 jobs each have >= 10 questions in an assessment
export async function ensureThreeAssessmentsWithTen() {
  const jobs = (await db.jobs.toArray()).sort((a,b)=> (a.order||0) - (b.order||0));
  const target = jobs.slice(0, 3);
  if (!target.length) return;

  for (const job of target) {
    const existing = await db.assessments.get({ jobId: job.id });
    const existingCount = (existing?.sections||[]).reduce((sum,s)=> sum + (s.questions?.length||0), 0);
    if (!existing || existingCount < 10) {
      // generate a fresh 10-question assessment (same shape as seed)
      const questionBank = [
        { type: "single", label: "Do you have experience with React?", required: true, options: ["Yes","No"].map(l=>({ id: crypto.randomUUID(), label: l })) },
        { type: "short", label: "What is your current role?", required: true, maxLength: 80 },
        { type: "long", label: "Briefly describe a project you're proud of.", required: false, maxLength: 500 },
        { type: "number", label: "How many years of JavaScript experience?", required: true, min: 0, max: 20 },
        { type: "single", label: "Are you comfortable with TypeScript?", required: true, options: ["Yes","No","Learning"].map(l=>({ id: crypto.randomUUID(), label: l })) },
        { type: "multi", label: "Which frontend tools have you used?", required: false, options: ["React","Vue","Angular","Vite","Webpack"].map(l=>({ id: crypto.randomUUID(), label: l })) },
        { type: "short", label: "Preferred working style (remote/hybrid/office)?", required: true, maxLength: 40 },
        { type: "number", label: "What is your notice period (weeks)?", required: false, min: 0, max: 16 },
        { type: "single", label: "Do you have experience with state management libraries?", required: false, options: ["Redux","Zustand","MobX","No"].map(l=>({ id: crypto.randomUUID(), label: l })) },
        { type: "file", label: "Upload a sample or portfolio (filename only)", required: false },
        { type: "single", label: "Have you worked with testing libraries?", required: true, options: ["Yes","No"].map(l=>({ id: crypto.randomUUID(), label: l })) }
      ];

      const section1 = { id: crypto.randomUUID(), title: "Basics", questions: [] };
      const section2 = { id: crypto.randomUUID(), title: "Experience", questions: [] };
      questionBank.slice(0,5).forEach(q=> section1.questions.push({ id: crypto.randomUUID(), ...q }));
      questionBank.slice(5,10).forEach(q=> section2.questions.push({ id: crypto.randomUUID(), ...q }));
      // conditional
      const dependsOnId = section1.questions[0].id;
      if (section2.questions[0]) {
        section2.questions[0].showIf = { questionId: dependsOnId, equals: "Yes" };
      }
      await db.assessments.put({ jobId: job.id, sections: [section1, section2] });
    }
  }
}