const pemasukanRepository = require("../repository/pemasukanRepository");
const { sendResponse } = require("../response");
const auth = require("./authService");

class PemasukanService{
    constructor(){
        this.pemasukanRepository = pemasukanRepository;
    }

    getPemasukanUser = async (req, res) => {
            try {
                const userId = await auth.getUserAuthenticate(req.user);
                const result = await this.pemasukanRepository.getAllPemasukan(userId);
                if (!result) {
                    return sendResponse(
                        404,
                        req.body,
                        "Pemasukan not found",
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
                    "Error retrieving pemasukan: " + error.message,
                    res
                );
            }
        }

    getPemasukanById = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await this.pemasukanRepository.getPemasukanById(id, userId);
            
            if (result.userId !== userId) {
                return sendResponse(
                    403,
                    req.body,
                    "Unauthorized access to this pemasukan",
                    res
                );
            }

            if (!result) {
                return sendResponse(
                    404,
                    req.body,
                    "Pemasukan not found",
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
                "Error retrieving pemasukan: " + error.message,
                res
            );
        }
    }

    addPemasukan = async (req,res) => {
        try {
            const {
                namaPemasukan, tanggal, sumber, total, tambahanBiaya
            } = req.body;
    
            const missingFields = [];
            if (!namaPemasukan) missingFields.push("nama pemasukan");
            if (!tanggal) missingFields.push("tanggal");
            if (!sumber) missingFields.push("sumber");
            if (!total) missingFields.push("total");
            if (!tambahanBiaya) missingFields.push("tambahanBiaya");

            const isPengeluaran = false
            

            if (missingFields.length > 0) {
                return sendResponse(
                    400,
                    req.body,
                    'All fields are required. Missing: ${missingFields.join(", ")}',
                    res,
                    false
                );
            }
        
            const userId = await auth.getUserAuthenticate(req.user);
        
            // Simpan data pengeluaran
            const newPemasukan = await this.pemasukanRepository.createPemasukan({
                namaPemasukan,
                tanggal,
                sumber,
                total,
                tambahanBiaya,
                isPengeluaran
            }, userId);
        
            sendResponse(200, newPemasukan, "Data successfully added", res, true);
        
        } catch (error) {
            sendResponse(500, req.body, "Error adding pemasukan service: " + error.message, res);
        }
        
    };

    updatePemasukan = async (req, res) => {
        try {
            const {
                namaPemasukan, tanggal, sumber, jumlah, subtotal, total, tambahanBiaya, id_subKategori, isPengeluaran
            } = req.body;
            const { id } = req.params;
    
            // Cek minimal satu field diisi
            const isAnyFieldProvided = [
                namaPemasukan,
                tanggal,
                sumber,
                jumlah,
                subtotal,
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
            if (namaPemasukan !== undefined) updateData.namaPemasukan = namaPemasukan;
            if (tanggal !== undefined) updateData.tanggal = tanggal;
            if (sumber !== undefined) updateData.sumber = sumber;
            if (jumlah !== undefined) updateData.jumlah = jumlah;
            if (subtotal !== undefined) updateData.subtotal = subtotal;
            if (total !== undefined) updateData.total = total;
            if (tambahanBiaya !== undefined) updateData.tambahanBiaya = tambahanBiaya;
            if (isPengeluaran !== undefined) updateData.isPengeluaran = isPengeluaran;
    
            // Update data pemasukan
            const updatedPemasukan = await this.pemasukanRepository.updatePemasukan(id, updateData, userId);
    
            sendResponse(200, updatedPemasukan, "Data successfully updated", res, true);
    
        } catch (error) {
            sendResponse(500, req.body, "Error updating pemasukan service: " + error.message, res);
        }
    };
    

    deletePemasukan = async(req,res) =>{
        try {
            const { id } = req.body;

            if (!id) {
                sendResponse(400, req.body, "Missing document ID", res);
                return;
            }

            const userId = await auth.getUserAuthenticate(req.user);

            const deletedPemasukan = await this.pemasukanRepository.deletePemasukan(id, userId);

            if (!deletedPemasukan) {
                sendResponse(404, req.body, "Pemasukan not found or unauthorized", res);
                return;
            }

            sendResponse(200, deletedPemasukan, "Pemasukan successfully deleted", res, true);
        }catch (error) {
            sendResponse(500, req.body, "Error deleting pemasukan service: " + error.message, res);
        }
    };

    addPemasukanByGPT = async (pemasukanData, user) => {
        try {
            const {
                namaPemasukan, tanggal, sumber, total, tambahanBiaya, id_subKategori, isPengeluaran
            } = pemasukanData;

            const missingFields = [];
            if (!namaPemasukan) missingFields.push("namaPemasukan");
            if (!tanggal) missingFields.push("tanggal");
            if (!sumber) missingFields.push("sumber");
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
            const newPemasukan = await this.pemasukanRepository.createPemasukan({
                namaPemasukan,
                tanggal,
                sumber,
                total,
                tambahanBiaya,
                isPengeluaran
            }, userId);
        
            return newPemasukan;
        
        } catch (error) {
            throw new Error("Error adding pemasukan service: " + error.message);
        }
        
    };
 
}

module.exports = new PemasukanService();
