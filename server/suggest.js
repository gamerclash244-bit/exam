// Suggest: sends a suggested question into your Google Form.
// The form's field ids are read from the form itself the first time, then remembered.
const DEFAULT_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSfVFo9U9g5YgsJyEdT1i8Ya_kg_jRUBU8l3sutFyrBjlCC-0g/viewform";

module.exports = function makeSuggest(env, fetchFn) {
  const base = (env.GOOGLE_FORM_URL || DEFAULT_FORM).split("?")[0].replace(/\/(viewform|formResponse)$/, "");
  let cache = null;

  async function fieldIds() {
    if (env.ENTRY_QUESTION && env.ENTRY_ANSWER) return [env.ENTRY_QUESTION, env.ENTRY_ANSWER];
    if (cache) return cache;
    const html = await (await fetchFn(base + "/viewform")).text();
    let ids = [...new Set([...html.matchAll(/name="entry\.(\d+)"/g)].map(m => m[1]))];
    if (ids.length < 2) ids = [...new Set([...html.matchAll(/entry\.(\d{6,})/g)].map(m => m[1]))];
    if (ids.length < 2) throw new Error("Could not find the form fields");
    return (cache = ids.slice(0, 2));
  }

  // returns true if Google accepted it
  return async function send(question, answer) {
    try {
      const [qid, aid] = await fieldIds();
      const body = new URLSearchParams({ ["entry." + qid]: question, ["entry." + aid]: answer, fvv: "1", pageHistory: "0" });
      const r = await fetchFn(base + "/formResponse", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, redirect: "manual"
      });
      return r.status < 400;
    } catch (e) { cache = null; return false; }
  };
};
