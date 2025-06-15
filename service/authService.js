const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} = require("firebase/auth");
const firebase = require("../firebase-client");
const admin = require("../firebase-service");
const userEntity = require("../Entity/UserEntity");
const authRepository = require("../repository/authRepository");
const {sendResetPasswordEmail} = require("../nodemailer")
const { firebaseService } = require("./firebaseService");
const firebases = new firebaseService();
const sharp = require("sharp");

const auth = getAuth(firebase);

// Fetch user verification status by email
const getUserVerificationStatusByEmail = async (email) => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.emailVerified;
  } catch (error) {
    console.error("Error fetching user verification status:", error);
    throw error;
  }
};

// Send email verification link
const sendEmailVerificationLink = async (email) => {
  try {
    const auth = getAuth();
    await sendEmailVerification(auth.currentUser);
    console.log("Verification email sent successfully.");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

class AuthService {
  getUserAuthenticate = async (user) => {
    try {
      const userId = user.uid;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      return userId;
    } catch (error) {
      console.error(error);
      throw new Error("User not authenticated", error);
    }
  };

  async signUp(email, password, confirmPassword, photo) {
    try {
      // Basic input validation
      if (!email || !password || !confirmPassword) {
        throw new Error("Please fill in email, password, and confirm password.");
      }

      if (confirmPassword !== password) {
        throw new Error("Make sure the password and confirm password match.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const user = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerificationLink(email);

      const userEntityInstance = new userEntity({
        userId: user.user.uid,
        email,
        foto: photo,
        currencyChoice: "IDR",
        limitOCR: { limit: 3, used: 0, resetDate: new Date() },
      });

      authRepository.createUser(userEntityInstance);

      return {
        status: 202,
        message: "Verification email has been sent. Please check your inbox to verify your account.",
      };
    } catch (error) {
      console.error(error);

      // Handle common Firebase errors
      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please use a different one or log in.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email format. Please check and try again.");
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password is too weak. Use at least 6 characters.");
      }

      // Default error
      throw new Error(error.message || "An error occurred during registration.");
    }
  }


  async signIn(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Please enter your email and password.");
      }

      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await sendEmailVerificationLink(email);
        return {
          status: 403,
          message:
            "Your email has not been verified. We have re-sent the verification email. Please check your inbox.",
        };
      }

      // Optionally update OCR limit in the background
      updateLimitOCR(userCredential.user.uid); // no await for faster response

      return {
        status: 200,
        data: { userCredential },
        message: "Login successful. Welcome back!",
      };
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        throw new Error("Email not found. Please register first.");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email format.");
      }

      throw new Error(error.message || "An error occurred during login.");
    }
  }



  async resetPassword(email) {
    try {
      if (!email) {
        throw new Error("Email is required to reset password");
      }
      const userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord) {
        throw new Error("User not found with the provided email");
      }
      await sendResetPasswordEmail(email)
      return {
        status: 200,
        message: "Password reset link has been sent to your email",
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error.code === "auth/user-not-found") {
        throw new Error("User not found with the provided email");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email format");
      }
      throw new Error(error.message || "Failed to send password reset link");
    }
  }

  
  async signInAdmin(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const isEmailVerified = await getUserVerificationStatusByEmail(email);

      if (isEmailVerified) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Check if the user is an admin
        const user = await authRepository.getUserById(userCredential.user.uid);
        if (user && user.role === "admin") {
          return {
            status: 200,
            data: { userCredential },
            message: "Admin login successful",
          };
        } else {
          return {
            status: 403,
            message: "Access denied. You are not an admin.",
          };
        }
      } else {
        await sendEmailVerificationLink();
        return {
          status: 403,
          message:
            "Please verify your email before logging in. We have resent the verification email.",
        };
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async signInWithGoogle(user) {
    try {
      const isUserExist = await authRepository.getUserByEmail(user.email);
      if (!isUserExist) {
        return {
          status: 404,
          message: "Akun Tidak Terdeteksi, silahkan ",
        };
      }

      await updateLimitOCR(user.uid);
      return {
        status: 200,
        data: { user },
        message: "Login Successful",
      };
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async registerWithGoogle(user) {
    try {
      // Ensure that user.email is present
      if (!user || !user.email || !user.uid) {
        throw new Error("User email or uid is missing");
      }

      const existingUser = await authRepository.getUserByEmail(user.email);

      // Check if the user already exists
      if (!existingUser) {
        const userEntityInstance = new userEntity({
          userId: user.uid,
          email: user.email,
          username: user.displayName || "User",
          currencyChoice: "IDR",
          limitOCR: {
            limit: 3,
            used: 0,
            resetDate: new Date()
          },
        });

        const createdUser = await authRepository.createUser(userEntityInstance);

        if (!createdUser || !createdUser.userId) {
          throw new Error("Gagal menambahkan user ke database.");
        }

        console.log("User berhasil ditambahkan:", createdUser);
      }


      // Return successful response
      return {
        status: 200,
        data: { user },
        message: "Registration successful",
      };
    } catch (error) {
      console.error("Registration failed:", error); // Improved error logging

      // Provide specific error message and return status 500
      return {
        status: 500,
        message: `Registration failed: ${error.message || error}`,
      };
    }
  }

  async signOut() {
    try {
      const user = auth.currentUser;

      if (user) {
        await signOut(auth);
        return { status: 200, message: "Sign out successfully" };
      } else {
        throw new Error("User is not authenticated");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Sign out failed");
    }
  }

  async updateProfile(user, username, photo, currencyChoice, no_hp) {
    try {
      let photoUrl
      if (photo) {
        const buffer = Buffer.from(photo); // Konversi dari ArrayBuffer ke Buffer

        const compressedImage = await sharp(buffer)
          .jpeg({ quality: 70 }) // Kompresi gambar dengan kualitas 80%
          .toBuffer();

        photoUrl = photo;
        if (compressedImage) {
          const url = await firebases.uploadImageToFirebase(compressedImage, {
            fileName: `profile/${user.uid}-${Date.now()}.jpg`,
            mimetype: "image/jpeg",
          });
          if (!url) {
            throw new Error("Failed to upload image");
          }
          console.log("Image URL:", url);
          photoUrl = url;
        }
      }

      const userId = user.uid;
      const email = user.email;

      const updatedUser = new userEntity({
        userId,
        email,
        username,
        foto: photoUrl,
        currencyChoice,
        no_hp,
      });

      const missingFields = updatedUser.validateFields();
      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(", ")}`);
      }

      const filledFields = updatedUser.getFilledFields();
      if (!updatedUser.hasAnyValue()) {
        throw new Error("No fields to update");
      }

      await authRepository.updateUser(userId, filledFields);
      return {
        status: 200,
        message: "Profile updated successfully",
        data: filledFields,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async signInGoogleAdmin(user) {
    try {
      const isUserExist = await authRepository.getUserByEmail(user.email);
      if (!isUserExist) {
        return {
          status: 404,
          message: "Akun Tidak Terdeteksi, silahkan ",
        };
      }

      // Check if the user is an admin
      if (isUserExist.role === "admin") {
        return {
          status: 200,
          data: { user },
          message: "Admin login successful",
        };
      } else {
        return {
          status: 403,
          message: "Access denied. You are not an admin.",
        };
      }
    } catch (error) {
      console.error(error);
      throw new Error("Login failed");
    }
  }

  async getUserData(userId) {
    try {
      const user = await authRepository.getUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return {
        status: 200,
        data: user,
        message: "User data retrieved successfully",
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAllUsers(_user) {
    try {
      const user = await getUserDatas(_user.uid);
      if (!user.data || !user.data.role || user.data.role !== "admin") {
        return {
          status: 403,
          message: "Access denied. You are not an admin.",
        };
      }
      const users = await authRepository.getAllUsers();
      if (!users || users.length === 0) {
        return {
          status: 404,
          message: "No users found",
        };
      }
      return {
        status: 200,
        data: users,
        message: "Users retrieved successfully",
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

async deleteUserbyAdmin(id, user) {
  try {
    const users = await getUserDatas(user.uid);
    if (!users.data || !users.data.role || users.data.role !== "admin") {
      return {
        status: 403,
        message: "Access denied. You are not an admin.",
      };
    }

    const deletedUser = await authRepository.deleteUser(id);

    return {
      data: deletedUser,
      status: 200,
      message: "User successfully deleted",
    };
  } catch (error) {
    throw error;
  }
}


}


const getUserDatas = async (userId) => {
  try {
    const user = await authRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      status: 200,
      data: user,
      message: "User data retrieved successfully",
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const updateLimitOCR = async (userId) => {
  try {
    const user = await authRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    console.log("User signed in with Google:", user);
    const limitOCR = user.limitOCR;

    // Update the used count and reset date
    if (!limitOCR.resetDate || new Date() > limitOCR.resetDate) {
      limitOCR.used = 0; // Reset used count if reset date has passed
      limitOCR.resetDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset after 24 hours
      await authRepository.updateUser(userId, { limitOCR });
      return {
        status: 200,
        data: limitOCR,
        message: "Limit OCR updated successfully",
      };
    }
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
  


}


module.exports = new AuthService();
