const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification } = require("firebase/auth");
const firebase = require("../firebase-client");
const admin = require("../firebase-service");
const userEntity = require("../Entity/UserEntity");
const authRepository = require("../repository/authRepository");
const { sendResetPasswordEmail } = require("../nodemailer");
const { firebaseService } = require("./firebaseService");
const sharp = require("sharp");

const auth = getAuth(firebase);
const firebases = new firebaseService();

const MESSAGES = {
  SUCCESS: {
    REGISTRATION: "Registration successful! Verify your email.",
    LOGIN: "Login successful!",
    ADMIN_LOGIN: "Admin login successful!",
    LOGOUT: "Signed out successfully!",
    PROFILE_UPDATE: "Profile updated!",
    USER_DATA: "User data retrieved.",
    USERS: "All users retrieved.",
    LIMIT_RESET: "Daily OCR limit reset.",
    PASSWORD_RESET: "Password reset link sent.",
    USER_DELETED: "User deleted successfully.",
  },
  ERROR: {
    MISSING_FIELDS: "All fields are required.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    EMAIL_NOT_VERIFIED: "Please verify your email.",
    USER_NOT_FOUND: "User not found.",
    ACCESS_DENIED: "Admin access required.",
    NOT_AUTHENTICATED: "Please sign in.",
    UPLOAD_FAILED: "Failed to upload image.",
    NO_CHANGES: "No changes to update.",
    INVALID_EMAIL: "Invalid email format.",
    PASSWORD_MISMATCH: "Passwords do not match.",
    WEAK_PASSWORD: "Password too short (min 6 characters).",
    EMAIL_IN_USE: "Email already in use.",
    INVALID_GOOGLE_DATA: "Invalid Google user data.",
    GENERAL: "Something went wrong.",
  },
};

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password?.length >= 6;

const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error("Verification email failed:", error);
    throw new Error(MESSAGES.ERROR.GENERAL);
  }
};

class AuthService {
  async signUp(email, password, confirmPassword, photo) {
    try {
      if (!email || !password || !confirmPassword) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.MISSING_FIELDS };
      if (!validateEmail(email)) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };
      if (!validatePassword(password)) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.WEAK_PASSWORD };
      if (password !== confirmPassword) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.PASSWORD_MISMATCH };

      const existingUser = await authRepository.getUserByEmail(email);
      if (existingUser) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.EMAIL_IN_USE };

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendVerificationEmail(user);

      const userData = new userEntity({
        userId: user.uid,
        email,
        foto: photo || null,
        currencyChoice: "IDR",
        limitOCR: { limit: 3, used: 0, resetDate: new Date() },
      });

      await authRepository.createUser(userData);

      return { status: STATUS_CODES.ACCEPTED, message: MESSAGES.SUCCESS.REGISTRATION, data: { userId: user.uid, email } };
    } catch (error) {
      console.error("Sign-up error:", error);
      if (error.code === "auth/email-already-in-use") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.EMAIL_IN_USE };
      if (error.code === "auth/invalid-email") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };
      if (error.code === "auth/weak-password") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.WEAK_PASSWORD };
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async signIn(email, password) {
    try {
      if (!email || !password) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.MISSING_FIELDS };
      if (!validateEmail(email)) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };

      const userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord.emailVerified) {
        await sendVerificationEmail(auth.currentUser);
        return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.EMAIL_NOT_VERIFIED };
      }

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLimitOCR(user.uid);

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.LOGIN, data: { userId: user.uid, email } };
    } catch (error) {
      console.error("Sign-in error:", error);
      if (error.code === "auth/user-not-found") return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };
      if (error.code === "auth/wrong-password") return { status: STATUS_CODES.UNAUTHORIZED, message: MESSAGES.ERROR.INVALID_CREDENTIALS };
      if (error.code === "auth/invalid-email") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async resetPassword(email) {
    try {
      if (!email) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.MISSING_FIELDS };
      if (!validateEmail(email)) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };

      await admin.auth().getUserByEmail(email); // Check if user exists
      await sendResetPasswordEmail(email);

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.PASSWORD_RESET };
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.code === "auth/user-not-found") return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };
      if (error.code === "auth/invalid-email") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async signInAdmin(email, password) {
    try {
      if (!email || !password) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.MISSING_FIELDS };
      if (!validateEmail(email)) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };

      const userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord.emailVerified) {
        await sendVerificationEmail(auth.currentUser);
        return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.EMAIL_NOT_VERIFIED };
      }

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userData = await authRepository.getUserById(user.uid);
      if (!userData || userData.role !== "admin") return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.ACCESS_DENIED };

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.ADMIN_LOGIN, data: { userId: user.uid, email, role: userData.role } };
    } catch (error) {
      console.error("Admin sign-in error:", error);
      if (error.code === "auth/user-not-found") return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };
      if (error.code === "auth/wrong-password") return { status: STATUS_CODES.UNAUTHORIZED, message: MESSAGES.ERROR.INVALID_CREDENTIALS };
      if (error.code === "auth/invalid-email") return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_EMAIL };
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async signInWithGoogle(user) {
    try {
      if (!user?.email || !user?.uid) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_GOOGLE_DATA };

      const userData = await authRepository.getUserByEmail(user.email);
      if (!userData) return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };

      await this.updateLimitOCR(user.uid);

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.LOGIN, data: { userId: user.uid, email: user.email } };
    } catch (error) {
      console.error("Google sign-in error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async registerWithGoogle(user) {
    try {
      if (!user?.email || !user?.uid) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_GOOGLE_DATA };

      const existingUser = await authRepository.getUserByEmail(user.email);
      if (existingUser) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.EMAIL_IN_USE };

      const userData = new userEntity({
        userId: user.uid,
        email: user.email,
        username: user.displayName || "User",
        foto: user.photoURL || null,
        currencyChoice: "IDR",
        limitOCR: { limit: 3, used: 0, resetDate: new Date() },
      });

      await authRepository.createUser(userData);

      return { status: STATUS_CODES.CREATED, message: MESSAGES.SUCCESS.REGISTRATION, data: { userId: user.uid, email: user.email } };
    } catch (error) {
      console.error("Google registration error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async signOut() {
    try {
      if (!auth.currentUser) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.NOT_AUTHENTICATED };
      await signOut(auth);
      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.LOGOUT };
    } catch (error) {
      console.error("Sign-out error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async updateProfile(user, username, photo, currencyChoice, no_hp) {
    try {
      if (!user?.uid) return { status: STATUS_CODES.UNAUTHORIZED, message: MESSAGES.ERROR.NOT_AUTHENTICATED };

      let photoUrl = null;
      if (photo) {
        const buffer = Buffer.from(photo);
        const compressedImage = await sharp(buffer).jpeg({ quality: 70 }).resize(300, 300, { fit: "cover" }).toBuffer();
        photoUrl = await firebases.uploadImageToFirebase(compressedImage, {
          fileName: `profile/${user.uid}-${Date.now()}.jpg`,
          mimetype: "image/jpeg",
        });
        if (!photoUrl) return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.UPLOAD_FAILED };
      }

      const updatedUser = new userEntity({ userId: user.uid, email: user.email, username, foto: photoUrl, currencyChoice, no_hp });
      const filledFields = updatedUser.getFilledFields();
      if (!Object.keys(filledFields).length) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.NO_CHANGES };

      await authRepository.updateUser(user.uid, filledFields);

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.PROFILE_UPDATE, data: filledFields };
    } catch (error) {
      console.error("Profile update error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async signInGoogleAdmin(user) {
    try {
      if (!user?.email || !user?.uid) return { status: STATUS_CODES.BAD_REQUEST, message: MESSAGES.ERROR.INVALID_GOOGLE_DATA };

      const userData = await authRepository.getUserByEmail(user.email);
      if (!userData) return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };
      if (userData.role !== "admin") return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.ACCESS_DENIED };

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.ADMIN_LOGIN, data: { userId: user.uid, email: user.email, role: userData.role } };
    } catch (error) {
      console.error("Google admin sign-in error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async getUserData(userId) {
    try {
      if (!userId) return { status: STATUS_CODES.BAD_REQUEST, message: "User ID required." };
      const user = await authRepository.getUserById(userId);
      if (!user) return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };
      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.USER_DATA, data: user };
    } catch (error) {
      console.error("Get user error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async getAllUsers(user) {
    try {
      if (!user?.uid) return { status: STATUS_CODES.UNAUTHORIZED, message: MESSAGES.ERROR.NOT_AUTHENTICATED };

      const adminUser = await authRepository.getUserById(user.uid);
      if (!adminUser || adminUser.role !== "admin") return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.ACCESS_DENIED };

      const users = await authRepository.getAllUsers();
      if (!users?.length) return { status: STATUS_CODES.NOT_FOUND, message: "No users found." };

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.USERS, data: { users, totalCount: users.length } };
    } catch (error) {
      console.error("Get all users error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async deleteUserbyAdmin(id, user) {
    try {
      if (!user?.uid) return { status: STATUS_CODES.UNAUTHORIZED, message: MESSAGES.ERROR.NOT_AUTHENTICATED };
      if (!id) return { status: STATUS_CODES.BAD_REQUEST, message: "User ID required." };

      const adminUser = await authRepository.getUserById(user.uid);
      if (!adminUser || adminUser.role !== "admin") return { status: STATUS_CODES.FORBIDDEN, message: MESSAGES.ERROR.ACCESS_DENIED };

      const deletedUser = await authRepository.deleteUser(id);
      if (!deletedUser) return { status: STATUS_CODES.NOT_FOUND, message: MESSAGES.ERROR.USER_NOT_FOUND };

      return { status: STATUS_CODES.OK, message: MESSAGES.SUCCESS.USER_DELETED, data: deletedUser };
    } catch (error) {
      console.error("Delete user error:", error);
      return { status: STATUS_CODES.SERVER_ERROR, message: MESSAGES.ERROR.GENERAL };
    }
  }

  async updateLimitOCR(userId) {
    try {
      if (!userId) throw new Error("User ID required.");
      const user = await authRepository.getUserById(userId);
      if (!user) throw new Error("User not found.");

      let limitOCR = user.limitOCR || { limit: 3, used: 0, resetDate: new Date() };
      const now = new Date();

      if (!limitOCR.resetDate || now > new Date(limitOCR.resetDate)) {
        limitOCR = { ...limitOCR, used: 0, resetDate: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
        await authRepository.updateUser(userId, { limitOCR });
      }

      return {
        status: STATUS_CODES.OK,
        message: limitOCR.used === 0 ? MESSAGES.SUCCESS.LIMIT_RESET : "OCR limit checked.",
        data: { limit: limitOCR.limit, used: limitOCR.used, remaining: limitOCR.limit - limitOCR.used, resetDate: limitOCR.resetDate },
      };
    } catch (error) {
      console.error("OCR limit error:", error);
      throw new Error(MESSAGES.ERROR.GENERAL);
    }
  }
}

module.exports = new AuthService();