const admin = require("../firebase-service");

class PengeluaranRepository {
    constructor() {
      this.db = admin.firestore(); // Inisialisasi Firestore
      this.collection = this.db.collection("pengeluaran"); // Simpan koleksi sebagai property
    }

    async getAllPengeluaran(userId) {
      try {
        const snapshot = await this.collection.where("userId", "==", userId).get();
        if (snapshot.empty) {
          return []; // Jika tidak ada data, kembalikan array kosong
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        throw new Error("Error fetching pengeluaran: " + error.message);
      }
    }

    async getPengeluaranById(id) {
      try {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
          throw new Error("Pengeluaran not found");
        }
        return doc.data();
      } catch (error) {
        throw new Error("Error fetching pengeluaran by ID: " + error.message);
      }
    }

    async addPengeluaran(pengeluaranData, userId) {
      try {
        const docRef = await this.collection.add({ ...pengeluaranData, userId });
        return { id: docRef.id, ...pengeluaranData, userId };
      } catch (error) {
        throw new Error("Error adding pengeluaran: " + error.message);
      }
    }

    async updatePengeluaran(id, pengeluaranData) {
      try {
        await this.collection.doc(id).update(pengeluaranData);
        return { id, ...pengeluaranData };
      } catch (error) {
        throw new Error("Error updating pengeluaran: " + error.message);
      }
    }

    async deletePengeluaran(id) {
      try {
        await this.collection.doc(id).delete();
        return { message: "Pengeluaran deleted successfully" };
      } catch (error) {
        throw new Error("Error deleting pengeluaran: " + error.message);
      }
    }
}

module.exports = new PengeluaranRepository();
