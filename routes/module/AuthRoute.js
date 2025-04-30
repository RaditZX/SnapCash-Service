const AuthController = require("../../Controller/userController");
const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");

module.exports = (router) => {
    // Sign up a new user
    router.post("/signup", AuthController.signUp);
    
    // Sign in an existing user
    router.post("/signin", AuthController.signIn);
    
    // Sign out the current user
    router.post("/signout", AuthController.signOut);

    // Sign in with Google
    router.post("/signinWithGoogle", verifyFirebaseToken, AuthController.signInWithGoogle);
    // Register with Google
    router.post("/registerWithGoogle", verifyFirebaseToken, AuthController.registerWithGoogle);
    
}
