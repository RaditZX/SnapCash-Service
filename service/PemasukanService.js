const pemasukanRepository = require("../repository/pemasukanRepository");
const { sendResponse } = require("../response");
const auth = require("./authService");

class PemasukanService{
    constructor(){
        this.pemasukanRepository = pemasukanRepository;
    }

    async getAllPemasukan(){
        return await this.pemasukanRepository.getAllPemasukan();
    }

    async getPemasukanById(id){
        return await this.pemasukanRepository.getPemasukanById(id);
    }

    addPemasukan = async (req,res) => {
        try {
            const {
                namaPemasukan, tanggal, sumber, jumlah, subtotal, total, tambahanBiaya, id_subKategori, isPengeluaran
            } = req.body;

            console.log("Request body:", req.body); // Tambahkan log ini untuk memeriksa isi request body
    
            const missingFields = [];
            if (!namaPemasukan) missingFields.push("nama pemasukan");
            if (!tanggal) missingFields.push("tanggal");
            if (!sumber) missingFields.push("sumber");
            if (!jumlah) missingFields.push("jumlah");
            if (!subtotal) missingFields.push("subtotal");
            if (!total) missingFields.push("total");
            if (!tambahanBiaya) missingFields.push("tambahanBiaya");
            if (isPengeluaran === undefined || isPengeluaran === null)
                missingFields.push("isPengeluaran");

            if (missingFields.length > 0) {
                return sendResponse(
                    400,
                    req.body,
                    `All fields are required. Missing: ${missingFields.join(", ")}`,
                    res
                );
            }
        
            const userId = await auth.getUserAuthenticate(req.user);
        
            // Simpan data pengeluaran
            const newPemasukan = await this.pemasukanRepository.createPemasukan({
                namaPemasukan,
                tanggal,
                sumber,
                jumlah,
                subtotal,
                total,
                tambahanBiaya,
                isPengeluaran
            }, userId);
        
            sendResponse(200, newPemasukan, "Data successfully added", res, true);
        
        } catch (error) {
            sendResponse(500, req.body, "Error adding pemasukan service: " + error.message, res);
        }
        
    };

   
    async updatePemasukan(id, pemasukan){
        return await this.pemasukanRepository.updatePemasukan(id, pemasukan);
    }

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
                namaPemasukan, tanggal, sumber, jumlah, subtotal, total, tambahanBiaya, id_subKategori, isPengeluaran
            } = pemasukanData;
    
            if (! namaPemasukan || !tanggal || !sumber || !jumlah || !subtotal || !total || !tambahanBiaya || !isPengeluaran) {
                throw new Error("All fields are required");
            }
        
            const userId = await auth.getUserAuthenticate(user);
        
            // Simpan data pengeluaran
            const newPemasukan = await this.pemasukanRepository.createPemasukan({
                namaPemasukan,
                tanggal,
                sumber,
                jumlah,
                subtotal,
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