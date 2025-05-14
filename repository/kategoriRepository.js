const admin = require("../firebase-service");

class KategoriRepository {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("Kategori");
  }
  
  async getAllKategori(userId) {
    try {
      const snapshot = await this.collection
        .where("userId", "==", userId)
        .get();
      if (snapshot.empty) {
        return []; // Jika tidak ada data, kembalikan array kosong
      }
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      return doc.data();
    } catch (error) {
      throw new Error("Error fetching kategori by ID: " + error.message);
    }
  }

  async addKategori(kategori, userId) {
    const docRef = await this.collection.add({
      ...kategori,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docRef.update({ id: docRef.id });
    return {
      id: docRef.id,
      ...kategori,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateKategori(id, kategori, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Kategori not found");
    }
    await docRef.update({ ...kategori, userId, updatedAt: new Date() });

    return { id: docRef.id, ...kategori, userId, updatedAt: new Date() };
  }

  async deleteKategori(id, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Kategori not found");
    }
    await docRef.delete();
    return { id: docRef.id, userId };
  }
}

module.exports = new KategoriRepository();