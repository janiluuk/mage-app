/**
 * @deprecated This file is deprecated. Use src/services/customers/CustomerService.js instead.
 * This file is kept for backward compatibility with existing imports.
 */
import CustomerServiceImpl from '../services/customers/CustomerService';

const customerServiceInstance = new CustomerServiceImpl();

export default class CustomerService {
    getCustomersSmall() {
        return customerServiceInstance.getCustomersSmall();
    }

    getCustomersMedium() {
        return customerServiceInstance.getCustomersMedium();
    }

    getCustomersLarge() {
        return customerServiceInstance.getCustomersLarge();
    }

    getCustomersXLarge() {
        return customerServiceInstance.getCustomersXLarge();
    }

    getCustomers(params) {
        return customerServiceInstance.getCustomers(params);
    }
}
