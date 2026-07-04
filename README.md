# Yoga Webinar Landing Page Template

Responsive webinar landing page for yoga classes, built with HTML, Bootstrap 5, CSS, vanilla JavaScript, Firebase JS SDK v9+ modular imports, and no build tools.

## Folder Structure

```text
Yoga-Webinar-Template/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js
│   │   ├── api.js
│   │   └── firebase.js
│   ├── images/
│   └── videos/
└── README.md
```

## What It Includes

- Dynamic webinar banner from `banner-list`
- Responsive YouTube intro video embeds from `video-list`
- Active yoga class cards from `class-list`
- Register buttons that pre-select the class in the form
- Active testimonials from `testimonial-list`
- Loading, empty, and retry error states for all API sections
- Real-time form validation for name, phone, email, and class selection
- Firestore write to a `registrations` collection

## Firebase Setup

Open `assets/js/firebase.js` and replace the empty strings in `firebaseConfig` with your Firebase web app config.

```js
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
```

The form writes this document shape to Firestore:

```json
{
  "Name": "Participant Name",
  "Phone": "9876543210",
  "Email": "participant@example.com",
  "Class_ID": "3"
}
```

Create or allow writes to a Firestore collection named `registrations`. During development, configure Firestore security rules according to your testing needs. Before production, use rules that protect your database from unwanted writes.

## Running Locally

You can open `index.html` directly in a browser for a quick layout check. For YouTube embeds, use a local server so the iframe has a normal localhost origin/referrer.

Options:

- Quick layout check: double-click `index.html`.
- VS Code Live Server extension: right-click `index.html` and choose `Open with Live Server`.
- Python local server:

```bash
cd Yoga-Webinar-Template
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Deploying To GitHub Pages

After creating a GitHub repository, push this project:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Yoga-Webinar-Template.git
git push -u origin main
```

Then enable GitHub Pages:

1. Open the repository on GitHub.
2. Go to `Settings` → `Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Choose branch `main` and folder `/root`.
5. Save.

Your deployed link will look like:

```text
https://YOUR_USERNAME.github.io/Yoga-Webinar-Template/
```

## API Files

- `assets/js/api.js` contains all backend fetch calls.
- `assets/js/script.js` renders the DOM, handles events, validates the form, and calls Firebase.
- `assets/js/firebase.js` initializes Firebase and exports `saveRegistration()`.

No fallback or mock data is hardcoded. If an API call fails or returns no active records, the page shows a real empty or error state.
