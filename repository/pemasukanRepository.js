const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class PemasukanRepository {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("Pemasukan");
  }

  async getAllPemasukan(userId, search, kategori, startDate, endDate, nominalMin, nominalMax) {
    try {
    
      let query = this.collection.where("userId", "==", userId);

      if (search) {
        query = query.where("namaPemasukan", ">=", search)
                     .where("namaPemasukan", "<=", search + '\uf8ff'); 
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

      if (nominalMin != null && nominalMax != null) {
        query = query.where("total", ">=", nominalMin)
                     .where("total", "<=", nominalMax)
      } else if (nominalMin != null) {
        console.log("nominalMin", nominalMin);
          query = query.where("total", ">=", nominalMin)
      } else if (nominalMax != null) {
        console.log("nominalMax", nominalMax);
          query = query.where("total", "<=", nominalMax)
      }
      
  
      const snapshot = await query.get();
  
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error("Error fetching pemasukan: " + error.message);
    }
  }
  
  async getPemasukanById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error("Pemasukan not found");
      }
      return doc.data();
    } catch (error) {
      throw new Error("Error fetching pemasukan by ID: " + error.message);
    }
  }

  async createPemasukan(pemasukan, userId) {
    const docRef = await this.collection.add({
      ...pemasukan,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docRef.update({ id: docRef.id });
    return {
      id: docRef.id,
      ...pemasukan,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updatePemasukan(id, pemasukan, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Pemasukan not found");
    }
    await docRef.update({ ...pemasukan, userId, updatedAt: new Date() });

    return { id: docRef.id, ...pemasukan, userId, updatedAt: new Date() };
  }

  async deletePemasukan(id, userId) {
    try {
      const docRef = this.collection.doc(id);
      const snapshot = await docRef.get();

      if (!snapshot.exists) return null;

      const data = snapshot.data();
      if (data.userId !== userId) return null;

      await docRef.delete();
      return { message: "Pengeluaran berhasil dihapus" };
    } catch (error) {
      throw new Error("Gagal menghapus pengeluaran: " + error.message);
    }
  }
}

module.exports = new PemasukanRepository();
