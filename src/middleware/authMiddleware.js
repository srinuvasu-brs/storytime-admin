import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import expressAsyncHandler from "express-async-handler";

const checkToken = expressAsyncHandler(async (req, res, next) => {
  let token;

  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    token = authorizationHeader.split(" ")[1];
    console.log(token);

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decodedToken);
      req.user = await User.findById(decodedToken.userId);
      console.log(req.user);
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Invalid token");
    }

  } else {
    res.status(401);
    throw new Error("Unauthorized");
  }
});

const checkAuthenticated = (req, res, next) => {
  // if (req.headers.host == "localhost:5000") { return next() }
  if (req.isAuthenticated()) { return next() }
  res.redirect("/admin/login")
}

export { checkToken, checkAuthenticated };
