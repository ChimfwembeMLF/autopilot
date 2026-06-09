/** Turn relative /uploads paths into publicly reachable URLs for social APIs. */
export function resolvePublicMediaUrl(url: string, apiPublicBase?: string): string {
  if (!url?.trim()) return url;

  // Supabase and other CDN URLs are already public
  if (/^https?:\/\//i.test(url)) {
    if (/supabase\.co\/storage\/v1\/object\//.test(url)) return url;
    const base = (apiPublicBase ?? '').replace(/\/$/, '');
    if (base) {
      try {
        const parsed = new URL(url);
        if (parsed.pathname.startsWith('/uploads/')) {
          return `${base}${parsed.pathname}`;
        }
      } catch {
        /* keep original */
      }
    }
    return url;
  }

  const base = (apiPublicBase ?? '').replace(/\/$/, '');
  if (!base) return url;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url.replace(/^\//, '')}`;
}

/** Store relative /uploads paths in DB; keep Supabase/CDN URLs as-is. */
export function canonicalMediaUrl(url: string, apiBase?: string): string {
  if (!url?.trim()) return url;
  if (url.startsWith('/uploads/')) return url;
  if (/^https?:\/\//i.test(url) && /supabase\.co\/storage\//.test(url)) return url;

  const bases = [apiBase, process.env.API_PUBLIC_URL, process.env.API_BASE_URL]
    .filter(Boolean)
    .map((b) => String(b).replace(/\/$/, ''));

  for (const base of bases) {
    if (url.startsWith(`${base}/uploads/`)) {
      return url.slice(base.length);
    }
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch {
    /* keep original */
  }

  return url;
}
