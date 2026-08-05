import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // ISR cache & full-page caches go through the Workers Cache API.
  enableCacheInterception: true,
});
