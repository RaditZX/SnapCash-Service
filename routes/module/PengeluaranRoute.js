const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");
const PengeluaranController = require("../../Controller/pengeluaranController");

module.exports = (router) => {
    router.get("/pengeluaranUser", verifyFirebaseToken, PengeluaranController.getPengeluaran); 
    router.post("/pengeluaranUser", verifyFirebaseToken, PengeluaranController.addPengeluaran);
    router.get("/pengeluaranUser/:id", verifyFirebaseToken, PengeluaranController.getPengeluaranById);
    router.put("/pengeluaranUser/update/:id", verifyFirebaseToken, PengeluaranController.updatePengeluaran);
    router.delete("/pengeluaranUser/delete/:id", verifyFirebaseToken, PengeluaranController.deletePengeluaran);
}
