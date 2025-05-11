const admin = require("../firebase-service");

class PengeluaranRepository {
  constructor() {
    this.db = admin.firestore(); // Inisialisasi Firestore
    this.collection = this.db.collection("Pengeluaran"); // Simpan koleksi sebagai property
  }

  async getAllPengeluaran(userId, search = null, kategori = null, startDate = null, endDate = null, nominalMin = null, nominalMax = null) {
    try {
      let query = this.collection.where("userId", "==", userId);

      if (search) {
        query = query.where("namaPengeluaran", ">=", search)
                     .where("namaPengeluaran", "<=", search + '\uf8ff'); 
      }
  
      if (kategori) {
        query = query.where("kategori", "==", kategori);
      }
  
      // Validasi filter tanggal (Firestore tidak izinkan null)
      if (startDate && endDate) {
        query = query.where("tanggal", ">=", startDate)
                     .where("tanggal", "<=", endDate);
      } else if (startDate) {
        query = query.where("tanggal", ">=", startDate);
      } else if (endDate) {
        query = query.where("tanggal", "<=", endDate);
      }

      // Validasi filter nominal
      if (nominalMin && nominalMax) {
        query = query.where("total", ">=", nominalMin)
                      .where("total", "<=", nominalMax);
      } else if (nominalMin) {
        query = query.where("total", ">=", nominalMin);
      } else if (nominalMax) {
        query = query.where("total", "<=", nominalMax);
      }
  
      const snapshot = await query.get();
  
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      const docRef = await this.collection.add({
        ...pengeluaranData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await docRef.update({
        id: docRef.id
      });

      return {
        id: docRef.id,
        ...pengeluaranData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error("Error adding pengeluaran: " + error.message);
    }
  }


  async updatePengeluaran(id, pengeluaranData, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('Pengeluaran not found');
    }
    await docRef.update({
      ...pengeluaranData,
      userId,
      updatedAt: new Date(),
    });
    return {
      id,
      ...pengeluaranData,
      userId
    };
  }


  async deletePengeluaran(id, userId) {
    try {
      const docRef = this.collection.doc(id);
      const snapshot = await docRef.get();

      if (!snapshot.exists) return null;

      const data = snapshot.data();
      if (data.userId !== userId) return null;

      await docRef.delete();
      return {
        message: "Pengeluaran berhasil dihapus"
      };
    } catch (error) {
      throw new Error("Gagal menghapus pengeluaran: " + error.message);
    }
  }


}

module.exports = new PengeluaranRepository();