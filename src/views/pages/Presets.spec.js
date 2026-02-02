import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Presets from './Presets.vue';

vi.mock('@/components/preset/PresetLibrary.vue', () => ({
  default: {
    name: 'PresetLibrary',
    template: '<div data-testid="preset-library">PresetLibrary</div>'
  }
}));

describe('Presets', () => {
  it('renders page header and preset library', () => {
    const wrapper = mount(Presets);
    expect(wrapper.text()).toContain('Preset Library');
    expect(wrapper.find('[data-testid="preset-library"]').exists()).toBe(true);
  });
});

