/**
 * @deprecated This file is deprecated. Use src/services/photos/PhotoService.js instead.
 * This file is kept for backward compatibility with existing imports.
 */
import PhotoServiceImpl from '../services/photos/PhotoService';

const photoServiceInstance = new PhotoServiceImpl();

export default class PhotoService {
    getImages() {
        return photoServiceInstance.getImages();
    }
}
