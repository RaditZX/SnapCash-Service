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
        try {
            const { email, userId } = user;

            await this.db.collection("users").add({
                userId: userId,
                email: email,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return user;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }

    async deleteUser(userId) {
        await admin.auth().deleteUser(userId);
        await this.db.collection("users").doc(userId).delete();
    }
}

module.exports = new authRepository();