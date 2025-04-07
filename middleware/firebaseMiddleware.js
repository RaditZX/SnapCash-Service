const admin = require("../firebase-service");
const {sendResponse} = require("../response");

async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Verifikasi token gagal:", error); // Tambahkan log ini
    sendResponse(403, req.body, "Token tidak valid", res);
  }
  
}

module.exports = verifyFirebaseToken;
