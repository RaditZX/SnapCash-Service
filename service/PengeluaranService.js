const PengeluaranRepository = require("../repository/pengeluaranRepository");
const PengeluaranEntity = require("../Entity/PengeluaranEntity");
const auth = require("./authService");

class PengeluaranService {
    constructor() {
        this.repository = PengeluaranRepository;
    }

    async getPengeluaran(userId) {
        return await this.repository.getAllPengeluaran(userId);
    }

    async getPengeluaranById(id, userId) {
        const result = await this.repository.getPengeluaranById(id, userId);
        if (!result) {
            throw new Error("Pengeluaran not found");
        }
        if (result.userId !== userId) {
            throw new Error("Unauthorized access to this pengeluaran");
        }
        return result;
    }

    async addPengeluaran(pengeluaranData, userId) {
        const pengeluaran = new PengeluaranEntity(pengeluaranData)
        const missingFields = pengeluaran.validateFields();
        if (missingFields.length > 0) {
            throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
        }
        return await this.repository.addPengeluaran(pengeluaran.getFilledFields(), userId);
    }

    async updatePengeluaran(id, pengeluaranData, userId) {
        const pengeluaran = new PengeluaranEntity(pengeluaranData)
        if (!pengeluaran.hasAnyValue()) {
            throw new Error("Minimal satu field harus diisi untuk melakukan update.");
        }
        return await this.repository.updatePengeluaran(id, pengeluaran.getFilledFields(), userId);
    }

    async deletePengeluaran(id, userId) {
        return await this.repository.deletePengeluaran(id, userId);
    }

    async addPengeluaranByGPT(pengeluaranData, user) {
        const pengeluaran = new PengeluaranEntity(pengeluaranData);
        const missingFields = pengeluaran.validateFields();
        if (missingFields.length > 0) {
            throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
        }
        const userId = await auth.getUserAuthenticate(user);
        return await this.repository.addPengeluaran(pengeluaran.getFilledFields(), userId);
    }
}

module.exports = new PengeluaranService();
