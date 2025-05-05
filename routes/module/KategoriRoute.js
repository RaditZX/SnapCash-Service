const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");
const KategoriController = require("../../Controller/kategoriController");

module.exports = (router) => {
    router.get("/kategori", verifyFirebaseToken, KategoriController.getAllKategori);
    router.post("/kategori/add", verifyFirebaseToken, KategoriController.addKategori);
    router.get("/kategori/:id", verifyFirebaseToken, KategoriController.getKategoriById);
    router.put("/kategori/update/:id", verifyFirebaseToken, KategoriController.updateKategori);
    router.delete("/kategori/delete/:id", verifyFirebaseToken, KategoriController.deleteKategori);
}