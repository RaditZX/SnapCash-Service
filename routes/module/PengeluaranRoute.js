const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");
const PengeluaranService = require("../../service/PengeluaranService");

module.exports = (router) => {
    router.get("/pengeluaranUser", verifyFirebaseToken, PengeluaranService.getPengeluaran); 
    router.post("/pengeluaranUser", verifyFirebaseToken, PengeluaranService.addPengeluaran);
    router.get("/pengeluaranUser/:id", verifyFirebaseToken, PengeluaranService.getPengeluaranById);
    router.put("/pengeluaranUser/update/:id", verifyFirebaseToken, PengeluaranService.updatePengeluaran);
    router.delete("/pengeluaranUser/delete/:id", verifyFirebaseToken, PengeluaranService.deletePengeluaran);
}
