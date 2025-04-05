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
    
            if (! namaPemasukan || !tanggal || !sumber || !jumlah || !subtotal || !total || !tambahanBiaya || !isPengeluaran) {
                sendResponse(400, req.body, "All fields are required", res);
            }
        
            const userId = await auth.getUserAuthenticate();
        
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

    async deletePemasukan(id){
        return await this.pemasukanRepository.deletePemasukan(id);
    }

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