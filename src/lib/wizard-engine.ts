"use client";
import { completeUpload, getValidationJob, loadRun, startUpload, startValidation } from "@/lib/actions/ecl";
import { setDraft, type Dataset, type Draft, type EngineCriterion, type FileState, type Outcome, type RunPhase } from "@/hooks/useRunDraft";

const KIND: Record<Dataset, "PD" | "LGD" | "EAD"> = { pd: "PD", lgd: "LGD", ead: "EAD" };
const PARALLEL = 4; // parts in flight per file

/** Engine run → wizard state. Called on open (?run=) and after each server-side change. */
export async function hydrate(runId: string): Promise<boolean> {
  const r = await loadRun(runId);
  if (!r.ok) return false;
  const run = r.data;
  const files: Partial<Record<Dataset, FileState>> = {};
  for (const k of ["pd", "lgd", "ead"] as Dataset[]) {
    const ups = (run.inputs ?? []).filter((u) => u.kind === KIND[k]);
    const u = ups.at(-1);
    if (!u) { files[k] = { status: "empty" }; continue; }
    const accepted = u.status === "ok" || (u.status === "warn" && u.warningsAccepted);
    files[k] = { status: accepted ? "accepted" : u.status ? "report" : "uploaded", name: ups.map((x) => x.filename).join(" + "), sizeMb: +(ups.reduce((a, x) => a + x.size, 0) / 1048576).toFixed(1), rows: ups.reduce((a, x) => a + (x.rows ?? 0), 0), sha: u.sha256,
      outcome: u.status === "ok" ? "passed" : u.status === "warn" ? "warnings" : u.status ? "failed" : undefined };
  }
  const phase: RunPhase = run.status === "computing" ? "computing" : run.status === "failed" && run.failureStage ? "compute-failed" : run.status === "signed-off" ? "signed-off" : run.status === "returned" ? "returned" : run.status === "needs-review" ? "submitted" : run.totalEcl ? "computed" : "draft";
  setDraft((d: Draft) => ({
    runId, id: run.name, name: run.name, reportingDate: run.reportingDate || d.reportingDate, currency: run.currency, engine: run.engine, phase,
    failureMessage: run.failureMessage, progress: run.progress ?? null,
    files: Object.fromEntries((["pd", "lgd", "ead"] as Dataset[]).map((k) => [k, { ...d.files[k], ...files[k], ...(d.files[k].criteria && files[k]?.status !== "empty" ? { criteria: d.files[k].criteria } : {}) }])) as Draft["files"],
  }));
  return true;
}

/** Browser → storage multipart upload: parts PUT in parallel to presigned URLs, ETags collected, then completed. */
export async function uploadFile(runId: string, k: Dataset, file: File, onProgress: (pct: number) => void): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await startUpload(runId, KIND[k], file.name, file.size);
  if (!plan.ok) return plan;
  const { urls, partSize, key, uploadId } = plan.data;
  const sent = new Array<number>(urls.length).fill(0), parts: { partNumber: number; etag: string }[] = [];
  const put = (i: number) => new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", urls[i]);
    xhr.upload.onprogress = (e) => { sent[i] = e.loaded; onProgress(Math.min(99, Math.round((sent.reduce((a, b) => a + b, 0) / file.size) * 100))); };
    xhr.onload = () => {
      const etag = xhr.getResponseHeader("ETag");
      if (xhr.status >= 200 && xhr.status < 300 && etag) { parts.push({ partNumber: i + 1, etag }); resolve(); }
      else reject(new Error(etag ? `Upload failed (${xhr.status})` : "Storage didn't return an ETag (check the bucket's CORS: ExposeHeaders ETag)."));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and try again."));
    xhr.send(file.slice(i * partSize, Math.min(file.size, (i + 1) * partSize)));
  });
  try {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(PARALLEL, urls.length) }, async () => { while (next < urls.length) { const i = next++; await put(i); } }));
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Upload failed." }; }
  const done = await completeUpload(runId, KIND[k], file.name, key, uploadId, parts);
  onProgress(100);
  return done.ok ? { ok: true } : done;
}

const MAP: Record<string, EngineCriterion["status"]> = { pass: "passed", info: "passed", review: "warning", block: "error" };

/** Engine validation result → the wizard's outcome + criteria list. */
export function toCriteria(result: Record<string, unknown>): { outcome: Outcome; criteria: EngineCriterion[] } {
  const crit = ((result.criteria as { code: string; name: string; outcome: string; rationale: string }[] | undefined) ?? [])
    .map((c) => ({ id: c.code, title: c.name, detail: c.rationale, status: MAP[c.outcome] ?? "passed" }));
  const status = String(result.status ?? "ok");
  return { outcome: status === "blocking" ? "failed" : status === "warn" ? "warnings" : "passed", criteria: crit };
}

/** Queue validation and wait for it (polls; the SSE stream nudges the UI sooner). */
export async function validate(runId: string, k: Dataset, signal?: AbortSignal): Promise<{ ok: true; outcome: Outcome; criteria: EngineCriterion[] } | { ok: false; error: string }> {
  const started = await startValidation(runId, k);
  if (!started.ok) return started;
  for (let i = 0; i < 1200 && !signal?.aborted; i++) {
    await new Promise((r) => setTimeout(r, i < 10 ? 800 : 2000));
    const j = await getValidationJob(runId, started.data.jobId);
    if (!j.ok) return j;
    if (j.data.status === "complete" && j.data.result) return { ok: true, ...toCriteria(j.data.result) };
    if (j.data.status === "error") return { ok: false, error: j.data.error?.detail ?? "Validation failed." };
  }
  return { ok: false, error: "Validation is taking longer than expected. It keeps running; come back to this step later." };
}
