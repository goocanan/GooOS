export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const url = process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (url) {
      const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
      console.log(`[GooOS KeepAlive] Registered keep-alive for: ${cleanUrl}`);

      // Ping every 12 minutes (720,000 ms) so Render free instance doesn't spin down
      setInterval(async () => {
        try {
          const res = await fetch(`${cleanUrl.replace(/\/$/, "")}/api/health`);
          if (res.ok) {
            console.log(`[GooOS KeepAlive] Self-ping successful at ${new Date().toISOString()}`);
          }
        } catch (err: any) {
          console.warn(`[GooOS KeepAlive] Ping error: ${err.message}`);
        }
      }, 12 * 60 * 1000);
    }
  }
}
