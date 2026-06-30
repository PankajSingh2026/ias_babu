/* ============================================================
   Notifications data layer - Firestore (shared across all visitors)
   ============================================================
   Requires firebase-app-compat.js, firebase-auth-compat.js,
   firebase-firestore-compat.js, and js/firebase-config.js to be
   loaded first.

   One-time setup in the Firebase console:
   1. Build -> Firestore Database -> Create database -> Start in
      "production mode" -> pick a location close to your users.
   2. Go to the "Rules" tab and paste in the rules from
      firestore.rules (included alongside this file), then Publish.
      These rules let ANYONE read notifications (so visitors see them),
      but only a signed-in admin (someone who passed Firebase Auth
      login) can add/edit/delete one.
   ============================================================ */

const db = firebase.firestore();
const notificationsCol = db.collection('notifications');

// Fetch all published notifications for a category, ordered for display.
// Returns a Promise<Array>.
function fetchNotifications(category) {
  return notificationsCol
    .where('category', '==', category)
    .orderBy('createdAt', 'desc')
    .get()
    .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
}

// Fetch every notification across all categories (used by the admin table).
function fetchAllNotifications() {
  return notificationsCol
    .orderBy('createdAt', 'desc')
    .get()
    .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
}

// Live-updating subscription - calls callback(array) immediately and again
// whenever the data changes anywhere (any admin, any browser).
function subscribeNotifications(category, callback) {
  return notificationsCol
    .where('category', '==', category)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => {
      console.error('Notifications subscription error:', err);
      callback([]);
    });
}

function subscribeAllNotifications(callback) {
  return notificationsCol
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => {
      console.error('Notifications subscription error:', err);
      callback([]);
    });
}

// Requires an admin to be signed in (enforced by Firestore security rules too).
function addNotification({ category, title, url, highlighted }) {
  return notificationsCol.add({
    category, title, url,
    highlighted: !!highlighted,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function deleteNotification(id) {
  return notificationsCol.doc(id).delete();
}
