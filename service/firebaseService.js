const admin = require("../firebase-service");
const path = require("path");
const { getStorage } = require("firebase-admin/storage");

class firebaseService{

    async uploadImageToFirebase(file) {
        try {
            const bucket = getStorage().bucket();
            const fileName = `invoices/${Date.now()}_${file.originalname}`;
            const fileUpload = bucket.file(fileName);

            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype
                }
            });

            return new Promise((resolve, reject) => {
                stream.on("error", (error) => {
                    console.error("Error uploading to Firebase:", error);
                    reject(null);
                });

                stream.on("finish", async () => {
                    await fileUpload.makePublic(); // ✅ Bikin gambar bisa diakses publik
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    resolve(publicUrl);
                });

                stream.end(file.buffer);
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    }

}

module.exports = { firebaseService};