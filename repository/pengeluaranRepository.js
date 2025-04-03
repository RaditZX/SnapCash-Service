const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class pengeluarangRepository {
  constructor(db) {
    this.db = admin.firestore();
  }
  async getPengeluaranById(id) {
    try {
      const doc = await this.db.collection("pengeluaran").doc(id).get();
      if (!doc.exists) {
        throw new Error("Pengeluaran not found");
      }
      return doc.data();
    } catch (error) {
      throw new Error("Error fetching pengeluaran by ID: " + error.message);
    }
  }

  async updatePengeluaran(id, pengeluaranData) {
    try {
      await this.db.collection("pengeluaran").doc(id).update(pengeluaranData);
      return { id, ...pengeluaranData };
    } catch (error) {
      throw new Error("Error updating pengeluaran: " + error.message);
    }
  }

  async deletePengeluaran(id) {
    try {
      await this.db.collection("pengeluaran").doc(id).delete();
      return { message: "Pengeluaran deleted successfully" };
    } catch (error) {
      throw new Error("Error deleting pengeluaran: " + error.message);
    }
  }
}
