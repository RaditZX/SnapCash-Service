const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class kategoriRepository {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("Kategori");
  }

  async getAllKategori(userId) {
    try {
      const snapshot = await this.collection.where("userId", "==", userId).get();
      if (snapshot.empty) {
        return []; // Jika tidak ada data, kembalikan array kosong
      }
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error("Error fetching kategori: " + error.message);
    }
  }

  async getKategoriById(id, userId){
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error("Kategori not found");
      }
      const data = doc.data();
      if (data.userId !== userId) {
        throw new Error("Unauthorized access to kategori");
      }
      return { id: doc.id, ...data };
    }catch (error) {
      throw new Error("Error fetching kategori by ID: " + error.message);
    }
  }

  async addKategori(kategoriData, userId) {
    const docRef = await this.collection.add({
      nama : kategoriData.nama,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    docRef.update({ id: docRef.id });
    return {
      id: docRef.id,
      nama: kategoriData.nama,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }catch (error) {
    throw new Error("Error adding kategori: " + error.message);
  }

  async updateKategori(id, kategoriData, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Kategori not found");
    }
    await docRef.update({ nama: kategoriData.nama, userId, updatedAt: new Date() });
    return { id, nama: kategoriData.nama, userId, updatedAt: new Date() };
  }catch (error) {
    throw new Error("Error updating kategori: " + error.message);
  }

  async deleteKategori(id, userId) {
    const docRef = this.collection.doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw new Error("Kategori not found");
    }
    if (snapshot.data().userId !== userId) {
      throw new Error("Unauthorized access to kategori");
    }
    await docRef.delete();
    return { 
      message: "Kategori deleted successfully",
     };
  }catch (error) {
    throw new Error("Error deleting kategori: " + error.message);
  }
}
module.exports = new kategoriRepository();
