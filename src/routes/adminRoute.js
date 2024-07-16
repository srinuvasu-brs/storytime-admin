import express from "express";
import passport from '../config/passport.js';
import {
  login,
  userList,
  dashboard,
  languages,
  categories,
  editUser,
  deleteUser,
  updateLanguage,
  deleteLanguage,
  createLanguages,
  createCategories,
  updateCategory,
  deleteCategory,
  getUserLibraries,
  generateSpotifyRefreshToken,
  updateCount,
  logout
} from "../controllers/adminController.js";
import { checkAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", passport.authenticate('local', {
  successReturnToOrRedirect: '/admin',
  failureRedirect: '/admin/login',
  failureMessage: true
}));

router.get("/login", login);
router.get("/", checkAuthenticated, dashboard);
router.get("/users", checkAuthenticated, userList);
router.get("/users/:id/edit", checkAuthenticated, editUser);
router.get("/categories", checkAuthenticated, categories);
router.delete("/users/:id/destroy", checkAuthenticated, deleteUser);
router.get("/languages", checkAuthenticated, languages);
router.post("/languages/create", checkAuthenticated, createLanguages);
router.put("/languages/:id/update", checkAuthenticated, updateLanguage);
router.delete("/languages/:id/destroy", checkAuthenticated, deleteLanguage);
router.post("/categories/create", checkAuthenticated, createCategories);
router.put("/categories/:id/update", checkAuthenticated, updateCategory);
router.delete("/categories/:id/destroy", checkAuthenticated, deleteCategory);
router.get("/refreshtoken", generateSpotifyRefreshToken);
router.get("/users/:id/libraries", checkAuthenticated, getUserLibraries);
router.get("/count", updateCount);
router.post("/logout", checkAuthenticated, logout);
export default router;
