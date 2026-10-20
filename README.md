# Surkhab Hikes - Demo 07

Separate personal COMP1800 Firestore demo. This project does not change the DTC14 team app.

Course instructions: [Demo 07](https://bcit-cst.notion.site/Demo-07-Firebase-Firestore-Database-202630-3196dfaf038a80b98f15ddcf52d6bb76).
Starter: [COMP1800Hoda/myhike_readyForDemo07](https://github.com/COMP1800Hoda/myhike_readyForDemo07).

## Run

1. Install dependencies with `npm ci`.
2. Copy `.env_template` to `.env` and fill in the four Firebase web configuration values for your own project. Keep `.env` out of Git.
3. Enable Email/Password Authentication and create a Standard Cloud Firestore database.
4. In the Firebase console, create `quotes/monday` and `quotes/tuesday`, each with a string field named `quote`. Add the other days when needed.
5. Run `npm run dev -- --port 5174`. Open the local link, sign up, and log in.
6. Run `npm run build` to build all pages, including the dashboard and hike details.

## Firestore demo requirements

- `src/firebaseConfig.js` exports Authentication and Firestore instances from the same Firebase app.
- `src/main.js` listens to today's quote with `onSnapshot`. The weekday is computed automatically.
- Signup writes `users/{uid}` with name, email, country and school. The dashboard reads that profile's name, with an Authentication fallback.
- An empty `hikes` collection is seeded with three sample hikes using an awaited batch and stable IDs. An existing collection is left alone.
- The dashboard clones an HTML template into a responsive card grid. Images are served from `public/images`.
- Each Read More link includes a Firestore `docID`. `eachHike.html` reads that document and displays its name, image and description.
- Missing or invalid IDs, missing documents, and read failures show messages. Signed-out visitors are sent to login.

## Database rules

`firestore.rules` mirrors the teacher-requested public test mode approved for this course demo. Its access expires at **2026-11-19 UTC**. The course-end date was not supplied; adjust the expiry to the actual date only if required by the instructor.

`firestore.restricted.rules` is an alternative for after the exercise: signed-in users can read quotes and hikes, create hikes, and access only their own profile. It is not deployed. Do not store sensitive information while public test mode is active.

## Hand-in evidence

The hand-in template requests three annotated screen captures:

1. Firebase project name; `quotes`, `users`, `hikes`; and the signed-up user's profile name.
2. `main.html` URL, app name, personal greeting, Firestore quote and three-card grid.
3. `eachHike.html?docID=...` URL and the selected hike's name and image.

Evidence is kept separately from the public code repository so profile information is not committed here.

## Verification

- Production build passed for all five HTML entry points.
- Real Firestore SDK reads confirmed both quote documents, one user profile, and the three expected hike records in the separate demo project.
- Signed-in dashboard greeting, live quote and three-card grid verified in the browser.
- Editing Tuesday's quote in the Firebase console updated the dashboard without a reload.
- All three Read More links opened the matching document ID, hike name and image; Back returned to the dashboard.
- Missing IDs and nonexistent documents showed the expected messages.
- All three required screen captures are annotated in the separate personal hand-in.

## Learning references

- [Firestore real-time listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)

Starter code is provided by the BCIT COMP1800 course. Demo implementation was prepared with Codex assistance; review the code and practise the flow before demonstrating it.
