// models/Order.js
const { getDB, DatabaseError } = require('../config/db');

class Order {
  static async collection() {
    const db = getDB();
    return db.collection('orders');
  }

  static async findAll() {
    const collection = await this.collection();
    const result = await collection.find({}).sort({ createdAt: -1 });
    return result.toArray ? await result.toArray() : result;
  }

  static async findById(id) {
    const collection = await this.collection();
    try {
      const { ObjectId } = require('mongodb');
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      return await collection.findOne({ _id: id });
    }
  }

  static async create(orderData) {
    const collection = await this.collection();
    const orderId = 'GDF' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    const order = {
      orderId: orderId,
      ...orderData,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(order);
    return { ...order, _id: result.insertedId || result._id };
  }

  static async updateStatus(id, status) {
    const collection = await this.collection();
   
    let filter;
    try {
      const { ObjectId } = require('mongodb');
      filter = { _id: new ObjectId(id) };
    } catch (e) {
      filter = { _id: id };
    }
   
    const result = await collection.updateOne(
      filter,
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async count() {
    const collection = await this.collection();
    return await collection.countDocuments();
  }

  // FIXED: getStats method
  static async getStats() {
    try {
      const collection = await this.collection();
      
      // Get all orders using the proper find() syntax
      let allOrders = await collection.find({});
      
      // Handle both MongoDB cursor and local storage array
      if (allOrders && typeof allOrders.toArray === 'function') {
        allOrders = await allOrders.toArray();
      } else if (!Array.isArray(allOrders)) {
        allOrders = [];
      }
      
      const stats = {
        total: allOrders.length,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        revenue: 0
      };
      
      allOrders.forEach(order => {
        const status = (order.status || 'Pending').toLowerCase();
        if (stats[status] !== undefined) {
          stats[status]++;
        }
        stats.revenue += parseFloat(order.total) || 0;
      });
      
      return stats;
    } catch (error) {
      console.error('Order.getStats error:', error);
      // Return default stats on error
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        revenue: 0
      };
    }
  }

  // Add pagination method
  static async findPaginated({ page = 1, limit = 20, status = null }) {
    try {
      const collection = await this.collection();
      const query = status ? { status } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);
      
      let items = await collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
      
      if (items && typeof items.toArray === 'function') {
        items = await items.toArray();
      }
      
      const total = await collection.countDocuments(query);
      
      return {
        items: items || [],
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      console.error('Order.findPaginated error:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      };
    }
  }
}

module.exports = Order;