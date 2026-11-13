// Runs the nightly job (sources → profiles → matching) against the local app.
// Usage: npm run nightly:local   (the app must be running: npm run dev:local)
const base = process.env.APP_URL ?? 'http://localhost:8080';
const url = new URL('/api/public/nightly-run', base);

let res;
try {
  res = await fetch(url, { method: 'POST' });
} catch {
  console.error(`Could not reach the app at ${base}. Start it first with: npm run dev:local`);
  process.exit(1);
}
if (!res.ok || !res.body) {
  console.error(`Nightly run failed to start: HTTP ${res.status}`);
  process.exit(1);
}

const decoder = new TextDecoder();
let buffer = '';
let failed = false;
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    const event = JSON.parse(line);
    if (event.type === 'error') { failed = true; console.error(`Error: ${event.message}`); }
    else if (event.message) console.log(event.message);
    else console.log(JSON.stringify(event));
  }
}
console.log(failed ? 'Nightly run finished with errors.' : 'Nightly run finished.');
process.exit(failed ? 1 : 0);
