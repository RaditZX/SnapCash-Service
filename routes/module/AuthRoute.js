const AuthController = require("../../Controller/userController");
const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = (router) => {
    // Sign up a new user
    router.post("/signup", AuthController.signUp);
    
    // Sign in an existing user
    router.post("/signin", AuthController.signIn);
    router.post("/signinAdmin", AuthController.signInAdmin);
    
    // Sign out the current user
    router.post("/signout", AuthController.signOut);

    // Sign in with Google
    router.post("/signinWithGoogle", verifyFirebaseToken, AuthController.signInWithGoogle);
    router.post("/signinWithGoogleAdmin", verifyFirebaseToken, AuthController.signInWithGoogleAdmin);
    // Register with Google
    router.post("/registerWithGoogle", verifyFirebaseToken, AuthController.registerWithGoogle);
    router.get("/getAllUsers", verifyFirebaseToken, AuthController.getAllUsers);
    router.put("/updateProfile",upload.single('photo'), verifyFirebaseToken, AuthController.updateProfile);
    router.get("/getUser", verifyFirebaseToken, AuthController.getUserData);
    
}
