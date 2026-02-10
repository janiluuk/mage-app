import service from '@/store/services/users-service';
import createCrudModule from '@/store/createCrudModule';

export default createCrudModule(service, {
  resourceName: 'user',
  hasUpload: true,
});
