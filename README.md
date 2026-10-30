# Plus One Exams

Make an exam, share a link, and every student's **score arrives on your private results page**. Built with Node.js and MongoDB. Includes Practice mode, symbol keypad for written answers, questions from photos or text, and a "Suggest a question" form that sends into your Google Form.

## Folder map

```
plus-one-exams/
├── package.json         Dependencies and start commands
├── .env.example         Settings template (copy to .env)
├── README.md            This file
├── server/
│   ├── index.js         Starts the server
│   ├── app.js           API: create exam, take exam, scores, suggest
│   ├── db.js            MongoDB connection
│   └── suggest.js       Sends suggestions into your Google Form
├── public/              The website
│   ├── index.html
│   ├── css/style.css    Black and gray theme
│   ├── data/            config.js (subjects), questions.js (practice bank)
│   └── js/
│       ├── app.js       Menu, practice, exam runner, suggest form
│       ├── creator.js   Create and publish exams
│       ├── owner.js     The maker's scoreboard
│       ├── api.js       Calls to the server
│       ├── exam.js      Marking (used by browser and server)
│       ├── store.js     Practice bank and saved drafts on the device
│       ├── symbols.js   Symbol keypad and typing shortcuts
│       ├── import.js    Photo and text to questions
│       └── main.js      Opens the right page from the link
└── test/                npm test (checks the whole API without a real database)
```

## How scores reach the exam maker

1. The maker builds an exam and presses **Publish**. The server saves it in MongoDB and gives two links:
   - **Student link** (`…#e=…`): share this.
   - **Results link** (`…#m=…`): private. It opens the scoreboard.
2. A student opens the student link and takes the exam. The server **marks it** and saves the submission. The student never receives the answers until they submit, and only if the maker allows it.
3. The maker opens the results link (or presses **Scores** in Create exam) and sees every student's score, the average, each student's answers and marks, and a **Download CSV** button.

No logins. The results link is the key, so keep it private. The browser that published the exam remembers it under Create exam, and you can bookmark the results link for other devices.

## Is 256 MB enough?

Yes. Only text is stored. Photos are read in the browser and never saved.

- An exam of 30 questions is about 10 to 15 KB.
- One student submission (name, answers, marks) is about 1 to 4 KB.
- 256 MB holds roughly **60,000 or more submissions**. That is 100 exams with 600 students each.

MongoDB Atlas's free M0 tier gives 512 MB, so you have even more room if you use it. When storage fills, writes fail, so delete old exams from their scoreboard now and then.

## Set up

### 1. Database (MongoDB Atlas)
1. Create a free cluster at cloud.mongodb.com.
2. **Database Access:** create a user with a password.
3. **Network Access:** add `0.0.0.0/0` (hosting services change address).
4. **Connect → Drivers:** copy the connection string.

### 2. Run it on your computer
```
npm install
cp .env.example .env      # then edit .env and paste your MONGODB_URI
npm run dev
```
Open http://localhost:3000. Run `npm test` any time to check the API.

### 3. Put it online (so students can open links)
Any Node host works. On **Render** (free plan available): New → Web Service → connect your GitHub repo → Build `npm install` → Start `npm start` → add the settings from `.env.example` as Environment Variables. Share the address Render gives you. Free plans may sleep when idle, so the first visit can take about 30 seconds.

## Suggest a question → your Google Form

The **Suggest a question** page is a normal form inside the website (Question and Answer). When a student sends it, the server submits it into your Google Form, and also keeps a copy in MongoDB. The form link is only in the server settings, never on the page.

The server finds the form's field ids by reading the form, so nothing else is needed. If a suggestion saves but does not appear in the form's responses, the ids were not detected. Then:
1. Open your Google Form → three dots → **Get pre-filled link**.
2. Type `test1` in Question and `test2` in answer, press **Get link**, and copy it.
3. The link contains `entry.123456789=test1` and `entry.987654321=test2`. Put those numbers in `ENTRY_QUESTION` and `ENTRY_ANSWER` in your server settings.

Your form is called "Untitled form" with fields "Question?" and "answer". Keep those two as short-answer fields.

To use suggestions as Practice questions, add an **Approved** column in the form's sheet, mark accepted rows `yes`, publish the sheet as CSV and put the link in `sheetCsvUrl` in `public/data/config.js`.

## Questions from a photo, text or CSV

In the exam creator choose **+ From photo or text**. Photos are read in the browser (Tesseract.js, loaded from the internet the first time) and the text is shown so you can fix mistakes before adding. Layout for pasted text:

```
1. Which is the SI unit of force? [1]
A) Joule
B) Newton
C) Watt
D) Pascal
Answer: B
2. State Newton's second law. [2]
Answer: Force equals rate of change of momentum, F = ma
```

CSV columns: `Subject, Chapter, Type, Marks, Question, Option A, Option B, Option C, Option D, Answer, Key points, Explanation`. Only Question and Answer are required. Always check correct answers after an import.

## Symbols in written answers

Every written answer box has a **Σ Symbols** button (Math, Greek, Powers, Physics, Chemistry, Arrows, Other). Typing shortcuts: `x^2` → `x²`, `^-1` → `⁻¹`, `<=` → `≤`, `>=` → `≥`, `!=` → `≠`, `->` → `→`, `+-` → `±`.

## How marking works

- **MCQ:** full marks or zero.
- **Written:** by key points. If you leave key points empty, the main words of your model answer are used. For equations add key points such as `sin²θ+cos²θ|=1`. This is an estimate, so a teacher's marking may differ.

## Honest limits

- **Tested with a stand-in database.** The API and the website were tested end to end with an in-memory replacement for MongoDB, not a live Atlas cluster. Google Form sending was tested with a simulated form. Check both with one real exam and one real suggestion after you deploy.
- **No student logins.** A student can type any name and can submit more than once. If this matters, add logins later.
- **Anyone with the results link sees the scores.** Treat it like a password.
- **Written answers are auto-marked by keywords.** Review long answers yourself.
- **The server must be running** for exams, scores and suggestions. Practice works without it.
