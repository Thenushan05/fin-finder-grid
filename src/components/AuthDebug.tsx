import React, { useState } from "react";
import api from "@/services/api";
import tokenService from "@/services/tokenService";
import { Button } from "@/components/ui/button";

function maskToken(token: string | null) {
  if (!token) return "(none)";
  // show only first 6 and last 6 chars
  const start = token.slice(0, 6);
  const end = token.slice(-6);
  return `${start}…${end}`;
}

function maskEmail(email?: string) {
  if (!email) return "(unknown)";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 1) + "…";
  return `${visible}@${domain}`;
}

export default function AuthDebug() {
  const [verified, setVerified] = useState<null | {
    email?: string;
    id?: string;
    role?: string;
  }>(null);
  const [err, setErr] = useState<string | null>(null);

  const callMe = async () => {
    setErr(null);
    try {
      const res = await api.get("/api/v1/auth/me");
      const data = res.data || {};
      // Only keep minimal, masked info to avoid exposing sensitive values
      setVerified({
        email: maskEmail(data.email),
        id: data.id ? `${String(data.id).slice(0, 6)}…` : undefined,
        role: data.role,
      });
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "Request failed");
      setVerified(null);
    }
  };

  return (
    <div className="p-2 border rounded mb-4 bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          <div>
            Stored access_token:{" "}
            <code>{maskToken(tokenService.getToken())}</code>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={callMe}>
            Verify /me
          </Button>
        </div>
      </div>
      <div className="mt-2 text-xs">
        {verified && (
          <div>
            <div>
              Verified user: <strong>{verified.email}</strong>
            </div>
            <div>
              Id (masked): <code>{verified.id}</code>
            </div>
            <div>
              Role: <code>{verified.role}</code>
            </div>
          </div>
        )}
        {err && <div className="text-destructive">{err}</div>}
      </div>
    </div>
  );
}
