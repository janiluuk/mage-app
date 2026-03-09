import service from '@/store/services/roles-service';
import createCrudModule from '@/store/createCrudModule';

// Consolidated: uses the shared CRUD module factory
export default createCrudModule(service, { resourceName: 'role' });
