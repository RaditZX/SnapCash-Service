const admin = require("../firebase-service");

class PengeluaranRepository {
    constructor() {
      this.db = admin.firestore(); // Inisialisasi Firestore
      this.collection = this.db.collection("Pengeluaran"); // Simpan koleksi sebagai property
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
        const docRef = await this.collection.add({
          ...pengeluaranData,
          userId
        });
        
        await docRef.update({ id: docRef.id });
    
        return { id: docRef.id, ...pengeluaranData, userId };
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
      await docRef.update({ ...pengeluaranData, userId });
      return { id, ...pengeluaranData, userId };
  }
  

    async deletePengeluaran(id, userId) {
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

module.exports = new PengeluaranRepository();
