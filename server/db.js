// Database: connects to MongoDB and returns the three collections the app uses.
const { MongoClient } = require("mongodb");

module.exports = async function connect(uri, name) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(name || "plusone");
  const exams = db.collection("exams");              // one document per exam (questions and answers)
  const results = db.collection("results");          // one document per student submission
  const suggestions = db.collection("suggestions");  // backup copy of suggested questions
  await results.createIndex({ examId: 1, date: -1 });
  return { exams, results, suggestions, close: () => client.close() };
};
