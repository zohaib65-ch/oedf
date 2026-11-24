"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { formatDateTime } from "@/lib/format";

const SESSIONS_KEY = ["auth", "sessions"] as const;

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

export function SessionsList() {
  const queryClient = useQueryClient();
  const current = authClient.useSession();
  const sessions = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) {
        throw new Error("Could not load sessions");
      }
      return data;
    },
  });
  const revoke = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        throw new Error("Could not sign the device out");
      }
    },
    onSuccess: async () => {
      toast.success("That device was signed out.");
      await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: () => {
      toast.error("We could not sign that device out. Please try again.");
    },
  });
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
        {sessions.isPending ? <Skeleton className="h-20 w-full" /> : null}
        {sessions.isError ? (
          <p role="alert" className="text-destructive">
            We could not load your sessions.
          </p>
        ) : null}
        <ul className="divide-y">
          {sessions.data?.map((session) => (
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
                  disabled={revoke.isPending}
                  onClick={() => {
                    revoke.mutate(session.token);
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
