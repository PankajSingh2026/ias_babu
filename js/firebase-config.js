/* ============================================================
   Firebase project configuration
   ============================================================
   1. Go to https://console.firebase.google.com and create a (free) project.
   2. In the project, go to Build > Authentication > Sign-in method,
      and enable the "Email/Password" provider.
   3. Still in Authentication, go to the "Users" tab and click "Add user" -
      this is how you create your admin login(s). Anyone you add here can
      log in to /admin.html. There is no public admin signup form on purpose.
   4. Go to Project settings (gear icon) > General > "Your apps" > add a
      Web app (</> icon). Firebase will show you a firebaseConfig object -
      copy its values into the object below.
   5. (Recommended) In Authentication > Settings > Authorized domains, add
      your GitHub Pages domain (e.g. yourusername.github.io) and/or your
      custom domain, so login only works from your real site.
   ============================================================ */

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
