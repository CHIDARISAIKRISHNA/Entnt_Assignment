import { createServer, Response } from "miragejs";
import { db, seedIfEmpty, dedupeJobs, ensureThreeAssessmentsWithTen } from "./lib/db";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withLatency = async () => sleep(200 + Math.random() * 1000);
const maybeError = () => Math.random() < 0.08; // 8% error on writes

export function makeServer() {
  const server = createServer({
    routes() {
      this.timing = 0; // we manually delay
      this.namespace = "/";

      this.get("/jobs", async (schema, request) => {
        await withLatency();
        const { search = "", status = "", page = "1", pageSize = "25", sort = "order" } = request.queryParams;
        let items = await db.jobs.toArray();
        if (search) {
          const s = search.toLowerCase();
          items = items.filter((j) => j.title.toLowerCase().includes(s) || (j.tags || []).join(" ").toLowerCase().includes(s));
        }
        if (status) items = items.filter((j) => j.status === status);
        if (sort === "order") items.sort((a, b) => (a.order || 0) - (b.order || 0));
        const p = Number(page) || 1;
        const ps = Number(pageSize) || 25;
        const start = (p - 1) * ps;
        return { items: items.slice(start, start + ps), total: items.length };
      });

      this.post("/jobs", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const payload = JSON.parse(request.requestBody || "{}");
        // slug uniqueness
        const existing = await db.jobs.where("slug").equals(payload.slug).first();
        if (existing) return new Response(400, {}, { message: "Slug must be unique" });
        const count = await db.jobs.count();
        const job = { id: crypto.randomUUID(), status: "active", order: count + 1, tags: [], ...payload };
        await db.jobs.add(job);
        return job;
      });

      this.patch("/jobs/:id", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const id = request.params.id;
        const patch = JSON.parse(request.requestBody || "{}");
        const job = await db.jobs.get(id);
        if (!job) return new Response(404, {}, { message: "Job not found" });
        if (patch.slug && patch.slug !== job.slug) {
          const existing = await db.jobs.where("slug").equals(patch.slug).first();
          if (existing) return new Response(400, {}, { message: "Slug must be unique" });
        }
        await db.jobs.update(id, { ...job, ...patch });
        return await db.jobs.get(id);
      });

      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await withLatency();
        // occasionally fail to test rollback
        if (maybeError()) return new Response(500, {}, { message: "Reorder failed" });
        const id = request.params.id;
        const { toOrder } = JSON.parse(request.requestBody || "{}");
        const list = (await db.jobs.toArray()).sort((a, b) => (a.order || 0) - (b.order || 0));
        const moving = list.find((j) => j.id === id);
        if (!moving) return new Response(404, {}, { message: "Job not found" });
        const filtered = list.filter((j) => j.id !== id);
        filtered.splice(Math.max(0, (toOrder || 1) - 1), 0, moving);
        await db.transaction("rw", db.jobs, async () => {
          for (let i = 0; i < filtered.length; i++) {
            await db.jobs.update(filtered[i].id, { order: i + 1 });
          }
        });
        return { ok: true };
      });

      this.get("/candidates", async (schema, request) => {
        await withLatency();
        const { search = "", stage = "", page = "1", pageSize = "100" } = request.queryParams;
        let items = await db.candidates.toArray();
        if (search) {
          const s = search.toLowerCase();
          items = items.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s));
        }
        if (stage) items = items.filter((c) => c.stage === stage);
        const p = Number(page) || 1;
        const ps = Number(pageSize) || 100;
        const start = (p - 1) * ps;
        return { items: items.slice(start, start + ps), total: items.length };
      });

      this.post("/candidates", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const payload = JSON.parse(request.requestBody || "{}");
        const candidate = { id: crypto.randomUUID(), stage: "applied", ...payload };
        await db.candidates.add(candidate);
        await db.timelines.add({ candidateId: candidate.id, at: Date.now(), action: "created" });
        return candidate;
      });

      this.patch("/candidates/:id", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const id = request.params.id;
        const patch = JSON.parse(request.requestBody || "{}");
        const existing = await db.candidates.get(id);
        if (!existing) return new Response(404, {}, { message: "Not found" });
        await db.candidates.update(id, { ...existing, ...patch });
        if (patch.stage && patch.stage !== existing.stage) {
          await db.timelines.add({ candidateId: id, at: Date.now(), action: "stage_change", toStage: patch.stage });
        }
        return await db.candidates.get(id);
      });

      this.get("/candidates/:id/timeline", async (schema, request) => {
        await withLatency();
        const id = request.params.id;
        const items = await db.timelines.where("candidateId").equals(id).toArray();
        items.sort((a, b) => (a.at || 0) - (b.at || 0));
        return { items };
      });

      this.get("/assessments/:jobId", async (schema, request) => {
        await withLatency();
        const { jobId } = request.params;
        const a = await db.assessments.get({ jobId });
        return a || null;
      });

      this.put("/assessments/:jobId", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const { jobId } = request.params;
        const payload = JSON.parse(request.requestBody || "{}");
        await db.assessments.put({ jobId, ...payload });
        return { ok: true };
      });

      this.post("/assessments/:jobId/submit", async (schema, request) => {
        await withLatency();
        if (maybeError()) return new Response(500, {}, { message: "Random failure" });
        const { jobId } = request.params;
        const { candidateId, payload } = JSON.parse(request.requestBody || "{}");
        await db.responses.add({ jobId, candidateId: candidateId || null, payload, submittedAt: Date.now() });
        return { ok: true };
      });

      this.post("/notes", async (schema, request) => {
        await withLatency();
        const payload = JSON.parse(request.requestBody || "{}");
        await db.notes.add({ ...payload, at: Date.now() });
        return { ok: true };
      });

      this.get("/notes", async (schema, request) => {
        await withLatency();
        const { candidateId } = request.queryParams;
        const items = candidateId
          ? await db.notes.where("candidateId").equals(candidateId).toArray()
          : await db.notes.toArray();
        items.sort((a, b) => (a.at || 0) - (b.at || 0));
        return { items };
      });
    }
  });

  // Ensure seed is done
  seedIfEmpty();
  // Clean up any duplicates created from prior runs
  dedupeJobs();
  // Guarantee 3 assessments with >= 10 questions
  ensureThreeAssessmentsWithTen();
  return server;
}


