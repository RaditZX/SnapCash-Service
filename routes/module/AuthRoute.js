const AuthService = require("../../service/authService");
const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");

module.exports = (router) => {
    // Sign up a new user
    router.post("/signup", AuthService.signUp);
    
    // Sign in an existing user
    router.post("/signin", AuthService.signIn);
    
    // Sign out the current user
    router.post("/signout", AuthService.signOut);

    // Sign in with Google
    router.post("/signinWithGoogle", verifyFirebaseToken, AuthService.signInWithGoogle);
    // Register with Google
    router.post("/registerWithGoogle", verifyFirebaseToken, AuthService.registerWithGoogle);
    
}
