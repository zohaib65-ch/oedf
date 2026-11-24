"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { formatDateTime } from "@/lib/format";

/** Where a session was opened from, in words: the user agent is long and unreadable as it is. */
function describeDevice(userAgent: string | null | undefined): string {
  if (!userAgent) {
    return "Unknown device";
  }
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "";
  return system ? `${browser} on ${system}` : browser;
}

interface SessionItem {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

export function SessionsList() {
  const current = authClient.useSession();
  const [sessions, setSessions] = useState<SessionItem[] | undefined>();
  const [hasFailed, setHasFailed] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await authClient.listSessions();
      setHasFailed(Boolean(error));
      setSessions((data as SessionItem[] | null) ?? undefined);
    } catch {
      // The request itself failed (offline, for example), not just the answer.
      setHasFailed(true);
    }
  }, []);

  useEffect(() => {
    // Loading from the server on first render is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const revoke = async (token: string) => {
    setIsRevoking(true);
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        throw new Error("Revoking the session failed");
      }
      toast.success("That device was signed out.");
      await load();
    } catch {
      toast.error("We could not sign that device out. Please try again.");
    } finally {
      setIsRevoking(false);
    }
  };
  const currentToken = current.data?.session.token;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Where you are signed in. Sign out any device you do not recognise.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions === undefined && !hasFailed ? <Skeleton className="h-20 w-full" /> : null}
        {hasFailed ? (
          <p role="alert" className="text-destructive">
            We could not load your sessions.
          </p>
        ) : null}
        <ul className="divide-y">
          {sessions?.map((session) => (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {describeDevice(session.userAgent)}
                  {session.token === currentToken ? (
                    <Badge variant="secondary" className="ml-2">
                      This device
                    </Badge>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.ipAddress ?? "Unknown address"}, signed in{" "}
                  {formatDateTime(new Date(session.createdAt).toISOString())}
                </p>
              </div>
              {session.token === currentToken ? null : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRevoking}
                  onClick={() => {
                    void revoke(session.token);
                  }}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
