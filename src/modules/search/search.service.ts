import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Product } from '../../database/entities/product.entity';

export interface SearchOptions {
  query: string;
  filters?: {
    brand?: string;
    category?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    inStock?: boolean;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  aggregations?: any;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'products';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Initialize Elasticsearch index
   */
  async initializeIndex(): Promise<void> {
    try {
      const exists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.createIndex();
        this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
      } else {
        this.logger.log(`Elasticsearch index already exists: ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch index:', error);
      throw error;
    }
  }

  /**
   * Create Elasticsearch index with mapping
   */
  private async createIndex(): Promise<void> {
    const mapping = {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' },
            },
          },
          brand: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          model: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          sku: { type: 'keyword' },
          upc: { type: 'keyword' },
          ean: { type: 'keyword' },
          isbn: { type: 'keyword' },
          category: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          subcategory: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
            },
          },
          description: {
            type: 'text',
            analyzer: 'standard',
          },
          specifications: {
            type: 'object',
            properties: {
              color: { type: 'keyword' },
              size: { type: 'keyword' },
              material: { type: 'keyword' },
              weight: { type: 'keyword' },
              dimensions: { type: 'keyword' },
            },
          },
          attributes: {
            type: 'object',
            properties: {
              gender: { type: 'keyword' },
              ageGroup: { type: 'keyword' },
              season: { type: 'keyword' },
              style: { type: 'keyword' },
            },
          },
          averagePrice: { type: 'float' },
          lowestPrice: { type: 'float' },
          highestPrice: { type: 'float' },
          priceCount: { type: 'integer' },
          scanCount: { type: 'integer' },
          confidenceScore: { type: 'float' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            product_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'snowball'],
            },
          },
        },
      },
    };

    await this.elasticsearchService.indices.create({
      index: this.indexName,
      body: mapping,
    });
  }

  /**
   * Index a product
   */
  async indexProduct(product: Product): Promise<void> {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: product.id,
        body: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          model: product.model,
          sku: product.sku,
          upc: product.upc,
          ean: product.ean,
          isbn: product.isbn,
          category: product.category,
          subcategory: product.subcategory,
          description: product.description,
          specifications: product.specifications,
          attributes: product.attributes,
          averagePrice: product.averagePrice,
          lowestPrice: product.lowestPrice,
          highestPrice: product.highestPrice,
          priceCount: product.priceCount,
          scanCount: product.scanCount,
          confidenceScore: product.confidenceScore,
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}:`, error);
      throw error;
    }
  }

  /**
   * Remove a product from index
   */
  async removeProduct(productId: string): Promise<void> {
    try {
      await this.elasticsearchService.delete({
        index: this.indexName,
        id: productId,
      });
    } catch (error) {
      this.logger.error(`Failed to remove product ${productId} from index:`, error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(options: SearchOptions): Promise<SearchResult> {
    try {
      const { query, filters, sort, pagination } = options;
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const from = (page - 1) * limit;

      // Build search query
      const searchBody: any = {
        query: {
          bool: {
            must: [],
            filter: [],
          },
        },
        aggs: {
          brands: {
            terms: { field: 'brand.keyword' },
          },
          categories: {
            terms: { field: 'category.keyword' },
          },
          price_ranges: {
            range: {
              field: 'lowestPrice',
              ranges: [
                { to: 25 },
                { from: 25, to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 250 },
                { from: 250 },
              ],
            },
          },
        },
        from,
        size: limit,
      };

      // Add text search
      if (query) {
        searchBody.query.bool.must.push({
          multi_match: {
            query,
            fields: [
              'name^3',
              'brand^2',
              'model^2',
              'category^1.5',
              'description',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      } else {
        searchBody.query.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters) {
        if (filters.brand) {
          searchBody.query.bool.filter.push({
            term: { 'brand.keyword': filters.brand },
          });
        }

        if (filters.category) {
          searchBody.query.bool.filter.push({
            term: { 'category.keyword': filters.category },
          });
        }

        if (filters.priceRange) {
          searchBody.query.bool.filter.push({
            range: {
              lowestPrice: {
                gte: filters.priceRange.min,
                lte: filters.priceRange.max,
              },
            },
          });
        }

        if (filters.inStock !== undefined) {
          searchBody.query.bool.filter.push({
            term: { isActive: filters.inStock },
          });
        }
      }

      // Add sorting
      if (sort) {
        searchBody.sort = [{ [sort.field]: { order: sort.order } }];
      } else {
        // Default sort by relevance and confidence score
        searchBody.sort = [
          { _score: { order: 'desc' } },
          { confidenceScore: { order: 'desc' } },
        ];
      }

      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: searchBody,
      });

      const products = response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
      }));

      return {
        products,
        total: response.body.hits.total.value,
        page,
        limit,
        aggregations: response.body.aggregations,
      };
    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Get product suggestions
   */
  async getSuggestions(query: string, limit = 10): Promise<string[]> {
    try {
      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          suggest: {
            product_suggest: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: limit,
              },
            },
          },
        },
      });

      return response.body.suggest.product_suggest[0].options.map(
        (option: any) => option.text,
      );
    } catch (error) {
      this.logger.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(productId: string, limit = 10): Promise<Product[]> {
    try {
      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: {
            more_like_this: {
              fields: ['name', 'brand', 'category', 'description'],
              like: [{ _index: this.indexName, _id: productId }],
              min_term_freq: 1,
              max_query_terms: 12,
            },
          },
          size: limit,
        },
      });

      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error(`Failed to get similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(products: Product[]): Promise<void> {
    try {
      const body = products.flatMap((product) => [
        { index: { _index: this.indexName, _id: product.id } },
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          model: product.model,
          sku: product.sku,
          upc: product.upc,
          ean: product.ean,
          isbn: product.isbn,
          category: product.category,
          subcategory: product.subcategory,
          description: product.description,
          specifications: product.specifications,
          attributes: product.attributes,
          averagePrice: product.averagePrice,
          lowestPrice: product.lowestPrice,
          highestPrice: product.highestPrice,
          priceCount: product.priceCount,
          scanCount: product.scanCount,
          confidenceScore: product.confidenceScore,
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      ]);

      await this.elasticsearchService.bulk({ body });
      this.logger.log(`Bulk indexed ${products.length} products`);
    } catch (error) {
      this.logger.error('Failed to bulk index products:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const response = await this.elasticsearchService.indices.stats({
        index: this.indexName,
      });

      return {
        index: this.indexName,
        documentCount: response.body.indices[this.indexName].total.docs.count,
        indexSize: response.body.indices[this.indexName].total.store.size_in_bytes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get index stats:', error);
      return null;
    }
  }
}