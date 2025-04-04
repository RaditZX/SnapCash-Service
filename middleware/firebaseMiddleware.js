const admin = require("../firebase-service");

async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // user info dari Firebase
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token tidak valid" });
  }
}

module.exports = verifyFirebaseToken;
