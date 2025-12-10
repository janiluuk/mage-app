import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioVisualizer from './AudioVisualizer.vue'

// Mock THREE.js
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn()
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { z: 0 }
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    render: vi.fn()
  })),
  PointLight: vi.fn(() => ({
    position: { set: vi.fn() }
  })),
  BoxGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(() => ({
    color: { setHSL: vi.fn() }
  })),
  Mesh: vi.fn(() => ({
    position: { x: 0 },
    scale: { y: 1 },
    material: { color: { setHSL: vi.fn() } }
  }))
}))

// Mock AudioContext
global.AudioContext = vi.fn(() => ({
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn()
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 64,
    frequencyBinCount: 32,
    connect: vi.fn(),
    getByteFrequencyData: vi.fn()
  })),
  destination: {},
  resume: vi.fn()
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  // Don't actually run the animation loop in tests
  return 1
})

describe('AudioVisualizer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders a canvas element', () => {
      const wrapper = mount(AudioVisualizer)
      expect(wrapper.find('canvas').exists()).toBe(true)
    })

    it('applies visualizer class to canvas', () => {
      const wrapper = mount(AudioVisualizer)
      const canvas = wrapper.find('canvas')
      expect(canvas.classes()).toContain('visualizer')
    })

    it('renders without audio prop', () => {
      const wrapper = mount(AudioVisualizer)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Props', () => {
    it('accepts audio prop as Object', () => {
      const mockAudio = {
        addEventListener: vi.fn()
      }
      const wrapper = mount(AudioVisualizer, {
        props: {
          audio: mockAudio
        }
      })
      expect(wrapper.props('audio')).toStrictEqual(mockAudio)
    })

    it('handles null audio prop gracefully', () => {
      const wrapper = mount(AudioVisualizer, {
        props: {
          audio: null
        }
      })
      expect(wrapper.props('audio')).toBeNull()
    })
  })

  describe('Component Lifecycle', () => {
    it('component mounts without errors', () => {
      expect(() => {
        mount(AudioVisualizer)
      }).not.toThrow()
    })

    it('component mounts with audio prop without errors', () => {
      const mockAudio = {
        addEventListener: vi.fn()
      }
      expect(() => {
        mount(AudioVisualizer, {
          props: { audio: mockAudio }
        })
      }).not.toThrow()
    })
  })

  describe('Audio Integration', () => {
    it('sets up play event listener when audio prop is provided', async () => {
      const mockAudio = {
        addEventListener: vi.fn()
      }
      
      mount(AudioVisualizer, {
        props: { audio: mockAudio }
      })

      // Wait for async setup
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockAudio.addEventListener).toHaveBeenCalled()
    })
  })

  describe('Canvas Ref', () => {
    it('canvas ref is accessible', () => {
      const wrapper = mount(AudioVisualizer)
      expect(wrapper.vm.canvas).toBeDefined()
    })
  })
})
