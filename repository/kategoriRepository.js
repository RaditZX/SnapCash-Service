const admin = require("../firebase-service");

class KategoriRepository {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("Kategori");
  }

  async getAllKategori(userId) {
    try {
      const snapshot = await this.collection.where("userId", "==", userId).get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error("Error fetching kategori: " + error.message);
    }
  }

  async getKategoriById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error("Kategori not found");
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error("Error fetching kategori by ID: " + error.message);
    }
  }

  async addKategori(kategoriData, userId) {
    try {
      const docRef = await this.collection.add({
        namaKategori: kategoriData.namaKategori,
        isPengeluaran: kategoriData.isPengeluaran,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        id: docRef.id,
        namaKategori: kategoriData.namaKategori,
        isPengeluaran: kategoriData.isPengeluaran,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error("Error adding kategori: " + error.message);
    }
  }

  async updateKategori(id, kategoriData, userId) {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error("Kategori not found");
      }
      if (doc.data().userId !== userId) {
        throw new Error("Unauthorized access to this kategori");
      }
      const updateData = {
        updatedAt: new Date(),
      };
      if (kategoriData.namaKategori !== undefined) {
        updateData.namaKategori = kategoriData.namaKategori;
      }
      if (kategoriData.isPengeluaran !== undefined) {
        updateData.isPengeluaran = kategoriData.isPengeluaran;
      }
      await docRef.update(updateData);
      return {
        id,
        ...updateData,
        userId,
      };
    } catch (error) {
      throw new Error("Error updating kategori: " + error.message);
    }
  }

  async deleteKategori(id, userId) {
    try {
      const docRef = this.collection.doc(id);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        throw new Error("Kategori not found");
      }
      if (snapshot.data().userId !== userId) {
        throw new Error("Unauthorized access to this kategori");
      }

      await docRef.delete();
      return {
        message: "Kategori berhasil dihapus"
      };
    } catch (error) {
      throw new Error("Error deleting kategori: " + error.message);
    }
  }
}

module.exports = new KategoriRepository();