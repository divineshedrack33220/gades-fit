// models/Product.js
const { getDB, DatabaseError } = require('../config/db');

/**
 * Product Model
 * Handles product data operations with validation
 */
class Product {
  /**
   * Get the products collection
   */
  static async collection() {
    const db = getDB();
    return db.collection('products');
  }

  /**
   * Validate product data
   * @throws {Error} If validation fails
   */
  static validate(productData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || productData.name !== undefined) {
      if (!productData.name || typeof productData.name !== 'string' || productData.name.trim().length < 2) {
        errors.push('Product name must be at least 2 characters');
      }
    }

    if (!isUpdate || productData.price !== undefined) {
      const price = parseFloat(productData.price);
      if (isNaN(price) || price < 0) {
        errors.push('Price must be a positive number');
      }
    }

    if (!isUpdate || productData.category !== undefined) {
      const validCategories = ['Classy', 'Modern', 'Comfy', 'Accessories'];
      if (productData.category && !validCategories.includes(productData.category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }

    if (!isUpdate || productData.comfyRating !== undefined) {
      const rating = parseInt(productData.comfyRating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        errors.push('Comfy rating must be between 1 and 5');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    return true;
  }

  /**
   * Sanitize product data
   */
  static sanitize(productData) {
    const sanitized = { ...productData };

    if (sanitized.name) {
      sanitized.name = sanitized.name.trim().replace(/[<>]/g, '');
    }

    if (sanitized.description) {
      sanitized.description = sanitized.description.trim().replace(/[<>]/g, '');
    }

    if (sanitized.category) {
      sanitized.category = sanitized.category.trim();
    }

    if (sanitized.price) {
      sanitized.price = parseFloat(sanitized.price) || 0;
    }

    if (sanitized.comfyRating) {
      sanitized.comfyRating = parseInt(sanitized.comfyRating) || 5;
    }

    // Sanitize arrays
    ['colors', 'sizes', 'tags'].forEach(field => {
      if (Array.isArray(sanitized[field])) {
        sanitized[field] = sanitized[field]
          .map(item => String(item).trim().replace(/[<>]/g, ''))
          .filter(item => item.length > 0);
      }
    });

    return sanitized;
  }

  /**
   * Find all products
   */
  static async findAll(filter = {}) {
    try {
      const collection = await this.collection();
      const result = await collection.find(filter).sort({ createdAt: -1 }).toArray();
      return result || [];
    } catch (error) {
      console.error('Product.findAll error:', error);
      throw new DatabaseError(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Find product by ID
   */
  static async findById(id) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const collection = await this.collection();
      let query;
      
      try {
        const { ObjectId } = require('mongodb');
        query = { _id: new ObjectId(id) };
      } catch (e) {
        query = { _id: id };
      }

      const product = await collection.findOne(query);
      
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      console.error('Product.findById error:', error);
      throw new DatabaseError(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Find products by category
   */
  static async findByCategory(category) {
    try {
      if (!category) {
        throw new Error('Category is required');
      }
      return await this.findAll({ category });
    } catch (error) {
      console.error('Product.findByCategory error:', error);
      throw new DatabaseError(`Failed to fetch products by category: ${error.message}`);
    }
  }

  /**
   * Find products with pagination
   */
  static async findPaginated({ page = 1, limit = 12, category = null, sort = 'createdAt', order = -1 }) {
    try {
      const collection = await this.collection();
      const query = category ? { category } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const [items, total] = await Promise.all([
        collection.find(query)
          .sort({ [sort]: order === -1 ? -1 : 1 })
          .skip(skip)
          .limit(limitNum)
          .toArray(),
        collection.countDocuments(query)
      ]);

      return {
        items: items || [],
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      console.error('Product.findPaginated error:', error);
      throw new DatabaseError(`Failed to fetch paginated products: ${error.message}`);
    }
  }

  /**
   * Create a new product
   */
  static async create(productData) {
    try {
      // Sanitize and validate
      const sanitized = this.sanitize(productData);
      this.validate(sanitized);

      const collection = await this.collection();
      const product = {
        ...sanitized,
        price: parseFloat(sanitized.price) || 0,
        comfyRating: parseInt(sanitized.comfyRating) || 5,
        inStock: sanitized.inStock === 'on' || sanitized.inStock === true,
        featured: sanitized.featured === 'on' || sanitized.featured === true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(product);
      return { ...product, _id: result.insertedId || result._id };
    } catch (error) {
      console.error('Product.create error:', error);
      if (error.message.includes('Validation failed')) {
        throw error; // Re-throw validation errors
      }
      throw new DatabaseError(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Update a product
   */
  static async update(id, updateData) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      // Sanitize and validate
      const sanitized = this.sanitize(updateData);
      this.validate(sanitized, true);

      const collection = await this.collection();
      const update = {
        ...sanitized,
        price: parseFloat(sanitized.price) || 0,
        comfyRating: parseInt(sanitized.comfyRating) || 5,
        inStock: sanitized.inStock === 'on' || sanitized.inStock === true,
        featured: sanitized.featured === 'on' || sanitized.featured === true,
        updatedAt: new Date()
      };
      delete update._id;

      let filter;
      try {
        const { ObjectId } = require('mongodb');
        filter = { _id: new ObjectId(id) };
      } catch (e) {
        filter = { _id: id };
      }

      const result = await collection.updateOne(filter, { $set: update });
      
      if (result.modifiedCount === 0) {
        throw new Error(`Product with ID ${id} not found or no changes made`);
      }

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Product.update error:', error);
      if (error.message.includes('Validation failed')) {
        throw error;
      }
      throw new DatabaseError(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Delete a product
   */
  static async delete(id) {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const collection = await this.collection();
      
      let filter;
      try {
        const { ObjectId } = require('mongodb');
        filter = { _id: new ObjectId(id) };
      } catch (e) {
        filter = { _id: id };
      }

      const result = await collection.deleteOne(filter);
      
      if (result.deletedCount === 0) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Product.delete error:', error);
      throw new DatabaseError(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Count products
   */
  static async count(filter = {}) {
    try {
      const collection = await this.collection();
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error('Product.count error:', error);
      throw new DatabaseError(`Failed to count products: ${error.message}`);
    }
  }

  /**
   * Get featured products
   */
  static async getFeatured(limit = 4) {
    try {
      return await this.findAll({ featured: true });
    } catch (error) {
      console.error('Product.getFeatured error:', error);
      throw new DatabaseError(`Failed to fetch featured products: ${error.message}`);
    }
  }
}

module.exports = Product;