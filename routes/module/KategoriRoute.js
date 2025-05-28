const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const KategoriController = require('../../Controller/kategoriController');

module.exports = (router) => {
    router.get("/kategoriUser", verifyFirebaseToken, KategoriController.getAllCategories);
    router.get("/kategoriUser/:id", verifyFirebaseToken, KategoriController.getCategoryById);
    router.post("/kategoriUser/add", verifyFirebaseToken, KategoriController.addCategory);
    router.put("/kategoriUser/update/:id", verifyFirebaseToken, KategoriController.updateCategory);
    router.delete('/kategoriUser/delete/:id', verifyFirebaseToken, KategoriController.deleteCategory);
}
