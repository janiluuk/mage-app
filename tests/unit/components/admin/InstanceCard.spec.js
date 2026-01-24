import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import InstanceCard from '@/components/admin/InstanceCard.vue';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

describe('InstanceCard', () => {
  let wrapper;
  
  const mockInstance = {
    id: 1,
    name: 'ComfyUI-1',
    type: 'comfyui',
    health_status: 'online',
    queue_count: 2,
    processing_count: 1,
    metrics: {
      gpu_utilization: 75.5,
      cpu_utilization: 45.2,
      memory_utilization: 60.8,
      current_model: 'stable-diffusion-xl'
    }
  };

  beforeEach(() => {
    wrapper = mount(InstanceCard, {
      props: {
        instance: mockInstance
      },
      global: {
        components: {
          Button,
          ProgressBar,
          Tag
        }
      }
    });
  });

  it('renders instance name', () => {
    expect(wrapper.text()).toContain('ComfyUI-1');
  });

  it('renders instance type', () => {
    expect(wrapper.text()).toContain('comfyui');
  });

  it('displays health status as Online', () => {
    expect(wrapper.text()).toContain('Online');
  });

  it('displays GPU utilization', () => {
    expect(wrapper.text()).toContain('GPU Utilization');
    expect(wrapper.text()).toContain('76'); // Rounded from 75.5
  });

  it('displays CPU utilization', () => {
    expect(wrapper.text()).toContain('CPU Utilization');
    expect(wrapper.text()).toContain('45'); // Rounded from 45.2
  });

  it('displays memory utilization', () => {
    expect(wrapper.text()).toContain('Memory Utilization');
    expect(wrapper.text()).toContain('61'); // Rounded from 60.8
  });

  it('displays current model', () => {
    expect(wrapper.text()).toContain('stable-diffusion-xl');
  });

  it('displays queue status', () => {
    expect(wrapper.text()).toContain('Queue: 2');
    expect(wrapper.text()).toContain('Processing: 1');
  });

  it('emits view-history event when View History button is clicked', async () => {
    const viewHistoryButton = wrapper.find('[data-testid="view-history-button"]');
    
    await viewHistoryButton.trigger('click');
    
    expect(wrapper.emitted('view-history')).toBeTruthy();
    expect(wrapper.emitted('view-history')[0]).toEqual([1]);
  });

  it('emits view-jobs event when View Jobs button is clicked', async () => {
    const viewJobsButton = wrapper.find('[data-testid="view-jobs-button"]');
    
    await viewJobsButton.trigger('click');
    
    expect(wrapper.emitted('view-jobs')).toBeTruthy();
    expect(wrapper.emitted('view-jobs')[0]).toEqual([1]);
  });

  it('handles instance with no metrics', () => {
    const instanceWithoutMetrics = {
      id: 2,
      name: 'ComfyUI-2',
      type: 'comfyui',
      health_status: 'offline'
    };

    wrapper = mount(InstanceCard, {
      props: {
        instance: instanceWithoutMetrics
      },
      global: {
        components: {
          Button,
          ProgressBar,
          Tag
        }
      }
    });

    expect(wrapper.text()).toContain('ComfyUI-2');
    expect(wrapper.text()).toContain('N/A');
  });

  it('applies correct health status severity', () => {
    const onlineInstance = { ...mockInstance, health_status: 'online' };
    wrapper = mount(InstanceCard, {
      props: { instance: onlineInstance },
      global: { components: { Button, ProgressBar, Tag } }
    });
    
    const tag = wrapper.findComponent(Tag);
    expect(tag.props('severity')).toBe('success');
  });

  it('handles degraded health status', () => {
    const degradedInstance = { ...mockInstance, health_status: 'degraded' };
    wrapper = mount(InstanceCard, {
      props: { instance: degradedInstance },
      global: { components: { Button, ProgressBar, Tag } }
    });
    
    const tag = wrapper.findComponent(Tag);
    expect(tag.props('severity')).toBe('warning');
    expect(wrapper.text()).toContain('Degraded');
  });

  it('handles offline health status', () => {
    const offlineInstance = { ...mockInstance, health_status: 'offline' };
    wrapper = mount(InstanceCard, {
      props: { instance: offlineInstance },
      global: { components: { Button, ProgressBar, Tag } }
    });
    
    const tag = wrapper.findComponent(Tag);
    expect(tag.props('severity')).toBe('danger');
    expect(wrapper.text()).toContain('Offline');
  });
});
