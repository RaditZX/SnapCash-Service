const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class authRepository{
    
    constructor(db) {
        this.db = admin.firestore();
        
    }
    async updateUser(userId, updatedData) {
        const userRef = this.db.collection("users").doc(userId);
        await userRef.update({
            ...updatedData,
            updatedAt: new Date(),
        });
        return (await userRef.get()).data();
    }

    async getUserByEmail(email) {
        const usersRef = this.db.collection("users");
        const querySnapshot = await usersRef.where("email", "==", email).get();
        if (querySnapshot.empty) {
            return null;
        }
        return querySnapshot.docs[0].data();
    }

    async createUser(user) {
        const { email, password } = user;
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        await this.db.collection("users").doc(userRecord.uid).set({
            userId: userRecord.uid,
            email: userRecord.email,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return userRecord;
    }

    async deleteUser(userId) {
        await admin.auth().deleteUser(userId);
        await this.db.collection("users").doc(userId).delete();
    }
}

module.exports = new authRepository();