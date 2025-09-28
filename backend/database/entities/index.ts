import { User } from './user.entity';
import { Product } from './product.entity';
import { Retailer } from './retailer.entity';
import { Price } from './price.entity';
import { Scan } from './scan.entity';
import { PriceHistory } from './price-history.entity';

export { User, Product, Retailer, Price, Scan, PriceHistory };

export const entities = [
  User,
  Product,
  Retailer,
  Price,
  Scan,
  PriceHistory,
];