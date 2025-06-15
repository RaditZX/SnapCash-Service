const AuthService = require("../service/authService");

class AuthController {
  async signUp(req, res) {
    try {
      const { email, password, username, photo } = req.body;
      const result = await AuthService.signUp(email, password, username, photo);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async signIn(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.signIn(email, password);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async signInAdmin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.signInAdmin(email, password);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async signOut(req, res) {
    try {
      const result = await AuthService.signOut();
      res.status(result.status).json({ message: result.message });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async signInWithGoogle(req, res) {
    try {
      const user = req.user; // From verifyFirebaseToken middleware
      const result = await AuthService.signInWithGoogle(user);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async signInWithGoogleAdmin(req, res) {
    try {
      const user = req.user; // From verifyFirebaseToken middleware
      const result = await AuthService.signInWithGoogleAdmin(user);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async registerWithGoogle(req, res) {
    try {
      const user = req.user; // From verifyFirebaseToken middleware
      const result = await AuthService.registerWithGoogle(user);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async getAllUsers(req, res) {
    try {
      const user = req.user; // From verifyFirebaseToken middleware
      const result = await AuthService.getAllUsers(user);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = req.user; // From verifyFirebaseToken middleware
      const { username, currencyChoice, no_hp } = req.body;
      const photo = req.file ? req.file.buffer.toString("base64") : null;
      const result = await AuthService.updateProfile(user, username, photo, currencyChoice, no_hp);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }

  async getUserData(req, res) {
    try {
      const userId = req.user?.uid; // From verifyFirebaseToken middleware
      const result = await AuthService.getUserData(userId);
      res.status(result.status).json({ message: result.message, data: result.data });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message || "Server error" });
    }
  }
}

module.exports = new AuthController();