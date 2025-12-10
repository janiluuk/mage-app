import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from './Modal.vue'

describe('Modal Component', () => {
  const createWrapper = (slots = {}) => {
    return mount(Modal, {
      slots,
      global: {
        stubs: {
          transition: false
        }
      }
    })
  }

  describe('Rendering', () => {
    it('renders the component with correct structure', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.modal-mask').exists()).toBe(true)
      expect(wrapper.find('.modal-wrapper').exists()).toBe(true)
      expect(wrapper.find('.modal-container').exists()).toBe(true)
    })

    it('renders the modal sections (header, body, footer)', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.modal-header').exists()).toBe(true)
      expect(wrapper.find('.modal-body').exists()).toBe(true)
      expect(wrapper.find('.modal-footer').exists()).toBe(true)
    })

    it('renders header slot content', () => {
      const wrapper = createWrapper({
        header: '<h2>Test Header</h2>'
      })
      expect(wrapper.find('.modal-header').html()).toContain('Test Header')
    })

    it('renders body slot content', () => {
      const wrapper = createWrapper({
        body: '<p>Test Body Content</p>'
      })
      expect(wrapper.find('.modal-body').html()).toContain('Test Body Content')
    })

    it('renders footer slot content', () => {
      const wrapper = createWrapper({
        footer: '<button>Close</button>'
      })
      expect(wrapper.find('.modal-footer').html()).toContain('<button>Close</button>')
    })

    it('renders all slots together', () => {
      const wrapper = createWrapper({
        header: '<h2>Title</h2>',
        body: '<p>Content</p>',
        footer: '<button>OK</button>'
      })
      expect(wrapper.html()).toContain('Title')
      expect(wrapper.html()).toContain('Content')
      expect(wrapper.html()).toContain('OK')
    })
  })

  describe('Styling', () => {
    it('applies text-center class to modal body', () => {
      const wrapper = createWrapper()
      const modalBody = wrapper.find('.modal-body')
      expect(modalBody.classes()).toContain('text-center')
    })
  })

  describe('Events', () => {
    it('emits close event when closeModal method is called', () => {
      const wrapper = createWrapper()
      wrapper.vm.closeModal()
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close').length).toBe(1)
    })

    it('emits close event multiple times when closeModal is called multiple times', () => {
      const wrapper = createWrapper()
      wrapper.vm.closeModal()
      wrapper.vm.closeModal()
      wrapper.vm.closeModal()
      expect(wrapper.emitted('close').length).toBe(3)
    })
  })

  describe('Integration', () => {
    it('can be used with interactive content', async () => {
      const wrapper = createWrapper({
        footer: '<button class="close-btn">Close</button>'
      })
      
      // The modal itself should be visible
      expect(wrapper.find('.modal-container').exists()).toBe(true)
      
      // Footer content should be rendered
      expect(wrapper.html()).toContain('Close')
    })

    it('preserves complex HTML in slots', () => {
      const wrapper = createWrapper({
        body: `
          <div class="complex-content">
            <p>Paragraph 1</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        `
      })
      
      expect(wrapper.find('.complex-content').exists()).toBe(true)
      expect(wrapper.findAll('li').length).toBe(2)
    })
  })
})
