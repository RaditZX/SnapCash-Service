const KategoriRepository = require("../repository/KategoriRepository");

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
    if (!kategoriData.nama || kategoriData.nama.trim() === "") {
      throw new Error("Nama kategori wajib diisi");
    }
    return await this.repository.addKategori(kategoriData, userId);
  }

  async updateKategori(id, kategoriData, userId) {
    if (!kategoriData.nama || kategoriData.nama.trim() === "") {
      throw new Error("Nama kategori wajib diisi");
    }
    return await this.repository.updateKategori(id, kategoriData, userId);
  }

  async deleteKategori(id, userId) {
    return await this.repository.deleteKategori(id, userId);
  }
}

module.exports = new KategoriService();