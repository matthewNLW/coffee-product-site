export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  // 1. Block Sensitive File Extensions
  const blockedExtensions = [".php", ".env", ".git", ".sql", ".bak", ".config"];
  if (blockedExtensions.some(ext => path.endsWith(ext))) {
    return new Response("Access Denied", { status: 403 });
  }

  // 2. Block Aggressive Bots
  const blockedBots = [
    "semrushbot",
    "ahrefsbot",
    "dotbot",
    "mj12bot",
    "petalbot",
    "bytespider",
    "liebaofast"
  ];
  
  if (blockedBots.some(bot => userAgent.includes(bot))) {
    return new Response("Access Denied", { status: 403 });
  }

  // 3. Allow otherwise
  return context.next();
};
