import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FFMpegWorkerStatus from '@/components/admin/FFMpegWorkerStatus.vue';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

describe('FFMpegWorkerStatus', () => {
  it('displays active, pending, and total queue counts', () => {
    const ffmpegData = {
      active_count: 2,
      pending_count: 3,
      active_jobs: []
    };

    const wrapper = mount(FFMpegWorkerStatus, {
      props: { ffmpegData },
      global: {
        components: { ProgressBar, Tag }
      }
    });

    expect(wrapper.text()).toContain('2'); // active count
    expect(wrapper.text()).toContain('3'); // pending count
    expect(wrapper.text()).toContain('5'); // total queue (2+3)
  });

  it('displays active jobs list', () => {
    const ffmpegData = {
      active_count: 2,
      pending_count: 1,
      active_jobs: [
        { id: 101, filename: 'video_123.mp4', progress: 40 },
        { id: 102, filename: 'video_456.mp4', progress: 75 }
      ]
    };

    const wrapper = mount(FFMpegWorkerStatus, {
      props: { ffmpegData },
      global: {
        components: { ProgressBar, Tag }
      }
    });

    expect(wrapper.text()).toContain('video_123.mp4');
    expect(wrapper.text()).toContain('video_456.mp4');
    expect(wrapper.text()).toContain('40%');
    expect(wrapper.text()).toContain('75%');
  });

  it('shows no active jobs message when list is empty', () => {
    const ffmpegData = {
      active_count: 0,
      pending_count: 0,
      active_jobs: []
    };

    const wrapper = mount(FFMpegWorkerStatus, {
      props: { ffmpegData },
      global: {
        components: { ProgressBar, Tag }
      }
    });

    expect(wrapper.text()).toContain('No active encoding jobs');
  });

  it('handles missing filename in active job', () => {
    const ffmpegData = {
      active_count: 1,
      pending_count: 0,
      active_jobs: [
        { id: 101, progress: 50 }
      ]
    };

    const wrapper = mount(FFMpegWorkerStatus, {
      props: { ffmpegData },
      global: {
        components: { ProgressBar, Tag }
      }
    });

    expect(wrapper.text()).toContain('Job #101');
  });

  it('handles default props when no data provided', () => {
    const wrapper = mount(FFMpegWorkerStatus, {
      global: {
        components: { ProgressBar, Tag }
      }
    });

    expect(wrapper.text()).toContain('0'); // active count
    expect(wrapper.text()).toContain('No active encoding jobs');
  });

  it('displays progress bars for each active job', () => {
    const ffmpegData = {
      active_count: 2,
      pending_count: 0,
      active_jobs: [
        { id: 101, filename: 'video1.mp4', progress: 40 },
        { id: 102, filename: 'video2.mp4', progress: 75 }
      ]
    };

    const wrapper = mount(FFMpegWorkerStatus, {
      props: { ffmpegData },
      global: {
        components: { ProgressBar, Tag }
      }
    });

    const progressBars = wrapper.findAllComponents(ProgressBar);
    expect(progressBars.length).toBe(2);
    expect(progressBars[0].props('value')).toBe(40);
    expect(progressBars[1].props('value')).toBe(75);
  });
});
