/**
 * Sample TypeScript file for testing
 */

import { User } from './types';
import type { Config } from './config';

export interface Product {
  id: number;
  name: string;
  price: number;
}

export class ShoppingCart {
  private items: Product[] = [];

  addItem(product: Product): void {
    this.items.push(product);
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  return response.json();
}

export const calculateDiscount = (price: number, discount: number) => {
  return price * (1 - discount);
};

// Code smell: console.log
console.log('Debug mode');

// Code smell: any type
function processData(data: any): any {
  return data;
}
