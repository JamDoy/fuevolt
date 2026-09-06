// Posts a text update to the FueVolt Facebook Page via the Graph API.
// Requires a Page (not user) access token with pages_manage_posts — see
// social-poster/README.md for how to generate one.
export async function postToFacebook(message) {
  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) {
    throw new Error('FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN must be set');
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Facebook post failed: ${data?.error?.message || res.status}`);
  }
  return data; // { id: "<page-id>_<post-id>" }
}
