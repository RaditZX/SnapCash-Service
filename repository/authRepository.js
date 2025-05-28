const firebase = require("../firebase-client");
const admin = require("../firebase-service");

class authRepository {
  constructor(db) {
    this.db = admin.firestore();
  }

  async getUserById(userId) {
    const userRef = this.db.collection("users").where("userId", "==", userId);
    const snapshot = await userRef.get();
    if (snapshot.empty) {
      return null;
    }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }

  async updateUser(userId, updatedData) {
    const userRef = this.db.collection("users").where("userId", "==", userId);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      throw new Error("User not found");
    }

    const userDoc = snapshot.docs[0];
    const userDocId = userDoc.id;
    const userData = userDoc.data();

    // Update auth fields in Firebase Authentication
    const updateAuthData = {};

    if (updatedData.photo) {
      updateAuthData.photoURL = updatedData.photo;
    }

    if (updatedData.username) {
      updateAuthData.username = updatedData.username;
    }

    if (updatedData.currencyChoice) {
      updateAuthData.currencyChoice = updatedData.currencyChoice;
    }

    if (updatedData.no_hp) {
      updateAuthData.no_hp = updatedData.no_hp;
    }

    if (Object.keys(updateAuthData).length > 0) {
      const userRecord = await admin.auth().updateUser(userId, updateAuthData);
      if (updatedData.email) {
        updatedData.email = userRecord.email; // ensure consistency
      }
    }

    // Update Firestore user data
    const userDocRef = this.db.collection("users").doc(userDocId);
    await userDocRef.update(updatedData);
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
