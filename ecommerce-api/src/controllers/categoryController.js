import Category from "../models/category.js";

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const newCategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().populate("name").sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const category = await Category.findById(req.params.id).populate("name");
    if (!category) {
      return res.status(404).json({ message: "Categoria no encontrada" });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const idCategory = req.params.id;

    const updatedCategory = await Category.findByIdAndUpdate(
      idCategory,
      { name, description },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Categoria no encontrada" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const idCategory = req.params.id;
    const deletedCategory = await Category.findByIdAndDelete(idCategory);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Categoria no encontrada" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
