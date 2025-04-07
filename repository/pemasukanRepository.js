const firebase = require("../firebase-client");
const admin = require("../firebase-service");


class pemasukanRepository {
    constructor() {
        this.db = admin.firestore();
        this.collection = this.db.collection('Pemasukan');
    }

    async getAllPemasukan() {
        const snapshot = await this.collection.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getPemasukanById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
            throw new Error('Pemasukan not found');
        }
        return { id: doc.id, ...doc.data() };
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
        return { id, ...pemasukan, userId };
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