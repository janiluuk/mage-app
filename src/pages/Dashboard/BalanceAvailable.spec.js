import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BalanceAvailable from './BalanceAvailable.vue';
import { createStore } from 'vuex';
import moment from 'moment';

// Mock moment
vi.mock('moment', () => {
  const mockMoment = {
    duration: vi.fn((ms) => ({
      humanize: () => {
        if (typeof ms === 'number') {
          const days = Math.floor(ms / (1000 * 60 * 60 * 24));
          if (days === 0) return 'a few seconds';
          if (days === 1) return 'a day';
          return `${days} days`;
        }
        return 'a month';
      }
    }))
  };
  return {
    default: mockMoment
  };
});

describe('BalanceAvailable.vue', () => {
  let store;
  let actions;
  let getters;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const profileActions = {
      getProfile: vi.fn().mockResolvedValue({})
    };
    
    const orderActions = {
      GET_PURCHASES: vi.fn().mockResolvedValue([])
    };

    getters = {
      'profile/getUserProfile': () => ({ balance: 100 }),
      'order/GET_PURCHASES': () => []
    };

    store = createStore({
      modules: {
        profile: {
          namespaced: true,
          actions: profileActions,
          getters: {
            getUserProfile: () => ({ balance: 100 })
          }
        },
        order: {
          namespaced: true,
          actions: orderActions,
          getters: {
            GET_PURCHASES: () => []
          }
        }
      }
    });
    
    // Store references for testing
    actions = {
      'profile/getProfile': profileActions.getProfile,
      'order/GET_PURCHASES': orderActions.GET_PURCHASES
    };
  });

  it('renders the component', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('displays balance from store', async () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('100 credits');
    wrapper.unmount();
  });

  it('calls fetchUserProfile and fetchPurchases on mounted', async () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    await vi.waitFor(() => {
      expect(actions['profile/getProfile']).toHaveBeenCalled();
      expect(actions['order/GET_PURCHASES']).toHaveBeenCalled();
    });
    
    wrapper.unmount();
  });

  it('displays next recharge time', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('Next recharge in');
    wrapper.unmount();
  });

  it('handles zero balance', () => {
    getters['profile/getUserProfile'] = () => ({ balance: 0 });
    store = createStore({
      modules: {
        profile: {
          namespaced: true,
          actions,
          getters
        },
        order: {
          namespaced: true,
          actions,
          getters
        }
      }
    });

    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('0 credits');
    wrapper.unmount();
  });

  it('clears interval on beforeUnmount', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    wrapper.vm.interval = setInterval(() => {}, 1000);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    wrapper.unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('logs error when profile fetch fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Profile fetch failed');
    
    const errorProfileActions = {
      getProfile: vi.fn().mockRejectedValue(testError)
    };
    
    const errorOrderActions = {
      GET_PURCHASES: vi.fn().mockResolvedValue([])
    };
    
    store = createStore({
      modules: {
        profile: {
          namespaced: true,
          actions: errorProfileActions,
          getters: {
            getUserProfile: () => ({ balance: 100 })
          }
        },
        order: {
          namespaced: true,
          actions: errorOrderActions,
          getters: {
            GET_PURCHASES: () => []
          }
        }
      }
    });

    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading balance information:', testError);
    }, { timeout: 2000 });
    
    consoleErrorSpy.mockRestore();
    wrapper.unmount();
  });

  it('calculates next month start correctly', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    const result = wrapper.vm.getNextMonthStart;
    // Should return a string with time info
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
