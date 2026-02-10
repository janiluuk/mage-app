import service from '@/store/services/tags-service';
import createCrudModule from '@/store/createCrudModule';

// Consolidated: uses the shared CRUD module factory
export const tags = createCrudModule(service, { resourceName: 'tag' });
