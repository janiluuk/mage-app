import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Dashboard from './Dashboard.vue';
import videoStatsService from '@/services/stats/VideoStatsService';

// Mock the service
vi.mock('@/services/stats/VideoStatsService', () => ({
  default: {
    getStats: vi.fn()
  }
}));

// Mock child components
vi.mock('@/pages/Dashboard/RecentJobs.vue', () => ({
  default: {
    name: 'RecentJobs',
    template: '<div>RecentJobs</div>'
  }
}));

vi.mock('@/pages/Dashboard/BalanceAvailable.vue', () => ({
  default: {
    name: 'BalanceAvailable',
    template: '<div>BalanceAvailable</div>'
  }
}));

// Mock layout composable
vi.mock('@/layout/composables/layout', () => ({
  useLayout: () => ({
    isDarkTheme: { value: false }
  })
}));

describe('Dashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    videoStatsService.getStats.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const wrapper = mount(Dashboard);
    
    expect(wrapper.find('.p-progress-spinner').exists()).toBe(true);
  });

  it('displays stats after loading', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(wrapper.text()).toContain('10'); // totalVideos
    expect(wrapper.text()).toContain('2');  // processingJobs
    expect(wrapper.text()).toContain('5');  // completedToday
  });

  it('displays error message on failure', async () => {
    videoStatsService.getStats.mockRejectedValue(new Error('API Error'));
    
    const wrapper = mount(Dashboard);
    
    // Wait for async operations to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(wrapper.find('.p-message').exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to load dashboard statistics');
  });

  it('calls getStats on mount', async () => {
    const mockStats = {
      totalVideos: 0,
      processingJobs: 0,
      completedToday: 0,
      failedJobs: 0
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    mount(Dashboard);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(1);
  });

  it('hides loading state after stats load', async () => {
    const mockStats = {
      totalVideos: 5,
      processingJobs: 1,
      completedToday: 3,
      failedJobs: 0
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    
    // Initially loading
    expect(wrapper.find('.p-progress-spinner').exists()).toBe(true);
    
    // Wait for loading to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Loading should be gone
    expect(wrapper.find('.p-progress-spinner').exists()).toBe(false);
  });

  it('sets up auto-refresh interval on mount', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    
    // Initial call
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(1);
    
    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);
    await wrapper.vm.$nextTick();
    
    // Should be called again
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(2);
    
    wrapper.unmount();
  });

  it('clears interval on unmount', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    wrapper.unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('continues to refresh stats at 30 second intervals', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    
    // Initial call
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(1);
    
    // Fast-forward 60 seconds (2 intervals)
    vi.advanceTimersByTime(60000);
    await wrapper.vm.$nextTick();
    
    // Should be called 3 times total (initial + 2 intervals)
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(3);
    
    wrapper.unmount();
  });
});
