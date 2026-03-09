import createJsonApiService from './createJsonApiService';

const createService = typeof createJsonApiService === 'function'
  ? createJsonApiService
  : createJsonApiService?.default;

export default createService('/users', {
  getInclude: 'roles',
  addInclude: 'roles',
  hasUpload: true,
  uploadPath: '/uploads/users/:id/profile-image',
});
