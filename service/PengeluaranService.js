const pengeluaranRepository = require("../repository/pengeluaranRepository");
const {
    sendResponse
} = require("../response");
const auth = require("./authService");

class pengeluaranService {
    constructor() {
        this.repository = pengeluaranRepository;
    }

    getPengeluaran = async (req, res) => {
        try {
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await this.repository.getAllPengeluaran(userId);
            if (!result) {
                return sendResponse(
                    404,
                    req.body,
                    "Pengeluaran not found",
                    res
                );
            }
            sendResponse(
                200,
                result,
                "Data successfully retrieved",
                res,
                true
            );
        } catch (error) {
            console.error(error);
            sendResponse(
                500,
                req.body,
                "Error retrieving pengeluaran: " + error.message,
                res
            );
        }
    }

    addPengeluaran = async (req, res) => {
        try {
            const {
                namaPengeluaran,
                tanggal,
                toko,
                jumlah,
                subtotal,
                total,
                tambahanBiaya,
                // id_subKategori,
                isPengeluaran,
            } = req.body;

            const missingFields = [];
            if (!namaPengeluaran) missingFields.push("namaPengeluaran");
            if (!tanggal) missingFields.push("tanggal");
            if (!toko) missingFields.push("toko");
            if (!jumlah) missingFields.push("jumlah");
            if (!subtotal) missingFields.push("subtotal");
            if (!total) missingFields.push("total");
            if (!tambahanBiaya) missingFields.push("tambahanBiaya");
            // if (!id_subKategori) missingFields.push("id_subKategori");
            if (isPengeluaran === undefined || isPengeluaran === null)
                missingFields.push("isPengeluaran");

            if (missingFields.length > 0) {
                sendResponse(
                    400,
                    req.body,
                    `All fields are required. Missing: ${missingFields.join(", ")}`,
                    res
                );
                return;
            }

            const userId = await auth.getUserAuthenticate(req.user);

            // Simpan data pengeluaran
            const newPengeluaran = await this.repository.addPengeluaran({
                    namaPengeluaran,
                    tanggal,
                    toko,
                    jumlah,
                    subtotal,
                    total,
                    tambahanBiaya,
                    isPengeluaran,
                },
                userId
            );

            sendResponse(200, newPengeluaran, "Data successfully added", res, true);
        } catch (error) {
            sendResponse(
                500,
                req.body,
                "Error adding pengeluaran service: " + error.message,
                res
            );
        }
    };

    deletePengeluaran = async (req, res) => {
        try {
            const { id } = req.body;
    
            if (!id) {
                return sendResponse(400, req.body, "Missing document ID", res);
            }
    
            const userId = await auth.getUserAuthenticate(req.user);
    
            const deletedPengeluaran = await this.repository.deletePengeluaran(id, userId);
    
            if (!deletedPengeluaran) {
                return sendResponse(404, req.body, "Pengeluaran tidak ditemukan atau tidak diizinkan", res);
            }
    
           
            sendResponse(200, deletedPengeluaran, "Pengeluaran berhasil dihapus", res, true);
        } catch (error) {
            console.error(error);
            sendResponse(500, req.body, "Gagal menghapus pengeluaran: " + error.message, res);
        }
    };
    
    
 

    addPengeluaranByGPT = async (pengeluaranData, user) => {
        try {
            const {
                namaPengeluaran,
                tanggal,
                toko,
                jumlah,
                subtotal,
                total,
                tambahanBiaya,
                id_subKategori,
                isPengeluaran,
            } = pengeluaranData;

            const missingFields = [];
            if (!namaPengeluaran) missingFields.push("namaPengeluaran");
            if (!tanggal) missingFields.push("tanggal");
            if (!toko) missingFields.push("toko");
            if (!jumlah) missingFields.push("jumlah");
            if (!subtotal) missingFields.push("subtotal");
            if (!total) missingFields.push("total");
            if (tambahanBiaya === undefined || tambahanBiaya === null || Number.isNaN(parseInt(tambahanBiaya))) {
                missingFields.push("tambahanBiaya");
            }            
            if (isPengeluaran === undefined || isPengeluaran === null)
                missingFields.push("isPengeluaran");

            if (missingFields.length > 0) {
                throw new Error(
                    `All fields are required. Missing: ${missingFields.join(", ")}`
                );
            }

            const userId = await auth.getUserAuthenticate(user);

            // Simpan data pengeluaran
            const newPengeluaran = await this.repository.addPengeluaran({
                    namaPengeluaran,
                    tanggal,
                    toko,
                    jumlah,
                    subtotal,
                    total,
                    tambahanBiaya,
                    isPengeluaran,
                },
                userId
            );

            return newPengeluaran;
        } catch (error) {
            throw new Error("Error adding pengeluaran service: " + error.message);
        }
    };
}

module.exports = new pengeluaranService();