const admin = require("firebase-admin");
const serviceAccount = require("./Firebase_admin_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin }; // Add `admin` here
