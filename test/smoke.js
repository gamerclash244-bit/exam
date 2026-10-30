// Quick check of the whole API using an in-memory stand-in for MongoDB. Run: npm test
const assert = require("assert");
const createApp = require("../server/app.js");

const col = require("./fakedb.js");

const sent = [];
const fakeFetch = async (url, opts) => {   // pretends to be Google Forms
  if (!opts) return { text: async () => '<input name="entry.111"><textarea name="entry.222"></textarea>' };
  sent.push({ url, body: opts.body.toString() });
  return { status: 200 };
};

(async () => {
  const db = { exams: col(), results: col(), suggestions: col() };
  const server = createApp(db, { fetch: fakeFetch, env: {} }).listen(0);
  const base = "http://localhost:" + server.address().port + "/api";
  const call = async (m, p, b, key) => {
    const r = await fetch(base + p, { method: m, headers: { "Content-Type": "application/json", ...(key ? { "x-manage-key": key } : {}) }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, body: await r.json() };
  };
  const exam = { title: "Unit test", subject: "Physics", mins: 20, showAnswers: true, qs: [
    { t: "mcq", m: 1, q: "Unit of force?", o: ["J", "N", "W", "Pa"], a: "B", e: "newton" },
    { t: "short", m: 2, q: "Newton's second law", a: "Force equals mass times acceleration", k: ["force", "mass", "acceleration"] }] };

  let r = await call("POST", "/exams", { ...exam, title: "" }); assert.strictEqual(r.status, 400);
  r = await call("POST", "/exams", exam); assert.strictEqual(r.status, 200);
  const { id, manageKey } = r.body;

  r = await call("GET", "/exams/" + id); assert.strictEqual(r.status, 200);
  assert.ok(!JSON.stringify(r.body).includes("acceleration"), "student view must not contain answers");
  assert.strictEqual(r.body.qs[0].a, undefined);

  r = await call("POST", `/exams/${id}/submit`, { name: "Anu", answers: ["B", "force mass acceleration"] });
  assert.strictEqual(r.body.got, 3); assert.strictEqual(r.body.total, 3); assert.strictEqual(r.body.review[0].a, "B");
  r = await call("POST", `/exams/${id}/submit`, { name: "Ravi", answers: ["A", "force"] });
  assert.strictEqual(r.body.got, 0.5); // MCQ wrong, 1 of 3 key points = 0.5 of 2 marks

  assert.strictEqual((await call("GET", `/exams/${id}/results`)).status, 403);
  assert.strictEqual((await call("GET", `/exams/${id}/results`, null, "wrong")).status, 403);
  r = await call("GET", `/exams/${id}/results`, null, manageKey);
  assert.strictEqual(r.body.results.length, 2); assert.strictEqual(r.body.results.map(x => x.name).sort().join(), "Anu,Ravi");

  await call("PUT", "/exams/" + id, { ...exam, showAnswers: false }, manageKey);
  r = await call("POST", `/exams/${id}/submit`, { name: "Sita", answers: ["B", ""] });
  assert.strictEqual(r.body.review[0].a, undefined, "answers hidden when the maker turned them off");

  r = await call("POST", "/suggest", { question: "What is 2 + 2?", answer: "4" });
  assert.ok(r.body.forwarded); assert.ok(sent[0].body.includes("entry.111=What+is+2+%2B+2%3F") && sent[0].body.includes("entry.222=4"));
  assert.strictEqual((await call("POST", "/suggest", { question: "x" })).status, 400);

  assert.strictEqual((await call("DELETE", "/exams/" + id, null, "wrong")).status, 403);
  await call("DELETE", "/exams/" + id, null, manageKey);
  assert.strictEqual((await call("GET", "/exams/" + id)).status, 404);
  console.log("All API checks passed.");
  server.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
