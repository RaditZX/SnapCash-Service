const PengeluaranService = require("../../service/PengeluaranService");

module.exports = (router) => {
    // Sign up a new user
    router.get("/pengeluaranUser", PengeluaranService.getPengeluaran); 
}
