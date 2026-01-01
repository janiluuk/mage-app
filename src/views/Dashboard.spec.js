import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
