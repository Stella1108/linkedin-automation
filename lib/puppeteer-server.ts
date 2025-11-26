// lib/puppeteer-server.ts
'use server'; // This ensures it only runs on the server

export async function createLinkedInAutomation() {
  // Dynamic import inside a server context
  const { LinkedInAutomation } = await import('./puppeteer');
  const automation = new LinkedInAutomation();
  await automation.init();
  return automation;
}