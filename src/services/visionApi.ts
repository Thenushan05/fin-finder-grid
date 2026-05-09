/**
 * Fish Vision / AI Catch Identifier API client.
 * Backend: /api/v1/vision/*
 */

const BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  confidence_pct: number;
  market_code: string | null;
  bbox: BoundingBox;
}

export interface IdentifyResponse {
  model: string;
  image_size: { width: number; height: number };
  inference_ms: number;
  total_detections: number;
  human_in_frame: boolean;
  primary: Detection | null;
  detections: Detection[];
}

export interface ClassInfo {
  id: number;
  name: string;
  market_code: string | null;
}

export interface ClassesResponse {
  total: number;
  classes: ClassInfo[];
}

export const visionApi = {
  /** Upload an image file for fish species identification. */
  async identify(file: File): Promise<IdentifyResponse> {
    const form = new FormData();
    form.append("file", file);

    // Auth header (no Content-Type – browser sets multipart boundary)
    const headers: Record<string, string> = {};
    try {
      const raw = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (raw) headers["Authorization"] = `Bearer ${raw}`;
    } catch { /* ignore */ }

    const res = await fetch(`${BASE}/api/v1/vision/identify`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `Vision API ${res.status}`);
    }
    return res.json();
  },

  /** Get all detectable class names. */
  async classes(): Promise<ClassesResponse> {
    const res = await fetch(`${BASE}/api/v1/vision/classes`);
    if (!res.ok) throw new Error(`Vision classes API ${res.status}`);
    return res.json();
  },
};
