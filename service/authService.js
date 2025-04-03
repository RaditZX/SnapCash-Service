const firebase = require("../firebase-client");
const admin = require("../firebase-service");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} = require("firebase/auth");
const auth = getAuth(firebase);
const { sendResponse } = require("../response");
const { authRepository } = require("../repository/authRepository");


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
  constructor() {
    this.auth = getAuth(firebase);
    this.repository = authRepository;
  }
  // Sign up a new user
  signUp = async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return sendResponse(400, req.body, "Email and password are required", res);
      }

      const user = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerificationLink(email);

      this.repository.createUser({userId: user.user.uid, email});

      sendResponse(
        202,
        req.body,
        "Verification email sent. Please verify your email before logging in.",
        res,
        true
      );
    } catch (error) {
      console.error(error);
      const errorMessages = {
        "auth/email-already-in-use": "Email already exists",
        "auth/invalid-email": "Invalid email address",
        "auth/weak-password": "Password should be at least 6 characters",
      };
      const errorMessage = errorMessages[error.code] || error.message || "Sign up failed";
      sendResponse(400, req.body, errorMessage, res, false);
    }
  };

  // Sign in an existing user
  signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return sendResponse(400, req.body, "Email and password are required", res);
      }

      const isEmailVerified = await getUserVerificationStatusByEmail(email);

      if (isEmailVerified) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sendResponse(200, { userCredential }, "Login Successful", res);
      } else {
        await sendEmailVerificationLink();
        sendResponse(
          403,
          null,
          "Please verify your email before logging in. We have resent the verification email.",
          res,
          true
        );
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.code === "auth/user-not-found" || error.code === "auth/invalid-credential"
          ? "Incorrect email or password"
          : "Login failed";
      sendResponse(500, error, errorMessage, res, false);
    }
  };

  // Sign out the current user
  signOut = async (req, res) => {
    try {
      const user = auth.currentUser;

      if (user) {
        await signOut(auth);
        sendResponse(200, null, "Sign out successfully", res, true);
      } else {
        sendResponse(401, null, "User is not authenticated", res, false);
      }
    } catch (error) {
      console.error(error);
      sendResponse(500, null, "Sign out failed", res, false);
    }
  };
}

module.exports = new AuthService();