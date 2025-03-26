const AuthService = require("../../service/authService");

module.exports = (router) => {
    // Sign up a new user
    router.post("/signup", AuthService.signUp);
    
    // Sign in an existing user
    router.post("/signin", AuthService.signIn);
    
    // Sign out the current user
    router.post("/signout", AuthService.signOut);
    
}
