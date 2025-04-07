const firebase = require("../firebase-client");
const admin = require("../firebase-service");


class pemasukanRepository {
    constructor() {
        this.db = admin.firestore();
        this.collection = this.db.collection('Pemasukan');
    }

    async getAllPemasukan(userId) {
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

    async createPemasukan(pemasukan, userId) {
        const docRef = await this.collection.add({...pemasukan,userId});
        return { id: docRef.id, ...pemasukan, userId };
    }

    async updatePemasukan(id, pemasukan, userId) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('Pemasukan not found');
        }
        await docRef.update({...pemasukan,userId});

        return { id: docRef.id, ...pemasukan, userId };
    }


    async deletePemasukan(id,userId) {
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

module.exports = new pemasukanRepository();