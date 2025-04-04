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
        const docRef = await this.collection.add(pemasukan,userId);
        return { id: docRef.id, ...pemasukan, userId };
    }

    async updatePemasukan(id, pemasukan) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('Pemasukan not found');
        }
        await docRef.update(pemasukan);
        return { id, ...pemasukan };
    }

    async deletePemasukan(id) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('Pemasukan not found');
        }
        await docRef.delete();
        return { id };
    }


}

module.exports = new pemasukanRepository();