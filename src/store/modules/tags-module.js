import service from '@/store/services/tags-service';
import createCrudModule from '@/store/createCrudModule';

export default createCrudModule(service, { resourceName: 'tag' });
