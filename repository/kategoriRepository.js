const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class KategoriRepository {
  constructor() {
    this.db = admin.firestore();
    this.collection = this.db.collection("Kategori");
  }

  async getAllCategories(userId, search, isPengeluaran) {
    try {
        let query = this.collection.where("userId", "==", userId);
        if (search) {
            if (typeof search !== "string") {
                throw new Error("Gunakan Huruf");
            }
            query = query.where("nama", ">=", search)
                        .where("nama", "<=", search + '\uf8ff');
        }
        if (isPengeluaran !== undefined && isPengeluaran !== null) {
            query = query.where("isPengeluaran", "==", isPengeluaran);
        }
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            if (!data.nama) {
                console.warn(`Skipping document ${doc.id} due to missing 'nama' field`);
                return null;
            }
            return {
                id: doc.id,
                nama: data.nama,
                isPengeluaran: data.isPengeluaran ?? false,
                userId: data.userId,
                createdAt: data.createdAt?.toDate().toISOString(),
                updatedAt: data.updatedAt?.toDate().toISOString(),
            };
        }).filter(item => item !== null);
    } catch (error) {
        throw new Error("Error fetching categories: " + error.message);
    }
  }

  async getCategoryById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new Error("Category not found");
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error("Error fetching category: " + error.message);
    }
  }

  async addCategory(category, userId) {
    try {
      const docRef = this.collection.doc();
      const data = {
        ...category,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await docRef.set(data);
    
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      throw new Error("Error adding category: " + error.message);
    }
  }

  async updateCategory(id, category, userId) {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new Error("Category not found");
      }

      // Periksa apakah kategori milik user yang benar
      const existingData = doc.data();
      if (existingData.userId !== userId) {
        throw new Error("Unauthorized: You can only update your own categories");
      }

      const updateData = { 
        ...category, 
        userId, 
        updatedAt: new Date() 
      };
      
      await docRef.update(updateData);

      // Return data yang sudah diupdate
      const updatedDoc = await docRef.get();
      return { id: docRef.id, ...updatedDoc.data() };
    } catch (error) {
      throw new Error("Error updating category: " + error.message);
    }
  }

  
  async deleteCategory(id, userId) {
    try {
        const docRef = this.collection.doc(id);
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            throw new Error("Category not found");
        }

        const existingData = snapshot.data();
        if (existingData.userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own categories");
        }
          // Tambahan: Cek apakah kategori digunakan dalam transaksi
        const transaksiCheck = await this.db.collection("Transaksi")
            .where("kategoriId", "==", id)
            .where("userId", "==", userId)
            .limit(1)
            .get();
        if (!transaksiCheck.empty) {
            throw new Error("Category cannot be deleted as it is used in transactions");
        }

        await docRef.delete();
        return { 
            id: id, 
            message: "Category deleted successfully" 
        };
    } catch (error) {
        console.error("Error in KategoriRepository.deleteCategory:", error.message, error.stack);
        throw new Error("Error deleting category: " + error.message);
    }
  }

}

module.exports = new KategoriRepository();