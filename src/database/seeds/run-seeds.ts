import { AppDataSource } from '../data-source';
import { Retailer } from '../entities/retailer.entity';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    const retailerRepository = AppDataSource.getRepository(Retailer);
    const userRepository = AppDataSource.getRepository(User);

    // Seed retailers
    const retailers = [
      {
        name: 'Amazon',
        domain: 'amazon.com',
        logo: 'https://logo.clearbit.com/amazon.com',
        country: 'US',
        currency: 'USD',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://webservices.amazon.com/paapi5/searchitems',
          apiKey: process.env.AMAZON_ACCESS_KEY,
          rateLimit: 100,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '[data-automation-id="product-title"]',
            price: '.a-price-whole',
            availability: '#availability span',
            image: '#landingImage',
          },
          lastScraped: new Date(),
          successRate: 0.95,
          averageResponseTime: 1200,
        },
        trustScore: 0.95,
        averageRating: 4.2,
        reviewCount: 15000000,
        shipping: {
          freeShippingThreshold: 25,
          averageShippingTime: 2,
          shippingCost: 0,
          internationalShipping: true,
        },
        returnPolicy: {
          returnWindow: 30,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 1000,
          averageResponseTime: 1200,
        },
      },
      {
        name: 'Walmart',
        domain: 'walmart.com',
        logo: 'https://logo.clearbit.com/walmart.com',
        country: 'US',
        currency: 'USD',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://developer.walmartlabs.com/docs',
          apiKey: process.env.WALMART_API_KEY,
          rateLimit: 50,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '[data-automation-id="product-title"]',
            price: '.price-group',
            availability: '.prod-ProductOfferAvailability',
            image: '.prod-ProductImageHero-image',
          },
          lastScraped: new Date(),
          successRate: 0.92,
          averageResponseTime: 1500,
        },
        trustScore: 0.88,
        averageRating: 4.0,
        reviewCount: 8000000,
        shipping: {
          freeShippingThreshold: 35,
          averageShippingTime: 3,
          shippingCost: 0,
          internationalShipping: false,
        },
        returnPolicy: {
          returnWindow: 90,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 800,
          averageResponseTime: 1500,
        },
      },
      {
        name: 'eBay',
        domain: 'ebay.com',
        logo: 'https://logo.clearbit.com/ebay.com',
        country: 'US',
        currency: 'USD',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://api.ebay.com/buy/browse/v1',
          apiKey: process.env.EBAY_APP_ID,
          rateLimit: 200,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '#x-title-label-lbl',
            price: '.notranslate',
            availability: '.u-flL.condText',
            image: '#icImg',
          },
          lastScraped: new Date(),
          successRate: 0.85,
          averageResponseTime: 2000,
        },
        trustScore: 0.82,
        averageRating: 3.8,
        reviewCount: 5000000,
        shipping: {
          freeShippingThreshold: 0,
          averageShippingTime: 5,
          shippingCost: 5.99,
          internationalShipping: true,
        },
        returnPolicy: {
          returnWindow: 30,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 600,
          averageResponseTime: 2000,
        },
      },
      {
        name: 'Best Buy',
        domain: 'bestbuy.com',
        logo: 'https://logo.clearbit.com/bestbuy.com',
        country: 'US',
        currency: 'USD',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://api.bestbuy.com/v1',
          apiKey: process.env.BEST_BUY_API_KEY,
          rateLimit: 100,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '.heading-5.v-fw-regular',
            price: '.priceView-customer-price span',
            availability: '.fulfillment-add-to-cart-button',
            image: '.primary-image',
          },
          lastScraped: new Date(),
          successRate: 0.90,
          averageResponseTime: 1800,
        },
        trustScore: 0.90,
        averageRating: 4.1,
        reviewCount: 3000000,
        shipping: {
          freeShippingThreshold: 35,
          averageShippingTime: 2,
          shippingCost: 0,
          internationalShipping: false,
        },
        returnPolicy: {
          returnWindow: 15,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 400,
          averageResponseTime: 1800,
        },
      },
      {
        name: 'Zalando',
        domain: 'zalando.com',
        logo: 'https://logo.clearbit.com/zalando.com',
        country: 'DE',
        currency: 'EUR',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://api.zalando.com',
          apiKey: process.env.ZALANDO_API_KEY,
          rateLimit: 100,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '.z-12-xl.z-12-l.z-12-m.z-12-s.z-12-xs',
            price: '.z-12-xl.z-12-l.z-12-m.z-12-s.z-12-xs',
            availability: '.z-12-xl.z-12-l.z-12-m.z-12-s.z-12-xs',
            image: '.z-12-xl.z-12-l.z-12-m.z-12-s.z-12-xs',
          },
          lastScraped: new Date(),
          successRate: 0.88,
          averageResponseTime: 1600,
        },
        trustScore: 0.87,
        averageRating: 4.0,
        reviewCount: 2000000,
        shipping: {
          freeShippingThreshold: 0,
          averageShippingTime: 3,
          shippingCost: 0,
          internationalShipping: true,
        },
        returnPolicy: {
          returnWindow: 30,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 300,
          averageResponseTime: 1600,
        },
      },
      {
        name: 'Farfetch',
        domain: 'farfetch.com',
        logo: 'https://logo.clearbit.com/farfetch.com',
        country: 'UK',
        currency: 'GBP',
        apiConfig: {
          hasApi: true,
          apiEndpoint: 'https://api.farfetch.com',
          apiKey: process.env.FARFETCH_API_KEY,
          rateLimit: 50,
          lastUsed: new Date(),
          status: 'active',
        },
        scraperConfig: {
          enabled: true,
          selectors: {
            productName: '[data-testid="product-name"]',
            price: '[data-testid="price"]',
            availability: '[data-testid="add-to-bag"]',
            image: '[data-testid="product-image"]',
          },
          lastScraped: new Date(),
          successRate: 0.85,
          averageResponseTime: 2200,
        },
        trustScore: 0.92,
        averageRating: 4.3,
        reviewCount: 1500000,
        shipping: {
          freeShippingThreshold: 0,
          averageShippingTime: 5,
          shippingCost: 0,
          internationalShipping: true,
        },
        returnPolicy: {
          returnWindow: 14,
          returnCost: 0,
          refundMethod: 'original_payment',
        },
        isActive: true,
        metadata: {
          lastPriceUpdate: new Date(),
          lastHealthCheck: new Date(),
          errorCount: 0,
          successCount: 200,
          averageResponseTime: 2200,
        },
      },
    ];

    // Clear existing retailers
    await retailerRepository.clear();

    // Insert new retailers
    for (const retailerData of retailers) {
      const retailer = retailerRepository.create(retailerData);
      await retailerRepository.save(retailer);
    }

    console.log(`✅ Seeded ${retailers.length} retailers`);

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = userRepository.create({
      email: 'admin@dealco.ai',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      preferences: {
        currency: 'USD',
        country: 'US',
        language: 'en',
        notifications: {
          priceAlerts: true,
          newDeals: true,
          weeklyDigest: true,
        },
      },
      metadata: {
        lastLoginAt: new Date(),
        loginCount: 0,
        deviceInfo: null,
        ipAddress: '127.0.0.1',
      },
    });

    await userRepository.save(adminUser);
    console.log('✅ Seeded admin user');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds();