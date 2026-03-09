import createJsonApiService from './createJsonApiService';

const createService = typeof createJsonApiService === 'function'
  ? createJsonApiService
  : createJsonApiService?.default;

export default createService('/roles');
