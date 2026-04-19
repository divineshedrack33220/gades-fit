// config/db.js
const { LocalStorage } = require('node-localstorage');
const path = require('path');

// Create local storage in project folder
const storagePath = path.join(__dirname, '../.data');
const localStorage = new LocalStorage(storagePath);

let db = null;
let dbType = null; // 'mongodb' or 'local'

// Collections (stored as JSON arrays)
const collections = {
  products: [],
  orders: [],
  users: [],
  newsletter: [],
  siteSettings: [],
  contacts: []  // ← ADDED THIS LINE
};

/**
 * Database Adapter Interface
 * Provides consistent API regardless of backend
 */
class DatabaseAdapter {
  constructor(backend, type) {
    this.backend = backend;
    this.type = type;
  }

  collection(name) {
    const self = this;
    
    return {
      find: (query = {}) => ({
        sort: (sortObj = {}) => ({
          skip: (n) => ({
            limit: (l) => ({
              toArray: async () => {
                try {
                  if (self.type === 'mongodb') {
                    return await self.backend.collection(name)
                      .find(query)
                      .sort(sortObj)
                      .skip(n)
                      .limit(l)
                      .toArray();
                  } else {
                    let items = collections[name] || [];
                    // Apply simple filtering for local storage
                    items = items.filter(item => {
                      return Object.keys(query).every(key => item[key] === query[key]);
                    });
                    // Simple sort simulation
                    const sortKey = Object.keys(sortObj)[0];
                    if (sortKey) {
                      const direction = sortObj[sortKey];
                      items.sort((a, b) => {
                        if (direction === -1) return b[sortKey] > a[sortKey] ? 1 : -1;
                        return a[sortKey] > b[sortKey] ? 1 : -1;
                      });
                    }
                    // Apply skip and limit
                    items = items.slice(n, n + l);
                    return items;
                  }
                } catch (error) {
                  console.error(`Error in find().toArray() for ${name}:`, error);
                  throw new Error(`Database query failed: ${error.message}`);
                }
              }
            })
          }),
          toArray: async () => {
            try {
              if (self.type === 'mongodb') {
                return await self.backend.collection(name).find(query).sort(sortObj).toArray();
              } else {
                let items = collections[name] || [];
                items = items.filter(item => {
                  return Object.keys(query).every(key => item[key] === query[key]);
                });
                const sortKey = Object.keys(sortObj)[0];
                if (sortKey) {
                  const direction = sortObj[sortKey];
                  items.sort((a, b) => direction === -1 ? b[sortKey] > a[sortKey] : a[sortKey] > b[sortKey]);
                }
                return items;
              }
            } catch (error) {
              console.error(`Error in find().toArray() for ${name}:`, error);
              throw new Error(`Database query failed: ${error.message}`);
            }
          }
        })
      }),

      findOne: async (query) => {
        try {
          if (self.type === 'mongodb') {
            return await self.backend.collection(name).findOne(query);
          } else {
            const items = collections[name] || [];
            if (query._id) {
              return items.find(item => item._id.toString() === query._id.toString());
            }
            return items.find(item => {
              return Object.keys(query).every(key => item[key] === query[key]);
            });
          }
        } catch (error) {
          console.error(`Error in findOne for ${name}:`, error);
          throw new Error(`Database query failed: ${error.message}`);
        }
      },

      insertOne: async (doc) => {
        try {
          if (self.type === 'mongodb') {
            return await self.backend.collection(name).insertOne(doc);
          } else {
            if (!collections[name]) collections[name] = [];
            const _id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const newDoc = { ...doc, _id };
            collections[name].push(newDoc);
            localStorage.setItem(name, JSON.stringify(collections[name]));
            return { insertedId: _id };
          }
        } catch (error) {
          console.error(`Error in insertOne for ${name}:`, error);
          throw new Error(`Database insert failed: ${error.message}`);
        }
      },

      updateOne: async (filter, update) => {
        try {
          if (self.type === 'mongodb') {
            return await self.backend.collection(name).updateOne(filter, update);
          } else {
            if (!collections[name]) collections[name] = [];
            const index = collections[name].findIndex(item => {
              if (filter._id) {
                return item._id.toString() === filter._id.toString();
              }
              return Object.keys(filter).every(key => item[key] === filter[key]);
            });

            if (index !== -1) {
              collections[name][index] = {
                ...collections[name][index],
                ...update.$set,
                updatedAt: new Date()
              };
              localStorage.setItem(name, JSON.stringify(collections[name]));
              return { modifiedCount: 1 };
            }
            return { modifiedCount: 0 };
          }
        } catch (error) {
          console.error(`Error in updateOne for ${name}:`, error);
          throw new Error(`Database update failed: ${error.message}`);
        }
      },

      deleteOne: async (filter) => {
        try {
          if (self.type === 'mongodb') {
            return await self.backend.collection(name).deleteOne(filter);
          } else {
            if (!collections[name]) collections[name] = [];
            const index = collections[name].findIndex(item => {
              if (filter._id) {
                return item._id.toString() === filter._id.toString();
              }
              return Object.keys(filter).every(key => item[key] === filter[key]);
            });

            if (index !== -1) {
              collections[name].splice(index, 1);
              localStorage.setItem(name, JSON.stringify(collections[name]));
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        } catch (error) {
          console.error(`Error in deleteOne for ${name}:`, error);
          throw new Error(`Database delete failed: ${error.message}`);
        }
      },

      countDocuments: async (query = {}) => {
        try {
          if (self.type === 'mongodb') {
            return await self.backend.collection(name).countDocuments(query);
          } else {
            let items = collections[name] || [];
            if (Object.keys(query).length > 0) {
              items = items.filter(item => {
                return Object.keys(query).every(key => item[key] === query[key]);
              });
            }
            return items.length;
          }
        } catch (error) {
          console.error(`Error in countDocuments for ${name}:`, error);
          throw new Error(`Database count failed: ${error.message}`);
        }
      }
    };
  }
}

class DatabaseError extends Error {
  constructor(message, code = 'DB_ERROR') {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

async function connectDB() {
  if (db) return db;

  try {
    // Try MongoDB first
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGO_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    const mongoDb = client.db('gades-fit');
    db = new DatabaseAdapter(mongoDb, 'mongodb');
    dbType = 'mongodb';
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (error) {
    // Fallback to local storage
    console.log('⚠️ MongoDB unavailable, using local storage');
    console.log('   Reason:', error.message);

    // Load existing data from local storage
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) collections.products = JSON.parse(savedProducts);

      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) collections.orders = JSON.parse(savedOrders);

      const savedUsers = localStorage.getItem('users');
      if (savedUsers) collections.users = JSON.parse(savedUsers);

      const savedNewsletter = localStorage.getItem('newsletter');
      if (savedNewsletter) collections.newsletter = JSON.parse(savedNewsletter);

      const savedSettings = localStorage.getItem('siteSettings');
      if (savedSettings) collections.siteSettings = JSON.parse(savedSettings);

      // ← ADDED THIS LINE
      const savedContacts = localStorage.getItem('contacts');
      if (savedContacts) collections.contacts = JSON.parse(savedContacts);
      
    } catch (e) {
      console.log('No existing local data found, starting fresh');
    }

    db = new DatabaseAdapter(null, 'local');
    dbType = 'local';
    console.log('✅ Local storage initialized');
    return db;
  }
}

function getDB() {
  if (!db) {
    throw new DatabaseError(
      'Database not initialized. Call connectDB first.',
      'DB_NOT_INITIALIZED'
    );
  }
  return db;
}

function getDBType() {
  return dbType;
}

module.exports = { 
  connectDB, 
  getDB, 
  getDBType,
  DatabaseError 
};