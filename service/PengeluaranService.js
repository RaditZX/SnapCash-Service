const pengeluaranRepository = require("../repository/pengeluaranRepository");
const {
    sendResponse
} = require("../response");
const auth = require("./authService");

class PengeluaranService {
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

    getPengeluaranById = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await this.repository.getPengeluaranById(id, userId);

                        
            if (result.userId !== userId) {
                return sendResponse(
                    403,
                    req.body,
                    "Unauthorized access to this pengeluaran",
                    res
                );
            }

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
                total,
                tambahanBiaya,
                barang
            } = req.body;

            const missingFields = [];
            if (!namaPengeluaran) missingFields.push("namaPengeluaran");
            if (!tanggal) missingFields.push("tanggal");
            if (!toko) missingFields.push("toko");
            if (!total) missingFields.push("total");
            if (!tambahanBiaya) missingFields.push("tambahanBiaya");
            if (!barang)missingFields.push("barang");
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
            const isPengeluaran = true;

            // Simpan data pengeluaran
            const newPengeluaran = await this.repository.addPengeluaran({
                    namaPengeluaran,
                    tanggal,
                    toko,
                    total,
                    tambahanBiaya,
                    isPengeluaran,
                    barang
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

    updatePengeluaran = async (req, res) => {
        try {
            const {
                namaPengeluaran, tanggal, toko, total,
                tambahanBiaya, id_subKategori, isPengeluaran
            } = req.body;
            const { id } = req.params;
    
            console.log("Request body:", req.body);
            console.log("ID:", id);
    
            // Cek minimal satu field diisi
            const isAnyFieldProvided = [
                namaPengeluaran,
                tanggal,
                toko,
                total,
                tambahanBiaya,
                isPengeluaran
            ].some(field => field !== undefined && field !== null && field !== '');
    
            if (!isAnyFieldProvided) {
                return sendResponse(
                    400,
                    req.body,
                    "Minimal satu field harus diisi untuk melakukan update.",
                    res
                );

            }
    
            const userId = await auth.getUserAuthenticate(req.user);

    
            // Buat object field yang akan diupdate (hanya field yang tidak kosong/null)
            const updateData = {};
            if (namaPengeluaran !== undefined) updateData.namaPengeluaran = namaPengeluaran;
            if (tanggal !== undefined) updateData.tanggal = tanggal;
            if (toko !== undefined) updateData.toko = toko;
            if (total !== undefined) updateData.total = total;
            if (tambahanBiaya !== undefined) updateData.tambahanBiaya = tambahanBiaya;
            if (id_subKategori !== undefined) updateData.id_subKategori = id_subKategori;
            if (isPengeluaran !== undefined) updateData.isPengeluaran = isPengeluaran;
    
            // Update data pengeluaran
            const updatedPengeluaran = await this.repository.updatePengeluaran(id, updateData, userId);
    
            sendResponse(200, updatedPengeluaran, "Data successfully updated", res, true);
    
        } catch (error) {
            sendResponse(500, req.body, "Error updating pengeluaran service: " + error.message, res);
        }
    };

  
     deletePengeluaran = async (req, res) => {
        try {
            const { id } = req.params;
    
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
                total,
                tambahanBiaya,
                barang,
                isPengeluaran,
            } = pengeluaranData;


            const missingFields = [];
            if (!namaPengeluaran) missingFields.push("namaPengeluaran");
            if (!tanggal) missingFields.push("tanggal");
            if (!toko) missingFields.push("toko");
            if (!total) missingFields.push("total");
            if (!barang) missingFields.push("barang");
            if (!tambahanBiaya) {
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
                    total,
                    barang,
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

module.exports = new PengeluaranService();
