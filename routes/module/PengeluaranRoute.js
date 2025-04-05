const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");
const PengeluaranService = require("../../service/PengeluaranService");

module.exports = (router) => {
    // Sign up a new user
    router.get("/pengeluaranUser", verifyFirebaseToken, PengeluaranService.getPengeluaran); 
}
