// models/SiteSettings.js
const { getDB } = require('../config/db');

class SiteSettings {
  static async collection() {
    const db = getDB();
    return db.collection('siteSettings');
  }

  static async getSettings() {
    const collection = await this.collection();
    const settings = await collection.findOne({ type: 'main' });
    
    // Default settings if none exist
    if (!settings) {
      return {
        type: 'main',
        hero: {
          badge: 'New Collection',
          title: 'Classy.\nModern.\nComfy.',
          subtitle: 'Handmade accessories & quality clothing in Olive, Butter & Burgundy.',
          trustBadges: [
            'Free Shipping over ₦50k',
            'Handmade in Lagos',
            '7-Day Returns'
          ]
        },
        categories: [
          {
            name: 'Classy',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop',
            link: '/products?cat=Classy'
          },
          {
            name: 'Modern',
            image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop',
            link: '/products?cat=Modern'
          },
          {
            name: 'Comfy',
            image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop',
            link: '/products?cat=Comfy'
          }
        ],
        about: {
          heroTitle: 'Meet the woman behind GaDes fit',
          heroSubtitle: 'Classy. Modern. Comfy. Born from a passion for quality and confidence.',
          founderImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=1000&fit=crop',
          studioImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop',
          founderName: 'Abigail Sam',
          founderTitle: 'Founder & Creative Director of GaDes fit.',
          founderStory: [
            'What started as a personal quest for clothing that felt as good as it looked has grown into a brand dedicated to women who refuse to compromise between style and comfort.',
            'I believe that what you wear should empower you. It should move with you through busy days and quiet evenings. It should make you stand a little taller and smile a little brighter.',
            'Every piece at GaDes fit is thoughtfully curated or handmade with attention to detail, quality fabrics, and timeless design. From our signature olive blazers to our butter-soft knitwear, each item is chosen to help you express your most confident self.'
          ],
          quote: 'Fashion fades, but confidence is eternal. I create for the woman who knows who she is and isn\'t afraid to show it.',
          values: [
            { icon: '✧', title: 'Quality First', description: 'We source premium fabrics and materials because you deserve clothing that lasts.' },
            { icon: '✧', title: 'Handmade with Love', description: 'Our accessories are crafted by skilled artisans, ensuring each piece is unique.' },
            { icon: '✧', title: 'Affordable Luxury', description: 'Premium quality shouldn\'t break the bank. We keep our prices accessible.' },
            { icon: '✧', title: 'Confidence First', description: 'Every design is created to make you feel powerful, beautiful, and comfortable.' }
          ],
          promiseTitle: 'The GaDes Promise',
          promiseText: [
            'We believe that when you look good and feel comfortable, you show up differently in the world. More confident. More present. More you.',
            'That\'s why every piece we create—from our structured blazers to our cloud-soft loungewear—is designed with one goal: to help you feel like the best version of yourself.'
          ],
          signature: 'Abigail & The GaDes fit Team'
        },
        contact: {
          studio: {
            address: '123 Fashion Avenue, Lekki Phase 1, Lagos, Nigeria',
            note: 'By appointment only'
          },
          phone: {
            primary: '+234 123 456 7890',
            secondary: '+234 987 654 3210',
            hours: 'Mon - Fri, 9am - 6pm WAT'
          },
          email: {
            primary: 'hello@gadesfit.com',
            wholesale: 'wholesale@gadesfit.com',
            response: 'We reply within 24 hours'
          },
          social: {
            instagram: 'https://instagram.com/gades_fit',
            facebook: 'https://facebook.com/gadesfit',
            pinterest: 'https://pinterest.com/gadesfit'
          }
        },
        newsletter: {
          title: 'Join the GaDes Community',
          subtitle: 'Get 10% off your first order',
          placeholder: 'Your email'
        },
        instagram: {
          handle: '@gades_fit',
          tagline: 'Behind the seams, new drops, and daily inspiration.'
        }
      };
    }
    return settings;
  }

  static async saveSettings(settingsData) {
    const collection = await this.collection();
    const existing = await collection.findOne({ type: 'main' });
    
    if (existing) {
      await collection.updateOne(
        { type: 'main' },
        { $set: { ...settingsData, updatedAt: new Date() } }
      );
    } else {
      await collection.insertOne({
        type: 'main',
        ...settingsData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return true;
  }
}

module.exports = SiteSettings;