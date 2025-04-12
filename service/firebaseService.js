const admin = require("../firebase-service");
const path = require("path");
const { getStorage } = require("firebase-admin/storage");

class firebaseService{

    async uploadImageToFirebase(file, options = {}) {
        try {
            const bucket = getStorage().bucket();
    
            // Tentukan nama file dan mimetype
            const timestamp = Date.now();
            const fileName = options.fileName || `invoices/${timestamp}.jpg`; // fallback file name
            const mimetype = options.mimetype || 'image/jpeg'; // fallback mimetype
    
            const fileUpload = bucket.file(fileName);
    
            const [exists] = await fileUpload.exists();
            if (exists) {
                console.log("✅ File already exists, using existing one.");
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                return publicUrl;
            }
    
            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: mimetype,
                },
            });
    
            return new Promise((resolve, reject) => {
                stream.on("error", (error) => {
                    console.error("Error uploading to Firebase:", error);
                    reject(null);
                });
    
                stream.on("finish", async () => {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    resolve(publicUrl);
                });
    
                // Support dua tipe: file object atau langsung buffer
                const bufferData = file?.buffer ? file.buffer : file;
                stream.end(Buffer.isBuffer(bufferData) ? bufferData : Buffer.from(bufferData));
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    }
    

}

module.exports = { firebaseService};