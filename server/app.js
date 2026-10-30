// App: all the API routes. Answers never leave the server until a student has submitted.
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const rateLimit = require("express-rate-limit");
const Exam = require("../public/js/exam.js"); // the same marking code the browser uses
const makeSuggest = require("./suggest.js");

const newId = () => crypto.randomBytes(5).toString("base64url");
const newKey = () => crypto.randomBytes(16).toString("base64url");
const hash = k => crypto.createHash("sha256").update(String(k || "")).digest("hex");
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
const str = (v, n) => String(v == null ? "" : v).slice(0, n);

// Checks and trims an exam sent by a browser
function clean(b) {
  if (!b || typeof b !== "object") throw bad("Invalid exam.");
  const title = str(b.title, 120).trim();
  if (!title) throw bad("Give the exam a title.");
  if (!Array.isArray(b.qs) || !b.qs.length || b.qs.length > 200) throw bad("An exam needs 1 to 200 questions.");
  const qs = b.qs.map((q, i) => {
    const t = q && q.t === "mcq" ? "mcq" : "short", n = i + 1;
    const o = t === "mcq" ? [0, 1, 2, 3].map(j => str(q.o && q.o[j], 300).trim()) : [];
    const out = {
      t, m: Math.max(1, Math.min(100, +q.m || 1)), q: str(q.q, 2000).trim(), o, a: str(q.a, 2000).trim(),
      k: (Array.isArray(q.k) ? q.k : []).slice(0, 20).map(x => str(x, 100).trim()).filter(Boolean), e: str(q.e, 1000).trim()
    };
    if (!out.q) throw bad(`Question ${n} has no text.`);
    if (t === "mcq") {
      if (o.filter(Boolean).length < 2) throw bad(`Question ${n} needs at least two options.`);
      if (!/^[A-D]$/.test(out.a) || !o["ABCD".indexOf(out.a)]) throw bad(`Choose the correct option for question ${n}.`);
    } else if (!out.a && !out.k.length) throw bad(`Question ${n} needs a model answer or key points.`);
    return out;
  });
  return { title, subject: str(b.subject, 60).trim() || "General", mins: Math.max(0, Math.min(300, +b.mins || 0)), showAnswers: b.showAnswers !== false, qs };
}

module.exports = function createApp(db, opts = {}) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "400kb" }));
  app.use((req, res, next) => { res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" }); next(); });
  app.use("/api", rateLimit({ windowMs: 60000, limit: 120, standardHeaders: true, legacyHeaders: false }));
  const slow = rateLimit({ windowMs: 3600000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Try again later." } });
  const suggest = makeSuggest(opts.env || process.env, opts.fetch || fetch);
  const wrap = fn => (req, res, next) => fn(req, res).catch(next);
  const owner = async (req, res) => {
    const ex = await db.exams.findOne({ _id: req.params.id });
    if (!ex) throw bad("Exam not found.", 404);
    const given = Buffer.from(hash(req.get("x-manage-key"))), real = Buffer.from(ex.keyHash);
    if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) throw bad("Wrong results key.", 403);
    return ex;
  };

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // create
  app.post("/api/exams", slow, wrap(async (req, res) => {
    const exam = clean(req.body), id = newId(), key = newKey();
    await db.exams.insertOne({ _id: id, ...exam, keyHash: hash(key), created: new Date() });
    res.json({ id, manageKey: key });
  }));
  // update (maker only)
  app.put("/api/exams/:id", wrap(async (req, res) => {
    await owner(req, res);
    await db.exams.updateOne({ _id: req.params.id }, { $set: clean(req.body) });
    res.json({ ok: true });
  }));
  // what a student sees: no answers
  app.get("/api/exams/:id", wrap(async (req, res) => {
    const ex = await db.exams.findOne({ _id: req.params.id });
    if (!ex) throw bad("This exam was not found. Check the link.", 404);
    res.json({ id: ex._id, title: ex.title, subject: ex.subject, mins: ex.mins, showAnswers: ex.showAnswers,
      qs: ex.qs.map(q => ({ t: q.t, m: q.m, q: q.q, o: q.o, s: ex.subject })) });
  }));
  // a student submits: marked here, saved for the maker
  app.post("/api/exams/:id/submit", slow, wrap(async (req, res) => {
    const ex = await db.exams.findOne({ _id: req.params.id });
    if (!ex) throw bad("This exam was not found.", 404);
    const name = str(req.body.name, 80).trim();
    if (!name) throw bad("Enter your name.");
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const graded = ex.qs.map((q, i) => Exam.grade(q, str(answers[i], 5000).trim()));
    const got = graded.reduce((t, g) => t + g.got, 0), total = ex.qs.reduce((t, q) => t + q.m, 0);
    await db.results.insertOne({ _id: newId() + newId(), examId: ex._id, name, got, total, n: ex.qs.length,
      answers: ex.qs.map((q, i) => str(answers[i], 5000)), marks: graded.map(g => g.got), date: new Date() });
    const review = ex.qs.map((q, i) => {
      const g = graded[i], r = { got: g.got, max: q.m, ok: g.ok };
      if (ex.showAnswers) Object.assign(r, { a: q.a, e: q.e, hit: g.hit, miss: g.miss, manual: g.manual });
      return r;
    });
    res.json({ got, total, n: ex.qs.length, review });
  }));
  // the maker's scoreboard
  app.get("/api/exams/:id/results", wrap(async (req, res) => {
    const ex = await owner(req, res);
    const list = await db.results.find({ examId: ex._id }).sort({ date: -1 }).limit(2000).toArray();
    res.json({ exam: { id: ex._id, title: ex.title, subject: ex.subject, mins: ex.mins, qs: ex.qs },
      results: list.map(r => ({ id: r._id, name: r.name, got: r.got, total: r.total, date: r.date, answers: r.answers, marks: r.marks })) });
  }));
  app.delete("/api/exams/:id", wrap(async (req, res) => {
    const ex = await owner(req, res);
    await db.results.deleteMany({ examId: ex._id });
    await db.exams.deleteOne({ _id: ex._id });
    res.json({ ok: true });
  }));
  // "Suggest a question" form: saved in MongoDB and sent into your Google Form
  app.post("/api/suggest", slow, wrap(async (req, res) => {
    const question = str(req.body.question, 1000).trim(), answer = str(req.body.answer, 1000).trim();
    if (!question || !answer) throw bad("Fill in both the question and the answer.");
    const forwarded = await suggest(question, answer);
    await db.suggestions.insertOne({ _id: newId() + newId(), question, answer, forwarded, date: new Date() });
    res.json({ ok: true, forwarded });
  }));

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use((err, req, res, next) => {
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
  });
  return app;
};
