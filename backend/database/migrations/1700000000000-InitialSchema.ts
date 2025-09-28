import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying,
        "lastName" character varying,
        "avatar" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "isVerified" boolean NOT NULL DEFAULT false,
        "verificationToken" character varying,
        "resetPasswordToken" character varying,
        "resetPasswordExpires" TIMESTAMP,
        "preferences" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create retailers table
    await queryRunner.query(`
      CREATE TABLE "retailers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "domain" character varying,
        "logo" character varying,
        "country" character varying,
        "currency" character varying,
        "apiConfig" jsonb,
        "scraperConfig" jsonb,
        "trustScore" double precision NOT NULL DEFAULT '1',
        "averageRating" double precision NOT NULL DEFAULT '0',
        "reviewCount" integer NOT NULL DEFAULT '0',
        "shipping" jsonb,
        "returnPolicy" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_retailers_id" PRIMARY KEY ("id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "brand" character varying,
        "model" character varying,
        "sku" character varying,
        "upc" character varying,
        "ean" character varying,
        "isbn" character varying,
        "category" character varying,
        "subcategory" character varying,
        "description" text,
        "specifications" jsonb,
        "images" jsonb,
        "attributes" jsonb,
        "averagePrice" double precision,
        "lowestPrice" double precision,
        "highestPrice" double precision,
        "priceCount" integer NOT NULL DEFAULT '0',
        "scanCount" integer NOT NULL DEFAULT '0',
        "confidenceScore" double precision,
        "embeddings" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);

    // Create prices table
    await queryRunner.query(`
      CREATE TABLE "prices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "retailerId" uuid NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "originalPrice" numeric(10,2),
        "discount" numeric(10,2),
        "discountPercentage" numeric(10,2),
        "productUrl" text,
        "imageUrl" text,
        "inStock" boolean NOT NULL DEFAULT true,
        "stockQuantity" integer,
        "shippingCost" numeric(10,2),
        "estimatedDelivery" character varying,
        "availability" jsonb,
        "promotions" jsonb,
        "ratings" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_prices_product_retailer" UNIQUE ("productId", "retailerId"),
        CONSTRAINT "PK_prices_id" PRIMARY KEY ("id")
      )
    `);

    // Create scans table
    await queryRunner.query(`
      CREATE TABLE "scans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "productId" uuid,
        "imageUrl" text NOT NULL,
        "thumbnailUrl" text,
        "imageMetadata" jsonb,
        "confidenceScore" double precision,
        "recognitionResults" jsonb,
        "aiNormalization" jsonb,
        "searchResults" jsonb,
        "priceResults" jsonb,
        "userFeedback" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "error" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scans_id" PRIMARY KEY ("id")
      )
    `);

    // Create price_history table
    await queryRunner.query(`
      CREATE TABLE "price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" uuid NOT NULL,
        "retailerId" uuid NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "originalPrice" numeric(10,2),
        "inStock" boolean NOT NULL DEFAULT true,
        "stockQuantity" integer,
        "shippingCost" numeric(10,2),
        "promotions" jsonb,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_price_history_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_name" ON "products" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_brand" ON "products" ("brand")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_retailers_name" ON "retailers" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_retailers_domain" ON "retailers" ("domain")`);
    await queryRunner.query(`CREATE INDEX "IDX_retailers_country" ON "retailers" ("country")`);
    await queryRunner.query(`CREATE INDEX "IDX_prices_product_retailer" ON "prices" ("productId", "retailerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_prices_price" ON "prices" ("price")`);
    await queryRunner.query(`CREATE INDEX "IDX_prices_currency" ON "prices" ("currency")`);
    await queryRunner.query(`CREATE INDEX "IDX_prices_updated_at" ON "prices" ("updatedAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_scans_user_id" ON "scans" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_scans_product_id" ON "scans" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_scans_created_at" ON "scans" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_scans_confidence_score" ON "scans" ("confidenceScore")`);
    await queryRunner.query(`CREATE INDEX "IDX_price_history_product_retailer_created" ON "price_history" ("productId", "retailerId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_price_history_price" ON "price_history" ("price")`);
    await queryRunner.query(`CREATE INDEX "IDX_price_history_created_at" ON "price_history" ("createdAt")`);

    // Create full-text search indexes
    await queryRunner.query(`CREATE INDEX "IDX_products_name_gin" ON "products" USING gin (to_tsvector('english', "name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_products_description_gin" ON "products" USING gin (to_tsvector('english', "description"))`);

    // Add foreign key constraints
    await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_prices_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_prices_retailer" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "scans" ADD CONSTRAINT "FK_scans_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "scans" ADD CONSTRAINT "FK_scans_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "scans" DROP CONSTRAINT "FK_scans_product"`);
    await queryRunner.query(`ALTER TABLE "scans" DROP CONSTRAINT "FK_scans_user"`);
    await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_prices_retailer"`);
    await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_prices_product"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "price_history"`);
    await queryRunner.query(`DROP TABLE "scans"`);
    await queryRunner.query(`DROP TABLE "prices"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "retailers"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}