const KategoriRepository = require("../repository/KategoriRepository");
const KategoriEntity = require("../Entity/KategoriEntity");

class KategoriService {
  constructor() {
    this.repository = KategoriRepository;
  }

  async getAllKategori(userId) {
    return await this.repository.getAllKategori(userId);
  }

  async getKategoriById(id, userId) {
    const kategori = await this.repository.getKategoriById(id);
    if (kategori.userId !== userId) {
      throw new Error("Unauthorized access to this kategori");
    }
    return kategori;
  }

  async addKategori(kategoriData, userId) {
    console.log("Service received kategoriData:", kategoriData); // Debug log
    const kategori = new KategoriEntity({
      namaKategori: kategoriData.namaKategori,
      isPengeluaran: kategoriData.isPengeluaran
    });
    const missingFields = kategori.validateFields();
    if (missingFields.length > 0) {
      throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
    }
    console.log("Filled fields:", kategori.getFilledFields()); // Debug log
    return await this.repository.addKategori(kategori.getFilledFields(), userId);
  }

  async updateKategori(id, kategoriData, userId) {
    const kategori = new KategoriEntity({
      namaKategori: kategoriData.namaKategori,
      isPengeluaran: kategoriData.isPengeluaran
    });
    if (!kategori.hasAnyValue()) {
      throw new Error("Minimal satu field harus diisi untuk melakukan update.");
    }
    return await this.repository.updateKategori(id, kategori.getFilledFields(), userId);
  }

  async deleteKategori(id, userId) {
    return await this.repository.deleteKategori(id, userId);
  }
}

module.exports = new KategoriService();