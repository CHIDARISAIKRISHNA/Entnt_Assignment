// Simple frontend-only data store with localStorage persistence
import { v4 as uuid } from "uuid";

let store = {
  jobs: [],
  candidates: [],
  assessments: []
};

// Load from localStorage on init
function loadStore() {
  try {
    const stored = localStorage.getItem('talentflow-store');
    if (stored) {
      store = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage', e);
  }
}

// Save to localStorage
function saveStore() {
  try {
    localStorage.setItem('talentflow-store', JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// Initialize with seed data if empty
function seedIfEmpty() {
  if (store.jobs.length === 0) {
    const tags = ["frontend","backend","fullstack","intern","mid","senior"];
    store.jobs = Array.from({length:25}).map((_,i) => ({
      id: uuid(),
      title: `Job ${i+1} — ${tags[i%tags.length]}`,
      slug: `job-${i+1}`,
      status: i%5 === 0 ? "archived" : "active",
      tags: [tags[i%tags.length]],
      order: i+1
    }));

    const candidatesData = [
      ["Amit Shah", "amit.shah@example.com"],
      ["Sana Kumar", "sana.kumar@example.com"],
      ["Karan Patel", "karan.patel@example.com"],
      ["Priya Singh", "priya.singh@example.com"],
      ["Rahul Iyer", "rahul.iyer@example.com"],
      ["Anita Reddy", "anita.reddy@example.com"],
      ["Vikram Khan", "vikram.khan@example.com"],
      ["Sneha Gupta", "sneha.gupta@example.com"],
      ["Riya Sharma", "riya.sharma@example.com"],
      ["Arjun Verma", "arjun.verma@example.com"]
    ];
    
    const stages = ["applied","screen","tech","offer","hired","rejected"];
    store.candidates = candidatesData.map(([name, email], i) => ({
      id: uuid(),
      name,
      email,
      stage: stages[Math.floor(Math.random()*stages.length)],
      jobId: store.jobs[Math.floor(Math.random()*store.jobs.length)].id
    }));

    saveStore();
  }
}

// Initialize
loadStore();
seedIfEmpty();

export const api = {
  // Jobs
  async getJobs({search="", status="", page=1, pageSize=25}) {
    await new Promise(resolve => setTimeout(resolve, 100));
    let items = [...store.jobs];
    
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(j => 
        j.title.toLowerCase().includes(s) || 
        (j.tags||[]).join(" ").toLowerCase().includes(s)
      );
    }
    if (status) {
      items = items.filter(j => j.status === status);
    }
    
    items.sort((a,b) => (a.order||0) - (b.order||0));
    const start = (page-1)*pageSize;
    const paged = items.slice(start, start+pageSize);
    
    return { items: paged, total: items.length };
  },

  async createJob(payload) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const job = {
      id: uuid(),
      status: "active",
      order: store.jobs.length + 1,
      ...payload
    };
    store.jobs.push(job);
    saveStore();
    return job;
  },

  async patchJob(id, payload) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const job = store.jobs.find(j => j.id === id);
    if (!job) throw new Error("Job not found");
    Object.assign(job, payload);
    saveStore();
    return job;
  },

  async reorderJob(id, toOrder) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const job = store.jobs.find(j => j.id === id);
    if (!job) throw new Error("Job not found");
    
    const all = [...store.jobs].sort((a,b) => (a.order||0) - (b.order||0));
    const filtered = all.filter(j => j.id !== id);
    filtered.splice(Math.max(0, toOrder-1), 0, job);
    
    filtered.forEach((j, idx) => {
      j.order = idx + 1;
    });
    
    saveStore();
    return { success: true };
  },

  // Candidates
  async getCandidates({search="", stage="", page=1, pageSize=100}) {
    await new Promise(resolve => setTimeout(resolve, 100));
    let items = [...store.candidates];
    
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s)
      );
    }
    if (stage) {
      items = items.filter(c => c.stage === stage);
    }
    
    const start = (page-1)*pageSize;
    const paged = items.slice(start, start+pageSize);
    
    return { items: paged, total: items.length };
  },

  async patchCandidate(id, payload) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const candidate = store.candidates.find(c => c.id === id);
    if (!candidate) throw new Error("Candidate not found");
    Object.assign(candidate, payload);
    saveStore();
    return candidate;
  },

  // Assessments
  async getAssessment(jobId) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return store.assessments.find(a => a.jobId === jobId) || null;
  },

  async putAssessment(jobId, payload) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const existing = store.assessments.find(a => a.jobId === jobId);
    if (existing) {
      Object.assign(existing, payload);
    } else {
      store.assessments.push({ jobId, ...payload });
    }
    saveStore();
    return { ok: true };
  },

  async submitAssessment(jobId, payload) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const assessment = store.assessments.find(a => a.jobId === jobId);
    if (assessment) {
      if (!assessment.responses) assessment.responses = [];
      assessment.responses.push({
        id: uuid(),
        submittedAt: Date.now(),
        payload
      });
    }
    saveStore();
    return { ok: true };
  }
};
