// Start the server: connect to MongoDB, then serve the app and the API.
const connect = require("./db.js");
const createApp = require("./app.js");

if (!process.env.MONGODB_URI) { console.error("MONGODB_URI is not set. See README.md."); process.exit(1); }
connect(process.env.MONGODB_URI, process.env.DB_NAME).then(db => {
  const port = process.env.PORT || 3000;
  createApp(db).listen(port, () => console.log("Plus One Exams running on port " + port));
}).catch(e => { console.error("Could not connect to MongoDB:", e.message); process.exit(1); });
