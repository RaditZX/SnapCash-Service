const authService = require("../service/authService");
const { sendResponse } = require("../response");

class AuthController {
  async signUp(req, res) {
    const { email, password, username, photo } = req.body;

    try {
      const result = await authService.signUp(email, password, username, photo);
      sendResponse(result.status, req.body, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(400, req.body, error.message, res, false);
    }
  }

  async signIn(req, res) {
    const { email, password } = req.body;

    try {
      const result = await authService.signIn(email, password);
      sendResponse(result.status, result.data, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(400, req.body, error.message, res, false);
    }
  }

  async signInWithGoogle(req, res) {
    try {
      const { user } = req;
      const result = await authService.signInWithGoogle(user);
      sendResponse(result.status, result.data, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(500, error, "Login failed", res, false);
    }
  }

  async registerWithGoogle(req, res) {
    try {
      const { user } = req;
      const result = await authService.registerWithGoogle(user);
      sendResponse(result.status, result.data, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(500, error, "Registration failed", res, false);
    }
  }

  async signOut(req, res) {
    try {
      const result = await authService.signOut();
      sendResponse(result.status, null, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(500, null, error.message, res, false);
    }
  }

  async updateProfile(req, res) {
    const { username, currencyChoice, no_hp } = req.body;
    const photo = req.file ? req.file.buffer : null;
    const { user } = req;

    try {
      console.log("User ID:", user.uid);
      const result = await authService.updateProfile(user,username, photo, currencyChoice, no_hp);
      sendResponse(result.status, result.data, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(400, req.body, error.message, res, false);
    }
  }


  async getUserData(req, res) {
    const { user } = req;

    try {
      const result = await authService.getUserData(user.uid);
      sendResponse(result.status, result.data, result.message, res, true);
    } catch (error) {
      console.error(error);
      sendResponse(400, req.body, error.message, res, false);
    }
  }


}

module.exports = new AuthController();
