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
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders loading state initially', async () => {
    videoStatsService.getStats.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const wrapper = mount(Dashboard);
    
    // Check immediately, synchronously
    expect(wrapper.vm.loading).toBe(true);
    
    wrapper.unmount();
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
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('10');
    });
    
    expect(wrapper.text()).toContain('2');  // processingJobs
    expect(wrapper.text()).toContain('5');  // completedToday
    
    wrapper.unmount();
  });

  it('displays error message on failure', async () => {
    videoStatsService.getStats.mockRejectedValueOnce(new Error('API Error'));
    
    const wrapper = mount(Dashboard);
    
    // Wait for async operations to complete
    await vi.waitFor(() => {
      expect(wrapper.vm.error).toBeTruthy();
    }, { timeout: 2000 });
    
    expect(wrapper.text()).toContain('Failed to load dashboard statistics');
    
    wrapper.unmount();
  });

  it('calls getStats on mount', async () => {
    const mockStats = {
      totalVideos: 0,
      processingJobs: 0,
      completedToday: 0,
      failedJobs: 0
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    
    await wrapper.vm.$nextTick();
    
    expect(videoStatsService.getStats).toHaveBeenCalled();
    
    wrapper.unmount();
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
    expect(wrapper.vm.loading).toBe(true);
    
    // Wait for loading to complete
    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });
    
    wrapper.unmount();
  });

  it('sets up auto-refresh interval on mount', async () => {
    vi.useFakeTimers();
    
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
    await vi.advanceTimersByTimeAsync(30000);
    
    // Should be called again
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(2);
    
    wrapper.unmount();
    vi.useRealTimers();
  });

  it('clears interval on unmount', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    
    wrapper.unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('continues to refresh stats at 30 second intervals', async () => {
    vi.useFakeTimers();
    
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
    await vi.advanceTimersByTimeAsync(60000);
    
    // Should be called 3 times total (initial + 2 intervals)
    expect(videoStatsService.getStats).toHaveBeenCalledTimes(3);
    
    wrapper.unmount();
    vi.useRealTimers();
  });
});
