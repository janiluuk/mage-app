import service from '@/store/services/categories-service';
import createCrudModule from '@/store/createCrudModule';

export default createCrudModule(service, { resourceName: 'category' });
