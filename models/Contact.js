// models/Contact.js
const { getDB, DatabaseError } = require('../config/db');

class Contact {
  static async collection() {
    const db = getDB();
    return db.collection('contacts');
  }

  /**
   * Validate contact form data
   */
  static validate(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.subject) {
      errors.push('Subject is required');
    }
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters');
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    return true;
  }

  /**
   * Sanitize contact data
   */
  static sanitize(data) {
    return {
      name: String(data.name || '').trim().replace(/[<>]/g, ''),
      email: String(data.email || '').trim().toLowerCase().replace(/[<>]/g, ''),
      subject: String(data.subject || '').trim().replace(/[<>]/g, ''),
      message: String(data.message || '').trim().replace(/[<>]/g, '')
    };
  }

  /**
   * Create a new contact message
   */
  static async create(contactData) {
    try {
      const sanitized = this.sanitize(contactData);
      this.validate(sanitized);
      
      const collection = await this.collection();
      
      const contact = {
        ...sanitized,
        status: 'unread', // unread, read, replied
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(contact);
      return { ...contact, _id: result.insertedId || result._id };
    } catch (error) {
      console.error('Contact.create error:', error);
      throw new DatabaseError(`Failed to save contact message: ${error.message}`);
    }
  }

  /**
   * Get all contact messages
   */
  static async findAll(filter = {}) {
    try {
      const collection = await this.collection();
      return await collection.find(filter).sort({ createdAt: -1 }).toArray();
    } catch (error) {
      console.error('Contact.findAll error:', error);
      return [];
    }
  }

  /**
   * Get contact by ID
   */
  static async findById(id) {
    try {
      const collection = await this.collection();
      try {
        const { ObjectId } = require('mongodb');
        return await collection.findOne({ _id: new ObjectId(id) });
      } catch (e) {
        return await collection.findOne({ _id: id });
      }
    } catch (error) {
      console.error('Contact.findById error:', error);
      return null;
    }
  }

  /**
   * Update contact status
   */
  static async updateStatus(id, status) {
    try {
      const collection = await this.collection();
      const validStatuses = ['unread', 'read', 'replied', 'archived'];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
      
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
    } catch (error) {
      console.error('Contact.updateStatus error:', error);
      return false;
    }
  }

  /**
   * Delete contact message
   */
  static async delete(id) {
    try {
      const collection = await this.collection();
      
      let filter;
      try {
        const { ObjectId } = require('mongodb');
        filter = { _id: new ObjectId(id) };
      } catch (e) {
        filter = { _id: id };
      }
      
      const result = await collection.deleteOne(filter);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Contact.delete error:', error);
      return false;
    }
  }

  /**
   * Count contacts by status
   */
  static async count(filter = {}) {
    try {
      const collection = await this.collection();
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error('Contact.count error:', error);
      return 0;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount() {
    try {
      return await this.count({ status: 'unread' });
    } catch (error) {
      return 0;
    }
  }
}

module.exports = Contact;