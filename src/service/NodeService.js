/**
 * @deprecated This file is deprecated. Use src/services/nodes/NodeService.js instead.
 * This file is kept for backward compatibility with existing imports.
 */
import NodeServiceImpl from '../services/nodes/NodeService';

const nodeServiceInstance = new NodeServiceImpl();

export default class NodeService {
    getTreeTableNodes() {
        return nodeServiceInstance.getTreeTableNodes();
    }

    getTreeNodes() {
        return nodeServiceInstance.getTreeNodes();
    }
}
