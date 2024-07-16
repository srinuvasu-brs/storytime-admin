import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  sendEmailVerificationLink,
  sendPasswordResetLink,
} from "../utils/utils.js";
import SpotifyWebApi from "spotify-web-api-node";

// create a new user
const createUser = async (req, res, next) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    if (!first_name || !last_name || !email || !password) {
      const err = new Error(
        "Firstname, Lastname, Email and Password is required"
      );
      err.statusCode = 400;
      return next(err);
    }

    // check for valid email adress
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      const err = new Error("Invalid email address");
      return next(err);
    }

    // check for existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      const err = new Error(
        "User with this email already exists. Please use a differnt email address"
      );
      err.statusCode = 409;
      return next(err);
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    try {
      const verificationEmailResponse = await sendEmailVerificationLink(
        email,
        token,
        first_name
      );

      // send mail - handle err
      if (verificationEmailResponse.error) {
        const err = new Error(
          "Failed to send verification email, please try again later"
        );
        err.statusCode = 500;
        return next(err);
      }

      // save to DB
      const user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        verifyToken: token,
        verifyTokenExpires: Date.now() + 7200000,
      });
      // send mail success
      res
        .status(201)
        .send(
          "Registered successfully. Please check your mail to verify the account"
        );
    } catch (error) {
      return next(error);
    }

    // res.status(201).send("User registered successfully");
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    // Find user based on verification token
    const user = await User.findOne({ verifyToken: req.params.verifyToken });
    if (!user) {
      // If user not found
      return res.status(409).send("Invalid token.");
    } else if (user.verifyTokenExpires <= Date.now()) {
      if (!user.verified) {
        // Only delete the user if not already verified
        await user.deleteOne(); // Remove the user
        return res
          .status(409)
          .send("Verification link has expired. Register again.");
      } else {
        return res.status(400).send("Please login to continue.");
      }
    } else if (user.verified === true) {
      // If user is already verified
      return res.status(200).json("Email is already verified. Please Login.");
    } else {
      // If token is still valid, mark user as verified
      user.verified = true;
      await user.save();
      return res.status(201).json("Email is verified. Please Login.");
    }
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const err = new Error("Email & Password are required");
    err.statusCode = 400;
    return next(err);
  }
  // check for valid email adress
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    const err = new Error("Invalid email address");
    return next(err);
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 400;
      return next(err);
    }
    if (!user.verified) {
      const err = new Error(
        "Your account verification is pending. Please verify your email to continue"
      );
      err.statusCode = 409;
      return next(err);
    }

    // check for password match
    const passwordMatched = await bcrypt.compare(password, user.password);
    console.log(passwordMatched);
    if (!passwordMatched) {
      const err = new Error("Invalid email or password");
      err.statusCode = 400;
      return next(err);
    }

    // generate the token
    const token = jwt.sign(
      { userId: user._id, email },
      process.env.JWT_SECRET,
      {
        expiresIn: 2592000,
      }
    );
    user.token = token;
    await user.save();

    // generate spotify token
    const spotifyAPI = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const spotifyCredentials = await spotifyAPI.clientCredentialsGrant();
    const spotifyToken = spotifyCredentials.body;

    // our token exp time
    const expiresIn = 2592000;
    res.status(200).json({ token, spotifyToken, expiresIn });
  } catch (error) {
    return next(error);
  }
};

const generateSpotifyRefreshToken = async (req, res, next) => {
  try {
    // generate spotify token
    const spotifyAPI = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    const spotifyCredentials = await spotifyAPI.clientCredentialsGrant();
    const spotifyToken = spotifyCredentials.body;
    res.status(200).json({ spotifyToken });
  } catch (error) {
    const err = new Error("Something went wrong, please try again later");
    err.statusCode = 500;
    next(err);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    const profileData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      languages: user.languages,
    };

    res.status(200).json({ profileData });
  } catch (error) {
    return next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  const { first_name, last_name, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    if (first_name || last_name) {
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
    }

    if (email && email !== user.email) {
      const userExists = await User.findOne({ email });

      if (userExists) {
        const err = new Error(
          `${email} is already in use, please choose a different one`
        );
        err.statusCode = 409;
        return next(err);
      }
      user.email = email;
    }
    await user.save();
    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const updatePreferredLanguage = async (req, res, next) => {
  const { languageIds } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    user.languages = languageIds;
    await user.save();
    res
      .status(200)
      .json({ message: "Preferred language updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const updatePassword = async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    const err = new Error("Password is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Email not found");
      err.statusCode = 400;
      return next(err);
    }
    // generate token
    const token = jwt.sign(
      { userId: user._id, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );
    // save token in DB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 7200000;
    await user.save();
    // send mail
    const verificationEmailResponse = await sendPasswordResetLink(
      email,
      token,
      user.first_name
    );
    // handle err
    if (verificationEmailResponse.error) {
      const err = new Error(
        "Failed to send password reset link, please try again later"
      );
      err.statusCode = 500;
      return next(err);
    }
    res.status(200).json({
      message: "Password reset link sent successfully, please check your email",
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token) {
    const err = new Error("Token is required");
    err.statusCode = 400;
    return next(err);
  }
  if (!password) {
    const err = new Error("Password is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    // find the user by token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      const err = new Error(
        "Password reset link is invalid or expired, please try again"
      );
      err.statusCode = 400;
      return next(err);
    }
    // user found - hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    (user.password = hashedPassword), (user.resetPasswordToken = undefined);
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({
      message: "Password updated successfully, please login to continue",
    });
  } catch (error) {
    return next(error);
  }
};

const saveSpotifyStory = async (req, res, next) => {
  const { storyId } = req.body;
  if (!storyId) {
    const err = new Error("StoryId is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    if (user.saved_stories.includes(storyId)) {
      return res.status(409).json({ message: "Story already saved" });
    }
    // save story
    user.saved_stories.push(storyId);
    await user.save();
    res.status(200).json({ message: "Story saved successfully" });
  } catch (error) {
    return next(error);
  }
};

const removeSpotifyStory = async (req, res, next) => {
  const { storyId } = req.body;
  if (!storyId) {
    const err = new Error("StoryId is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    const index = user.saved_stories.indexOf(storyId);
    if (index === -1) {
      const err = new Error("Invalid storyId");
      err.statusCode = 404;
      return next(err);
    }
    user.saved_stories.splice(index, 1);
    await user.save();
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const getSpotifyStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }
    const stories = user.saved_stories;
    res.status(200).json({ stories });
  } catch (error) {
    return next(error);
  }
};

export {
  createUser,
  verifyEmail,
  loginUser,
  generateSpotifyRefreshToken,
  getUserProfile,
  updateUserProfile,
  updatePreferredLanguage,
  updatePassword,
  forgotPassword,
  resetPassword,
  saveSpotifyStory,
  removeSpotifyStory,
  getSpotifyStories
};
