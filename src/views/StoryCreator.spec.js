import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StoryCreator from '@/views/StoryCreator.vue'
import GenerationService from '@/services/story/GenerationService'

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/services/story/GenerationService', () => {
  const startGeneration = vi.fn().mockResolvedValue({ batchId: 'batch-1', totalFrames: 10 })
  const getBatchStatus = vi.fn().mockResolvedValue({
    status: 'processing',
    progress: 20,
    completedFrames: 2,
    totalFrames: 10
  })
  const cancelBatch = vi.fn().mockResolvedValue()
  const createShareLink = vi.fn().mockResolvedValue({ shareUrl: 'https://example.com/share' })
  const extendGeneration = vi.fn().mockResolvedValue({ batchId: 'batch-2', totalFrames: 20 })

  return {
    default: vi.fn().mockImplementation(() => ({
      startGeneration,
      getBatchStatus,
      cancelBatch,
      createShareLink,
      extendGeneration
    }))
  }
})

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const stubs = {
  StoryBuilder: { template: '<div />' },
  LivePreview: { template: '<div />' },
  GlobalConfigComponent: { template: '<div />' },
  FramesConfigComponent: { template: '<div />' },
  SaveNotification: { template: '<div />' },
  TabView: { template: '<div><slot /></div>' },
  TabPanel: { template: '<div><slot /></div>' },
  Card: { template: '<div><slot /></div>' },
  Button: { template: '<button />' },
  Dialog: { template: '<div><slot /></div>' },
  Divider: { template: '<div />' },
  InputText: { template: '<input />' },
  ProgressBar: { template: '<div />' }
}

describe('StoryCreator integration', () => {
  it('starts a generation job and stores the batch id', async () => {
    const wrapper = mount(StoryCreator, {
      global: {
        stubs
      }
    })

    await wrapper.vm.handleGenerateStory({ totalFrames: 10 })
    await flushPromises()

    const serviceInstance = GenerationService.mock.results[0].value
    expect(serviceInstance.startGeneration).toHaveBeenCalled()
    expect(wrapper.vm.generationJobId).toBe('batch-1')

    wrapper.unmount()
  })

  it('extends a generation job using last parameters', async () => {
    const wrapper = mount(StoryCreator, {
      global: {
        stubs
      }
    })

    await wrapper.vm.handleGenerateStory({ totalFrames: 10 })
    await flushPromises()

    await wrapper.vm.extendGenerationJob()
    await flushPromises()

    const serviceInstance = GenerationService.mock.results[0].value
    expect(serviceInstance.extendGeneration).toHaveBeenCalledWith('batch-1', expect.any(Object))
    expect(wrapper.vm.generationJobId).toBe('batch-2')
    expect(wrapper.vm.generationSegments.length).toBe(2)

    wrapper.unmount()
  })
})
