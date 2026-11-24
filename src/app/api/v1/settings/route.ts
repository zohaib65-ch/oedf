import { updateSettingsSchema } from "@/lib/validations/settings";
import { requireApiPermission } from "@/server/auth/api-session";
import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";
import { getSiteSettings, updateSiteSettings } from "@/server/services/settings.service";

export const GET = withApiHandler(async (request) => {
  await requireApiPermission(request, "settings:read");
  return ok(await getSiteSettings());
});

export const PATCH = withApiHandler(async (request) => {
  const staff = await requireApiPermission(request, "settings:manage");
  const input = await readJson(request, updateSettingsSchema);
  return ok(await updateSiteSettings(staff, input));
});
