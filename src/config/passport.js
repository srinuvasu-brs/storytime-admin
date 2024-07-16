import bcrypt from "bcrypt";
import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from "../models/userModel.js";

passport.use(new LocalStrategy({usernameField:"email", passwordField:"password"}, async function verify(email, password, cb) {
    const admin = await User.findOne({ email, isAdmin: true });
    console.log('admin')
    console.log(admin)
    if (!admin) {
        return cb(null, false, { message: 'Incorrect Email or password' });
    }
    bcrypt.compare(password.toString(), admin.password?.toString(), function(err, res) {
        if (err) { console.log(err);return cb(err); }
        if (!res) { return cb(null, false, { message: 'Incorrect email or password' }); }
        return cb(null, admin);
    });
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user._id, email: user.email, username: `${user.first_name} ${user.last_name}` });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

export default passport;