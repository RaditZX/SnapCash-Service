const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification } = require("firebase/auth");
const firebase = require("../firebase-client");
const admin = require("../firebase-service");
const userEntity = require("../Entity/UserEntity");
const authRepository = require("../repository/authRepository");

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
  
  async signUp(email, password, username, photo) {
    try {
      if (!email || !password || !username) {
        throw new Error("Email, password, and username are required");
      }

      const user = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerificationLink(email);

      const userEntityInstance = new userEntity({
        userId: user.user.uid,
        email,
        username,
        foto: photo
      });

      await authRepository.createUser(userEntityInstance);

      return {
        status: 202,
        message: "Verification email sent. Please verify your email before logging in."
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const isEmailVerified = await getUserVerificationStatusByEmail(email);

      if (isEmailVerified) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
          status: 200,
          data: { userCredential },
          message: "Login Successful"
        };
      } else {
        await sendEmailVerificationLink();
        return {
          status: 403,
          message: "Please verify your email before logging in. We have resent the verification email."
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
        return{
          status: 404,
          message: "Akun Tidak Terdeteksi, silahkan "
        }
      }
      return {
        status: 200,
        data: { user },
        message: "Login Successful"
      };
    } catch (error) {
      console.error(error);
      throw new Error("Login failed");
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
        });
  
        await authRepository.createUser(userEntityInstance);
      }
  
      // Return successful response
      return {
        status: 200,
        data: { user },
        message: "Registration successful"
      };
      
    } catch (error) {
      console.error("Registration failed:", error); // Improved error logging
  
      // Provide specific error message and return status 500
      return {
        status: 500,
        message: `Registration failed: ${error.message || error}`
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


  async updateProfile(userId, email, username, photo, currencyChoice, no_hp) {
    try {
      const user = await authRepository.getUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = new userEntity({
        userId,
        email,
        username,
        foto: photo,
        currencyChoice,
        no_hp
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
      return { status: 200, message: "Profile updated successfully" };
    } catch (error) {
      console.error(error);
      throw error;
    } 
  }
}

module.exports = new AuthService();
