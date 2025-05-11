const admin = require("../firebase-service");

class CurrencyRepository {
  constructor() {
    this.db = admin.firestore();
  }

    async getCurrency() {
        const currencyRef = this.db.collection("currency")
        const snapshot = await currencyRef.get();
        if (snapshot.empty) {
        return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCurrencyById(id) {
        const currencyRef = this.db.collection("currency").doc(id);
        const doc = await currencyRef.get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() };
    }

    async addCurrency(data) {
        const currencyRef = this.db.collection("currency");
        const newCurrencyRef = await currencyRef.add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return { id: newCurrencyRef.id, ...data };
    }

    async updateCurrency(id, data) {
        const currencyRef = this.db.collection("currency").doc(id);
        await currencyRef.update({
            ...data,
            updatedAt: new Date(),
        });
        return { id: id, ...data };
    }


    async deleteCurrency(id) {
        const currencyRef = this.db.collection("currency").doc(id);
        await currencyRef.delete();
        return { id: id };
    }
}
module.exports = new CurrencyRepository();