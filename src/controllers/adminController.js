import User from "../models/userModel.js";
import Language from "../models/languageModel.js";
import Category from "../models/categoryModel.js";
import WeeklyCount from "../models/weeklyCountModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  sendEmailVerificationLink,
  sendPasswordResetLink,
} from "../utils/utils.js";
import SpotifyWebApi from "spotify-web-api-node";
import fetch from 'node-fetch';
import path from 'path';


const dashboard = async (req, res, next) => {
  const users_count = await User.countDocuments({ isAdmin: { $ne: true } });
  const languages_count = await Language.countDocuments();
  const categories_count = await Category.countDocuments();
  const weekly_count = await WeeklyCount.findOne().sort({updated_at: -1});
  const category = await Category.find();
  const updatedDate = new Date(weekly_count.updated_at)
  const date = `${updatedDate.getDate()}/${updatedDate.getMonth() + 1}/${updatedDate.getFullYear()}`
  res.render('dashboard', { title: 'Dashboard', users_count, languages_count, categories_count, category, date, weekly_count});
};

const login = (req, res) => {
  if (req.isAuthenticated()) { res.redirect('/admin') }
  res.render('login', { title: 'Login' });
}

// User list
const userList = async (req, res, next) => {
  const users = await User.find({ isAdmin: { $ne: true } });
  res.render('users', { users: users });
};

// Edit User
const editUser = async (req, res, next) => {
  const user = await User.find({ _id: req.params.id, isAdmin: { $ne: true } });
  res.render('user', { user: user[0] });
};

// Update User
const updateUser = async (req, res, next) => {
  const user = await User.find({ _id: req.params.id, isAdmin: { $ne: true } });
  res.redirect('/admin/users');
};

// Destroy User
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.deleteOne({ _id: req.params.id, isAdmin: { $ne: true } });
    return res.status(200).json({ message: "User deleted successfully", success: true });
  } catch(e){
    console.log(e)
    return res.status(400).json({ message: "Something went wrong. Please try later", success: false });
  }
};

// Languages list
const languages = async (req, res, next) => {
  const languages = await Language.find();
  res.render('languages', { languages: languages });
};

// Categories list
const categories = async (req, res, next) => {
  const categories = await Category.find();
  const headers = {
    headers: {
      "Authorization": `Bearer ${req.app.locals.spotifyToken}`
    }
  }
  let cat_data = [];
  let categories_with_authors = await Promise.all(categories.map(async(e, i) => {
    let data = {...e._doc}
    const sdata = await fetch(`https://api.spotify.com/v1/search?query=Telugu+Tamil+English+Hindi+${e.keywords.split(' ').join('+')}&type=show&include_external=audio&market=IN&locale=en-US%2Cen%3Bq%3D0.9&offset=0&limit=50`, headers);
    const edata = await sdata.json()
    const author_count = edata.shows.items.map((e) => {return {author: e?.publisher, count: e?.total_episodes}})//.filter((a) => a?.publisher !== undefined)
    data = {...data, authors: author_count}
    return data;
  }))
  res.render('categories', { categories: categories_with_authors });
};

const updateLanguage = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const languages = await Language.find({"name": name, "_id": {"$ne": req.params.id}});
    if (languages.length) { return res.status(400).json({ message: "Name already exists", success: false }); }
    const language_code = await Language.find({"code": code, "_id": {"$ne": req.params.id}});
    if (language_code.length) { return res.status(400).json({ message: "Code already exists", success: false }); }
    const language = await Language.findOneAndUpdate({_id: req.params.id}, {name: name, code: code});
    return res.status(200).json({ message: "Language updated successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
  }
};

const deleteLanguage = async (req, res, next) => {
  try {
    const user = await Language.deleteOne({ _id: req.params.id });
    return res.status(200).json({ message: "Language deleted successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
  }
};

const createLanguages = async (req, res, next) => {
  const { name, code } = req.body;
  try {
    const languages = await Language.find({"name": name});
    if (languages.length) { return res.status(400).json({ message: "Name already exists", success: false }); }
    const language_code = await Language.find({"code": code});
    if (language_code.length) { return res.status(400).json({ message: "Code already exists", success: false }); }
    await Language.create({ name: name, code: code });
    return res.status(200).json({ message: "Language added successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { category, keywords } = req.body;
    const categories = await Category.find({"category": category, "_id": {"$ne": req.params.id}});
    if (categories.length) { return res.status(400).json({ message: "Category already exists", success: false }); }
    const language = await Category.findOneAndUpdate({_id: req.params.id}, {category: category, keywords: keywords});
    return res.status(200).json({ message: "Category updated successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await Category.deleteOne({ _id: req.params.id });
    return res.status(200).json({ message: "Category deleted successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
  }
};

const createCategories = async (req, res, next) => {
  const { category, keywords } = req.body;
  try {
    const categories = await Category.find({"category": category});
    if (categories.length) { return res.status(400).json({ message: "Category already exists", success: false }); }
    await Category.create({ category: category, keywords: keywords });
    return res.status(200).json({ message: "Category added successfully", success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Something went wrong. Try later", success: false });
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
    return res.status(200).json({ token: spotifyToken, success: true });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error, success: false });
  }
};

const getUserLibraries = async (req, res, next) => {
  try {
    const users = await User.findOne({ _id: req.params.id });
    const headers = {
      headers: {
        "Authorization": `Bearer ${req.app.locals.spotifyToken}`
      }
    }
    const data = await fetch(`https://api.spotify.com/v1/shows?ids=${users.saved_stories}&market=IN`, headers);
    let d = await data.json()
    if (d.error?.status) { return res.status(400).json({ message: d.error?.message, success: false })};
    return res.status(200).json({ data: d, success: true, name: users.first_name })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error, success: false });
  }
};

const updateCount = async (req, res, next) => {
  try {
    const headers = {
      headers: {
        "Authorization": `Bearer ${req.app.locals.spotifyToken}`
      }
    }
    const categories = await Category.find().select('keywords');
    let offset = 0;
    let ctotal_shows = 0;
    let shows = [];
    await Promise.all(categories.map(async(category) => {
      let keyword = category.keywords.replaceAll(' ', '+');
      let data = await fetch(`https://api.spotify.com/v1/search?q=${keyword}&type=show,episode&market=IN&limit=50&offset=0&include_external=audio`, headers);
        let author_data = await data.json();
        if(author_data.error) { throw author_data.error}
        let total_shows = author_data.shows.total;
        let asdf = await Category.findOneAndUpdate({keywords: category.keywords}, {count: total_shows, updated_at: new Date()});
    }))
    do {
    let data = await fetch(`https://api.spotify.com/v1/browse/categories?locale=en-US%2Cen%3Bq%3D0.9&limit=50&offset=${offset}`, headers);
      let author_data = await data.json();
      if(author_data.error) { throw author_data.error}
      ctotal_shows = author_data.categories.total;
      offset += 50;
      shows.push(author_data.categories?.items?.map(e => e?.name)?.filter(e => e))
    }
    while(offset < ctotal_shows)
    let final_shows = [...new Set(shows.flat(3))].length;
    await WeeklyCount.findOneAndUpdate({}, {categories: final_shows, updated_at: new Date()}, {upsert: true});
    const all_authors = await getAuthors(headers);
    return res.status(200).json({ data: {authors: all_authors, categories: final_shows}, success: true })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: error, success: false });
  }
};

const getAuthors = async (headers) => {
    let offset = 0;
    let ctotal_shows = 0;
    const categories = await Category.find().select('keywords');
    const all_cat = categories.map(e => e.keywords).join(' ').replaceAll(' ', '+');
    let shows = [];
    do {
      let cdata = await fetch(`https://api.spotify.com/v1/search?q=${all_cat}&type=show,episode&market=IN&limit=50&offset=${offset}&include_external=audio`, headers);
      let cauthor_data = await cdata.json();
      ctotal_shows = cauthor_data.shows.total;
      offset += 50;
      console.log(offset, ctotal_shows)
      shows.push(cauthor_data.shows)
    }
    while(offset < ctotal_shows)
    let all_authors = shows.map(e => e.items.map(i => i?.publisher).filter(n => n)).flat(3)
    let final_authors = [...new Set(all_authors)];
    await WeeklyCount.findOneAndUpdate({}, {authors: final_authors.length, updated_at: new Date()}, {upsert: true});
    return final_authors.length;
}

const logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
}

export {
  userList,
  languages,
  categories,
  dashboard,
  editUser,
  updateUser,
  deleteUser,
  updateLanguage,
  login,
  deleteLanguage,
  createLanguages,
  createCategories,
  updateCategory,
  deleteCategory,
  generateSpotifyRefreshToken,
  getUserLibraries,
  updateCount,
  logout
};
