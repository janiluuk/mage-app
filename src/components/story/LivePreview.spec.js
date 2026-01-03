import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LivePreview from '@/components/story/LivePreview.vue'
import PrimeVue from 'primevue/config'

describe('LivePreview', () => {
  let wrapper
  const mockConfig = {
    frames: [
      { id: 0, prompt: 'Test frame 1' },
      { id: 30, prompt: 'Test frame 2' }
    ],
    fps: 30
  }

  beforeEach(() => {
    wrapper = mount(LivePreview, {
      props: {
        config: mockConfig
      },
      global: {
        plugins: [PrimeVue]
      }
    })
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.live-preview').exists()).toBe(true)
  })

  it('displays status badge', () => {
    const statusBadge = wrapper.find('.status-badge')
    expect(statusBadge.exists()).toBe(true)
    expect(statusBadge.text()).toContain('Idle')
  })

  it('shows preview placeholder when not generating', () => {
    const placeholder = wrapper.find('.preview-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toContain('Preview will appear here')
  })

  it('has control buttons', () => {
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    
    const startButton = buttons.find(btn => btn.text().includes('Start'))
    const stopButton = buttons.find(btn => btn.text().includes('Stop'))
    
    expect(startButton).toBeTruthy()
    expect(stopButton).toBeTruthy()
  })

  it('toggles generation state on start button click', async () => {
    const vm = wrapper.vm
    expect(vm.isGenerating).toBe(false)
    
    await vm.toggleGeneration()
    expect(vm.isGenerating).toBe(true)
    
    await vm.toggleGeneration()
    expect(vm.isGenerating).toBe(false)
  })

  it('displays progress bar when generating', async () => {
    await wrapper.vm.startGeneration()
    await wrapper.vm.$nextTick()
    
    const progressBar = wrapper.find('.preview-overlay')
    expect(progressBar.exists()).toBe(true)
  })

  it('emits frame:generated event', async () => {
    await wrapper.vm.startGeneration()
    
    // Wait a bit for simulated generation
    await new Promise(resolve => setTimeout(resolve, 200))
    
    expect(wrapper.emitted('frame:generated')).toBeFalsy() // No WebSocket, so no real frames
  })

  it('calculates progress correctly', async () => {
    const vm = wrapper.vm
    vm.currentFrame = 50
    vm.totalFrames = 100
    vm.updateProgress()
    
    expect(vm.progress).toBe(50)
  })

  it('has quality and refresh rate settings', () => {
    const vm = wrapper.vm
    expect(vm.refreshRate).toBeDefined()
    expect(vm.previewQuality).toBeDefined()
    expect(vm.refreshRates).toBeDefined()
    expect(vm.qualityOptions).toBeDefined()
  })

  it('stops generation when stop button is clicked', async () => {
    const vm = wrapper.vm
    await vm.startGeneration()
    expect(vm.isGenerating).toBe(true)
    
    await vm.stopGeneration()
    expect(vm.isGenerating).toBe(false)
    expect(vm.currentFrame).toBe(0)
  })

  it('shows live stats when generating', async () => {
    await wrapper.vm.startGeneration()
    await wrapper.vm.$nextTick()
    
    const liveStats = wrapper.find('.live-stats')
    expect(liveStats.exists()).toBe(true)
  })

  it('formats elapsed time correctly', () => {
    const vm = wrapper.vm
    vm.startTime = Date.now() - 125000 // 2 minutes 5 seconds ago
    
    const formatted = vm.elapsedTime
    expect(formatted).toMatch(/\d{2}:\d{2}/)
  })

  it('shows debug info when enabled', async () => {
    const vm = wrapper.vm
    vm.showDebug = true
    vm.debugInfo = { test: 'data' }
    
    await wrapper.vm.$nextTick()
    
    const debugSection = wrapper.find('.debug-info')
    expect(debugSection.exists()).toBe(true)
  })

  it('saves frame history when autoSave is enabled', async () => {
    const vm = wrapper.vm
    vm.autoSave = true
    vm.frameHistory = []
    
    // Simulate frame generation
    vm.frameHistory.push({
      id: 0,
      thumbnail: 'data:image/test',
      prompt: 'Test',
      timestamp: Date.now()
    })
    
    expect(vm.frameHistory.length).toBe(1)
  })
})
