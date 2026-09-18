import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** site_settings is public, RLS-readable with no auth required, so this uses
 * a plain anon-key client (no cookies()) - that's what lets it live inside
 * unstable_cache, since Dynamic APIs can't be used there. Cached because this
 * is read from the root layout's generateMetadata on every single request;
 * see updateSiteBranding in dashboard/settings/actions.ts for invalidation. */
export const getCachedFaviconUrl = unstable_cache(
  async () => {
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from("site_settings")
      .select("favicon_url")
      .eq("id", true)
      .maybeSingle();
    return data?.favicon_url ?? null;
  },
  ["site-settings-favicon"],
  { tags: ["site-settings"], revalidate: 3600 },
);
