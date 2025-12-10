import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

describe('Pagination Component', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(Pagination, {
      props: {
        value: 1,
        total: 100,
        perPage: 10,
        ...props
      }
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  describe('Rendering', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('ul.pagination').exists()).toBe(true)
    })

    it('applies the correct pagination class based on type prop', () => {
      const wrapperPrimary = createWrapper({ type: 'primary' })
      expect(wrapperPrimary.find('.pagination-primary').exists()).toBe(true)

      const wrapperDanger = createWrapper({ type: 'danger' })
      expect(wrapperDanger.find('.pagination-danger').exists()).toBe(true)
    })

    it('displays the correct number of page items', () => {
      const wrapperSmall = createWrapper({ total: 30, perPage: 10 })
      // Should show 3 pages: 1, 2, 3
      const pageItems = wrapperSmall.findAll('.page-item:not(.prev-page):not(.next-page)')
      expect(pageItems.length).toBe(3)
    })

    it('highlights the active page', () => {
      const wrapperPage2 = createWrapper({ value: 2 })
      const pageItems = wrapperPage2.findAll('.page-item:not(.prev-page):not(.next-page)')
      // Find the page item with text "2"
      const page2Item = pageItems.find(item => item.text() === '2')
      expect(page2Item.classes()).toContain('active')
    })
  })

  describe('Computed Properties', () => {
    it('calculates totalPages correctly from total and perPage', () => {
      const wrapper100 = createWrapper({ total: 100, perPage: 10 })
      expect(wrapper100.vm.totalPages).toBe(10)

      const wrapper95 = createWrapper({ total: 95, perPage: 10 })
      expect(wrapper95.vm.totalPages).toBe(10) // ceil(95/10) = 10
    })

    it('uses pageCount prop when provided', () => {
      const wrapperWithPageCount = createWrapper({ pageCount: 5 })
      expect(wrapperWithPageCount.vm.totalPages).toBe(5)
    })

    it('calculates minPage and maxPage for pagination window', () => {
      const wrapperPage1 = createWrapper({ total: 100, perPage: 10, value: 1 })
      expect(wrapperPage1.vm.minPage).toBe(1)
      expect(wrapperPage1.vm.maxPage).toBe(5) // default pages to display

      const wrapperPage5 = createWrapper({ total: 100, perPage: 10, value: 5 })
      expect(wrapperPage5.vm.minPage).toBe(3)
      expect(wrapperPage5.vm.maxPage).toBe(7)
    })
  })

  describe('Navigation', () => {
    it('emits input event when clicking a page number', async () => {
      const pageItems = wrapper.findAll('.page-item:not(.prev-page):not(.next-page)')
      const page2 = pageItems[1] // Second page
      
      await page2.find('a').trigger('click')
      
      expect(wrapper.emitted('input')).toBeTruthy()
      expect(wrapper.emitted('input')[0]).toEqual([2])
    })

    it('navigates to next page when clicking next button', async () => {
      const wrapperPage1 = createWrapper({ value: 1 })
      const nextButton = wrapperPage1.find('.next-page a')
      
      await nextButton.trigger('click')
      
      expect(wrapperPage1.emitted('input')).toBeTruthy()
      expect(wrapperPage1.emitted('input')[0]).toEqual([2])
    })

    it('navigates to previous page when clicking prev button', async () => {
      const wrapperPage2 = createWrapper({ value: 2 })
      const prevButton = wrapperPage2.find('.prev-page a')
      
      await prevButton.trigger('click')
      
      expect(wrapperPage2.emitted('input')).toBeTruthy()
      expect(wrapperPage2.emitted('input')[0]).toEqual([1])
    })

    it('disables prev button on first page', () => {
      const wrapperPage1 = createWrapper({ value: 1 })
      const prevButton = wrapperPage1.find('.prev-page')
      expect(prevButton.classes()).toContain('disabled')
    })

    it('disables next button on last page', () => {
      const wrapperLastPage = createWrapper({ value: 10, total: 100, perPage: 10 })
      const nextButton = wrapperLastPage.find('.next-page')
      expect(nextButton.classes()).toContain('disabled')
    })

    it('does not emit event when clicking disabled prev button', async () => {
      const wrapperPage1 = createWrapper({ value: 1 })
      const prevButton = wrapperPage1.find('.prev-page a')
      
      await prevButton.trigger('click')
      
      // Should not emit because already on first page
      expect(wrapperPage1.emitted('input')).toBeFalsy()
    })

    it('does not emit event when clicking disabled next button', async () => {
      const wrapperLastPage = createWrapper({ value: 10, total: 100, perPage: 10 })
      const nextButton = wrapperLastPage.find('.next-page a')
      
      await nextButton.trigger('click')
      
      // Should not emit because already on last page
      expect(wrapperLastPage.emitted('input')).toBeFalsy()
    })
  })

  describe('Props Validation', () => {
    it('accepts valid type prop values', () => {
      const validTypes = ['default', 'primary', 'danger', 'success', 'warning', 'info', 'rose']
      validTypes.forEach(type => {
        const wrapperType = createWrapper({ type })
        expect(wrapperType.find(`.pagination-${type}`).exists()).toBe(true)
      })
    })

    it('handles noArrows prop', () => {
      const wrapperNoArrows = createWrapper({ noArrows: true })
      expect(wrapperNoArrows.find('.prev-page.no-arrows').exists()).toBe(true)
      expect(wrapperNoArrows.find('.next-page.no-arrows').exists()).toBe(true)
    })
  })

  describe('Watchers', () => {
    it('resets to page 1 when perPage changes', async () => {
      const wrapperWatch = createWrapper({ value: 3, perPage: 10 })
      
      await wrapperWatch.setProps({ perPage: 20 })
      
      expect(wrapperWatch.emitted('input')).toBeTruthy()
      expect(wrapperWatch.emitted('input')[0]).toEqual([1])
    })

    it('resets to page 1 when total changes', async () => {
      const wrapperWatch = createWrapper({ value: 3, total: 100 })
      
      await wrapperWatch.setProps({ total: 200 })
      
      expect(wrapperWatch.emitted('input')).toBeTruthy()
      expect(wrapperWatch.emitted('input')[0]).toEqual([1])
    })
  })

  describe('Edge Cases', () => {
    it('handles total of 0', () => {
      const wrapperEmpty = createWrapper({ total: 0 })
      expect(wrapperEmpty.vm.totalPages).toBe(1)
    })

    it('handles single page scenario', () => {
      const wrapperSingle = createWrapper({ total: 5, perPage: 10 })
      expect(wrapperSingle.vm.totalPages).toBe(1)
      const prevButton = wrapperSingle.find('.prev-page')
      const nextButton = wrapperSingle.find('.next-page')
      expect(prevButton.classes()).toContain('disabled')
      expect(nextButton.classes()).toContain('disabled')
    })

    it('correctly displays pagination window at the end', () => {
      const wrapperEnd = createWrapper({ value: 10, total: 100, perPage: 10 })
      expect(wrapperEnd.vm.minPage).toBe(6) // Shows pages 6-10
      expect(wrapperEnd.vm.maxPage).toBe(10)
    })
  })
})
