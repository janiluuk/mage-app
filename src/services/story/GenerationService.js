import requestService from '@/services/request-service/ApiRequestService'

class GenerationService {
  constructor({ request = requestService, websocketFactory = (url) => new WebSocket(url) } = {}) {
    this.request = request
    this.websocketFactory = websocketFactory
  }

  async startGeneration(config) {
    const response = await this.request.post('/stories/generate', config)
    return response.data
  }

  async extendGeneration(batchId, config) {
    const payload = {
      ...config,
      extendFrom: batchId
    }
    const response = await this.request.post('/stories/generate', payload)
    return response.data
  }

  async getBatchStatus(batchId) {
    const response = await this.request.get(`/stories/batch/${batchId}`)
    return response.data
  }

  async pauseBatch(batchId) {
    await this.request.post(`/stories/batch/${batchId}/pause`)
  }

  async resumeBatch(batchId) {
    await this.request.post(`/stories/batch/${batchId}/resume`)
  }

  async cancelBatch(batchId) {
    await this.request.delete(`/stories/batch/${batchId}`)
  }

  async persistFrame(batchId, payload) {
    const response = await this.request.post(`/stories/batch/${batchId}/frames`, payload)
    return response.data
  }

  async createShareLink(payload) {
    const response = await this.request.post('/stories/share', payload)
    return response.data
  }

  connectWebSocket({ websocketUrl, config, refreshRate, quality, batchId, onMessage, onError, onClose } = {}) {
    if (!websocketUrl) {
      throw new Error('WebSocket URL is required to start live preview')
    }

    const socket = this.websocketFactory(websocketUrl)

    socket.onopen = () => {
      socket.send(JSON.stringify({
        action: 'start',
        config,
        refreshRate,
        quality,
        batchId
      }))
    }

    socket.onmessage = (event) => {
      if (onMessage) {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (error) {
          onError?.(error)
        }
      }
    }

    socket.onerror = (error) => {
      if (onError) {
        onError(error)
      }
    }

    socket.onclose = () => {
      if (onClose) {
        onClose()
      }
    }

    return socket
  }
}

export default GenerationService
