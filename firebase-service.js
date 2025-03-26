const admin = require("firebase-admin");

const serviceAccount = require("./project1-306a0-firebase-adminsdk-zj1q2-c3b0d699c3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "project1-306a0.appspot.com"
});


module.exports = admin