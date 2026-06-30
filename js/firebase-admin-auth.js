/* ============================================================
   Firebase admin auth helpers
   Requires firebase-app-compat.js, firebase-auth-compat.js, and
   firebase-config.js to be loaded first (see admin.html / admin-login.html).
   ============================================================ */

function adminLogin(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

function adminLogout() {
  return firebase.auth().signOut();
}

// callback receives the Firebase user object, or null if signed out
function onAdminAuthChange(callback) {
  return firebase.auth().onAuthStateChanged(callback);
}

function friendlyAuthError(err) {
  const map = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No admin account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a bit and try again.',
    'auth/network-request-failed': 'Network error - check your connection.'
  };
  return map[err.code] || (err.message || 'Something went wrong. Please try again.');
}
