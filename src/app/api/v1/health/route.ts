import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { checkHealth } from "@/server/services/health.service";

export const GET = withApiHandler(async () => ok(await checkHealth()));
