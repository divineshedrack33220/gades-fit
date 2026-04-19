// models/Newsletter.js
const { getDB, DatabaseError } = require('../config/db');

/**
 * Newsletter Model
 * Handles newsletter subscriber operations with validation
 */
class Newsletter {
  /**
   * Get the newsletter collection
   */
  static async collection() {
    const db = getDB();
    return db.collection('newsletter');
  }

  /**
   * Validate email address
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email address is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Check for disposable email domains (optional)
    const disposableDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      throw new Error('Please use a permanent email address');
    }

    return true;
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email) {
    return String(email).trim().toLowerCase().replace(/[<>]/g, '');
  }

  /**
   * Subscribe an email to the newsletter
   */
  static async subscribe(email) {
    try {
      const sanitizedEmail = this.sanitizeEmail(email);
      this.validateEmail(sanitizedEmail);

      const collection = await this.collection();

      // Check if already subscribed
      const existing = await collection.findOne({ email: sanitizedEmail });

      if (existing) {
        if (existing.active === false) {
          // Reactivate if previously unsubscribed
          await collection.updateOne(
            { email: sanitizedEmail },
            { $set: { active: true, subscribedAt: new Date(), reactivatedAt: new Date() } }
          );
          return { success: true, message: 'Successfully re-subscribed!', reactivated: true };
        }
        return { success: false, message: 'Email already subscribed!', alreadySubscribed: true };
      }

      // Add new subscriber
      await collection.insertOne({
        email: sanitizedEmail,
        subscribedAt: new Date(),
        active: true
      });

      return { success: true, message: 'Successfully subscribed! Thank you for joining.' };
    } catch (error) {
      console.error('Newsletter.subscribe error:', error);
      if (error.message.includes('valid email')) {
        return { success: false, message: error.message };
      }
      throw new DatabaseError(`Failed to subscribe: ${error.message}`);
    }
  }

  /**
   * Get all subscribers
   */
  static async getAllSubscribers(activeOnly = false) {
    try {
      const collection = await this.collection();
      const query = activeOnly ? { active: true } : {};
      const result = await collection.find(query).sort({ subscribedAt: -1 }).toArray();
      return result || [];
    } catch (error) {
      console.error('Newsletter.getAllSubscribers error:', error);
      throw new DatabaseError(`Failed to fetch subscribers: ${error.message}`);
    }
  }

  /**
   * Get subscribers with pagination
   */
  static async getPaginatedSubscribers({ page = 1, limit = 50, activeOnly = false }) {
    try {
      const collection = await this.collection();
      const query = activeOnly ? { active: true } : {};
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const [items, total] = await Promise.all([
        collection.find(query)
          .sort({ subscribedAt: -1 })
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
      console.error('Newsletter.getPaginatedSubscribers error:', error);
      throw new DatabaseError(`Failed to fetch subscribers: ${error.message}`);
    }
  }

  /**
   * Unsubscribe an email
   */
  static async unsubscribe(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const sanitizedEmail = this.sanitizeEmail(email);
      const collection = await this.collection();

      const result = await collection.updateOne(
        { email: sanitizedEmail },
        { $set: { active: false, unsubscribedAt: new Date() } }
      );

      if (result.modifiedCount === 0) {
        return { success: false, message: 'Email not found in subscribers list' };
      }

      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      console.error('Newsletter.unsubscribe error:', error);
      throw new DatabaseError(`Failed to unsubscribe: ${error.message}`);
    }
  }

  /**
   * Delete a subscriber permanently
   */
  static async delete(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const sanitizedEmail = this.sanitizeEmail(email);
      const collection = await this.collection();

      const result = await collection.deleteOne({ email: sanitizedEmail });

      if (result.deletedCount === 0) {
        return { success: false, message: 'Email not found in subscribers list' };
      }

      return { success: true, message: 'Subscriber permanently deleted' };
    } catch (error) {
      console.error('Newsletter.delete error:', error);
      throw new DatabaseError(`Failed to delete subscriber: ${error.message}`);
    }
  }

  /**
   * Count subscribers
   */
  static async count(activeOnly = true) {
    try {
      const collection = await this.collection();
      const query = activeOnly ? { active: true } : {};
      return await collection.countDocuments(query);
    } catch (error) {
      console.error('Newsletter.count error:', error);
      throw new DatabaseError(`Failed to count subscribers: ${error.message}`);
    }
  }

  /**
   * Check if email is subscribed
   */
  static async isSubscribed(email) {
    try {
      if (!email) return false;

      const sanitizedEmail = this.sanitizeEmail(email);
      const collection = await this.collection();
      const subscriber = await collection.findOne({ email: sanitizedEmail });

      return !!(subscriber && subscriber.active);
    } catch (error) {
      console.error('Newsletter.isSubscribed error:', error);
      return false;
    }
  }
}

module.exports = Newsletter;