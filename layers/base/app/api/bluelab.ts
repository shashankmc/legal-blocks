// The BlueLab legal-compliance service.
//
// Reached through the platform's own proxy route (`/api/services/bluelab/...`),
// so the browser never holds the service URL and a module names an operation,
// never a URL. The service runs as its own container
// (docs/legal-blocks-integration.md in the BlueLab repo).

import type { CaseSummary, CaseV1 } from "vue-legal-case-builder";
import type { MethodOption, RankedProvisionsV1 } from "vue-legal-provision-retriever";
import type { CorpusDoc, FullDocument } from "vue-legal-document-manager";
import { json } from "./http";

interface CallOptions {
  method?: "GET" | "POST";
  query?: Record<string, string>;
  body?: unknown;
  /** Forwarded as X-BlueLab-Role; the service gates ground truth on `admin`. */
  role?: string;
}

async function call<T>(operation: string, options: CallOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const qs = options.query ? `?${new URLSearchParams(options.query).toString()}` : "";
  const headers: Record<string, string> = {};
  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (options.role) headers["X-BlueLab-Role"] = options.role;
  const res = await fetch(`/api/services/bluelab/${operation}${qs}`, {
    method,
    headers,
    ...(method !== "GET" && options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  return json<T>(res, `the bluelab service (${operation})`);
}

export const listCases = () => call<CaseSummary[]>("cases");

export const loadCase = (caseId: string) => call<CaseV1>("case", { query: { id: caseId } });

export const listMethods = () => call<MethodOption[]>("methods");

export const searchProvisions = (args: { query: string; method: string; case_id?: string }) =>
  call<RankedProvisionsV1>("search", { method: "POST", body: args });

export const listCorpus = () => call<CorpusDoc[]>("corpus");

export const loadDocument = (docId: string) =>
  call<FullDocument>("document", { query: { doc_id: docId } });

export const loadMarkdown = (docId: string) =>
  call<{ doc_id: string; markdown: string }>("markdown", { query: { doc_id: docId } });

/** Persists a selection + provenance. The body is the service's session shape. */
export const saveSelection = (payload: unknown) =>
  call<{ status: string; path: string | null; selected_count: number }>("selection/save", {
    method: "POST",
    body: payload,
  });

export const groundTruth = (caseId: string, role = "admin") =>
  call<{ relevant_doc_ids: string[] }>("ground-truth", {
    query: { case_id: caseId },
    role,
  });
