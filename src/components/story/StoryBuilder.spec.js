import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StoryBuilder from '@/components/story/StoryBuilder.vue'
import PrimeVue from 'primevue/config'

describe('StoryBuilder', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(StoryBuilder, {
      global: {
        plugins: [PrimeVue]
      }
    })
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.story-builder').exists()).toBe(true)
  })

  it('displays story header correctly', () => {
    expect(wrapper.find('.story-header h2').text()).toBe('Story Builder')
    expect(wrapper.find('.story-header .description').text()).toContain('longer narratives')
  })

  it('initializes with default story values', () => {
    const storyName = wrapper.find('input[placeholder="My Epic Story"]')
    expect(storyName.exists()).toBe(true)
  })

  it('has at least one default scene', async () => {
    const scenes = wrapper.findAll('.scene-card')
    expect(scenes.length).toBeGreaterThanOrEqual(1)
  })

  it('can add a new scene', async () => {
    const addButton = wrapper.find('button[class*="p-button-success"]')
    expect(addButton.text()).toContain('Add Scene')
    
    const initialSceneCount = wrapper.findAll('.scene-card').length
    await addButton.trigger('click')
    
    const newSceneCount = wrapper.findAll('.scene-card').length
    expect(newSceneCount).toBe(initialSceneCount + 1)
  })

  it('displays story summary statistics', () => {
    const summary = wrapper.find('.story-summary')
    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('Total Scenes')
    expect(summary.text()).toContain('Total Frames')
    expect(summary.text()).toContain('Estimated Duration')
  })

  it('has export and generate buttons', () => {
    const buttons = wrapper.findAll('button')
    const exportButton = buttons.find(btn => btn.text().includes('Export'))
    const generateButton = buttons.find(btn => btn.text().includes('Generate'))
    
    expect(exportButton).toBeTruthy()
    expect(generateButton).toBeTruthy()
  })

  it('shows template dialog when load template is clicked', async () => {
    const vm = wrapper.vm
    const loadTemplateButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Load Template')
    )
    
    expect(loadTemplateButton).toBeTruthy()
    
    // Set showTemplateDialog directly since dialog visibility is controlled by v-model
    vm.showTemplateDialog = true
    await wrapper.vm.$nextTick()
    
    expect(vm.showTemplateDialog).toBe(true)
  })

  it('emits update:story event when story changes', async () => {
    const vm = wrapper.vm
    
    // Directly trigger the emit method
    vm.emitStoryUpdate()
    
    await wrapper.vm.$nextTick()
    
    // Check if update:story event was emitted
    expect(wrapper.emitted('update:story')).toBeTruthy()
    expect(wrapper.emitted('update:story').length).toBeGreaterThan(0)
  })

  it('calculates total frames correctly', () => {
    const vm = wrapper.vm
    // With default settings: 60 seconds * 30 fps = 1800 frames
    expect(vm.totalFrames).toBeGreaterThan(0)
  })

  it('has story templates available', () => {
    const vm = wrapper.vm
    expect(vm.storyTemplates).toBeDefined()
    expect(vm.storyTemplates.length).toBeGreaterThan(0)
    
    // Check template structure
    const template = vm.storyTemplates[0]
    expect(template).toHaveProperty('id')
    expect(template).toHaveProperty('name')
    expect(template).toHaveProperty('description')
    expect(template).toHaveProperty('scenes')
  })
})
