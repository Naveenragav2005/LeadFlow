import type {
  Discussion,
  DiscussionCreated,
  Lead,
  LeadFilters,
  LeadPatch,
  NewDiscussion,
  NewLead,
} from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ValidationIssue = { loc?: (string | number)[]; msg?: string };

/** Turn FastAPI's `{"detail": ...}` error body into a readable message. */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { detail?: string | ValidationIssue[] };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail
        .map(({ loc, msg }) => {
          const field = loc?.[loc.length - 1];
          return field && field !== "body" ? `${field}: ${msg}` : (msg ?? "Invalid value");
        })
        .join("; ");
    }
  } catch {
    // Not JSON; use the fallback below.
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Can't reach the LeadFlow API. Is the backend running?");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export const api = {
  listLeads(filters: LeadFilters, signal?: AbortSignal): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    const query = params.size ? `?${params}` : "";
    return request(`/api/leads${query}`, { signal });
  },

  createLead(input: NewLead): Promise<Lead> {
    return request("/api/leads", { method: "POST", body: JSON.stringify(input) });
  },

  updateLead(id: number, patch: LeadPatch): Promise<Lead> {
    return request(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  },

  listDiscussions(leadId: number, signal?: AbortSignal): Promise<Discussion[]> {
    return request(`/api/leads/${leadId}/discussions`, { signal });
  },

  addDiscussion(leadId: number, input: NewDiscussion): Promise<DiscussionCreated> {
    return request(`/api/leads/${leadId}/discussions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
