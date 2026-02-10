import service from '@/store/services/items-service';
import createCrudModule from '@/store/createCrudModule';

export default createCrudModule(service, {
  resourceName: 'item',
  hasUpload: true,
});
