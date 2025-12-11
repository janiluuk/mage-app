/**
 * @deprecated This file is deprecated. Use src/services/products/ProductService.js instead.
 * This file is kept for backward compatibility with existing imports.
 */
import ProductServiceImpl from '../services/products/ProductService';

const productServiceInstance = new ProductServiceImpl();

export default class ProductService {
    getProductsSmall() {
        return productServiceInstance.getProductsSmall();
    }

    getProducts() {
        return productServiceInstance.getProducts();
    }

    getProductsWithOrdersSmall() {
        return productServiceInstance.getProductsWithOrdersSmall();
    }
}
