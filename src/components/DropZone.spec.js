import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DropZone from './DropZone.vue'

// Mock vue3-dropzone
vi.mock('vue3-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({
      class: 'dropzone-root',
      role: 'button'
    }),
    getInputProps: () => ({
      type: 'file',
      accept: '*'
    }),
    isDragActive: false,
    open: vi.fn()
  }))
}))

describe('DropZone Component', () => {
  const createWrapper = () => {
    return mount(DropZone)
  }

  describe('Rendering', () => {
    it('renders the component', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders an input element for file selection', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('renders a button to open file dialog', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('open')
    })

    it('renders default instruction text when not dragging', () => {
      const wrapper = createWrapper()
      expect(wrapper.html()).toContain("Drag 'n' drop some files here, or click to select files")
    })

    it('applies minimum dimensions style', () => {
      const wrapper = createWrapper()
      const outerDiv = wrapper.find('div')
      expect(outerDiv.attributes('style')).toContain('min-width')
      expect(outerDiv.attributes('style')).toContain('800px')
      expect(outerDiv.attributes('style')).toContain('min-height')
      expect(outerDiv.attributes('style')).toContain('200px')
    })
  })

  describe('Component Setup', () => {
    it('initializes with useDropzone composition', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.getRootProps).toBeDefined()
      expect(wrapper.vm.getInputProps).toBeDefined()
    })

    it('has getRootProps method', () => {
      const wrapper = createWrapper()
      expect(typeof wrapper.vm.getRootProps).toBe('function')
    })

    it('has getInputProps method', () => {
      const wrapper = createWrapper()
      expect(typeof wrapper.vm.getInputProps).toBe('function')
    })
  })

  describe('File Selection', () => {
    it('input has type file attribute', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('file')
    })

    it('provides open functionality', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.open).toBeDefined()
    })
  })

  describe('User Interaction', () => {
    it('open button is clickable', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('button')
      
      await button.trigger('click')
      
      // The button click should work without errors
      expect(button.exists()).toBe(true)
    })
  })

  describe('Component Name', () => {
    it('has correct component name', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.$options.name).toBe('UseDropzoneDemo')
    })
  })
})
