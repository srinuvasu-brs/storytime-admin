import Category from "../models/categoryModel.js";

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).send(categories);
  } catch (error) {
    return next(err);
  }
};

export { getCategories };
