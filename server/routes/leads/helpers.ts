// Helper to check if URL is a generic directory or social profile instead of official venue site
export function isBadDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const badDomains = ['salasdeconciertos.com', 'tripadvisor', 'facebook.com', 'instagram.com', 'yelp.', 'google.com', 'foursquare.com', 'residentadvisor.net', 'twitter.com', 'x.com', 'tiktok.com', 'guiadelocio.com'];
  const lower = url.toLowerCase();
  return badDomains.some(d => lower.includes(d));
}

// Helper to extract domain from website URL
export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}
