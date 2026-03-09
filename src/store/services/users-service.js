import createJsonApiService from './createJsonApiService';

export default createJsonApiService('/users', {
  getInclude: 'roles',
  addInclude: 'roles',
  hasUpload: true,
  uploadPath: '/uploads/users/:id/profile-image',
});
