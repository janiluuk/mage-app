import service from '@/store/services/roles-service';
import createCrudModule from '@/store/createCrudModule';

export default createCrudModule(service, { resourceName: 'role' });
