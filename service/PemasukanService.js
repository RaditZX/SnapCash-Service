const pemasukanRepository = require("../repository/PemasukanRepository");
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

            console.log("Request body:", req.body);
    
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
                    'All fields are required. Missing: ${missingFields.join(", ")}',
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

    updatePemasukan = async (req, res) => {
        try {
            const {
                namaPemasukan, tanggal, sumber, jumlah, subtotal, total, tambahanBiaya, id_subKategori, isPengeluaran
            } = req.body;
            const { id } = req.params;
    
            console.log("Request body:", req.body);
            console.log("ID:", id);
    
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