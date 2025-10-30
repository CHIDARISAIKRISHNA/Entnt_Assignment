const qs = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

async function http(method, url, body) {
  const init = { method, headers: { "Content-Type": "application/json" } };
  if (body) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Jobs
  async getJobs({ search = "", status = "", page = 1, pageSize = 25, sort = "order" }) {
    return await http("GET", `/jobs?${qs({ search, status, page, pageSize, sort })}`);
  },
  async createJob(payload) {
    return await http("POST", "/jobs", payload);
  },
  async patchJob(id, payload) {
    return await http("PATCH", `/jobs/${id}`, payload);
  },
  async reorderJob(id, toOrder) {
    return await http("PATCH", `/jobs/${id}/reorder`, { toOrder });
  },

  // Candidates
  async getCandidates({ search = "", stage = "", page = 1, pageSize = 100 }) {
    return await http("GET", `/candidates?${qs({ search, stage, page, pageSize })}`);
  },
  async createCandidate(payload) {
    return await http("POST", "/candidates", payload);
  },
  async patchCandidate(id, payload) {
    return await http("PATCH", `/candidates/${id}`, payload);
  },
  async getCandidateTimeline(id) {
    return await http("GET", `/candidates/${id}/timeline`);
  },

  // Assessments
  async getAssessment(jobId) {
    return await http("GET", `/assessments/${jobId}`);
  },
  async putAssessment(jobId, payload) {
    return await http("PUT", `/assessments/${jobId}`, payload);
  },
  async submitAssessment(jobId, payload) {
    return await http("POST", `/assessments/${jobId}/submit`, payload);
  },

  // Notes
  async getNotes(candidateId) {
    return await http("GET", `/notes?${qs({ candidateId })}`);
  },
  async addNote(note) {
    return await http("POST", "/notes", note);
  }
};
