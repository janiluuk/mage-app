import createJsonApiService from './createJsonApiService';
import { API_V1_BASE_URL } from '@/utils/api-base-urls';

export default createJsonApiService('/items', {
  baseUrl: API_V1_BASE_URL,
  getInclude: 'category,tags',
  addInclude: 'category,tags',
  updateInclude: 'category,tags',
  serializeIncludeNames: ['categories'],
  hasUpload: true,
  uploadPath: '/uploads/items/:id/image',
});
