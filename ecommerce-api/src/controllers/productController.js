import Product from "../models/product.js";
import Category from "../models/category.js";

// Helper function to find or create category by name
async function findOrCreateCategory(categoryName) {
  let category = await Category.findOne({ name: categoryName });
  if (!category) {
    category = await Category.create({
      name: categoryName,
      description: `Categoría para ${categoryName}`
    });
  }
  return category._id;
}

async function getProducts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Cambiar de 10 a 100 por defecto
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("category")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const totalResults = await Product.countDocuments();
    const totalPages = Math.ceil(totalResults / limit);
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Productos no encontrados" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function getProductByCategory(req, res, next) {
  try {
    const id = req.params.idCategory;
    const products = await Product.find({ category: id })
      .populate("category")
      .sort({ name: 1 });
    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No productos encontrados en esta categoria" });
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error });
  }
}

async function createProduct(req, res, next) {
  try {
    console.log('Creando producto con datos:', req.body);
    const { name, description, price, stock, imagesUrl, category } = req.body;

    if (!name || !description || !price || !stock || !imagesUrl || !category) {
      console.log('Campos requeridos faltantes:', { name, description, price, stock, imagesUrl, category });
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Convert imagesUrl to array if it's a string
    const imagesArray = Array.isArray(imagesUrl) ? imagesUrl : [imagesUrl];
    console.log('Array de imágenes:', imagesArray);

    // Find or create category and get its ObjectId
    const categoryId = await findOrCreateCategory(category);
    console.log('ID de categoría:', categoryId);

    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
      imagesUrl: imagesArray,
      category: categoryId,
    });
    
    console.log('Producto creado exitosamente:', newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = req.params.id;
    const { name, description, price, stock, imagesUrl, category } = req.body;

    if (!name || !description || !price || !stock || !imagesUrl || !category) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Convert imagesUrl to array if it's a string
    const imagesArray = Array.isArray(imagesUrl) ? imagesUrl : [imagesUrl];

    // Find or create category and get its ObjectId
    const categoryId = await findOrCreateCategory(category);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, price, stock, imagesUrl: imagesArray, category: categoryId },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function searchProducts(req, res, next) {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    let filters = {};

    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === "true") {
      filters.stock = { $gt: 0 };
    }

    let sortOptions = {};

    if (sort) {
      const sortOrder = order === "desc" ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions.name = 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .populate("category")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalResults = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

export {
  getProducts,
  getProductById,
  getProductByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
};
