// An in-memory stand-in for the few MongoDB calls the app uses (for tests only).
function match(d, q) { return Object.keys(q).every(k => d[k] === q[k]); }
function col() {
  const docs = new Map();
  return {
    insertOne: async d => { docs.set(d._id, { ...d }); },
    findOne: async q => { for (const d of docs.values()) if (match(d, q)) return { ...d }; return null; },
    updateOne: async (q, u) => { for (const d of docs.values()) if (match(d, q)) Object.assign(d, u.$set); },
    deleteOne: async q => { for (const [k, d] of docs) if (match(d, q)) docs.delete(k); },
    deleteMany: async q => { for (const [k, d] of docs) if (match(d, q)) docs.delete(k); },
    find: q => { const a = [...docs.values()].filter(d => match(d, q)); const c = { sort: () => (a.sort((x, y) => y.date - x.date), c), limit: () => c, toArray: async () => a }; return c; }
  };
}

module.exports = col;
