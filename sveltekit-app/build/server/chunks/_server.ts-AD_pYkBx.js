import { error, json } from '@sveltejs/kit';
import { c as getUserProfile } from './sheets-CqdHlK4w.js';

const GET = async ({ url }) => {
  const email = url.searchParams.get("email") ?? "";
  if (!email) throw error(400, "email parameter is required");
  try {
    const profile = await getUserProfile(email);
    if (!profile) throw error(404, "User not found");
    return json(profile);
  } catch (err) {
    if (err.status) throw err;
    throw error(502, err instanceof Error ? err.message : "Failed to fetch user profile");
  }
};

export { GET };
//# sourceMappingURL=_server.ts-AD_pYkBx.js.map
