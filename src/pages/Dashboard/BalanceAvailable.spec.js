import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BalanceAvailable from './BalanceAvailable.vue';
import { createStore } from 'vuex';

// Mock moment
vi.mock('moment', () => ({
  default: {
    duration: vi.fn((ms) => ({
      humanize: () => {
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        return `${days} days`;
      }
    }))
  }
}));

describe('BalanceAvailable.vue', () => {
  let store;
  let actions;
  let getters;

  beforeEach(() => {
    vi.clearAllMocks();
    
    actions = {
      'profile/getProfile': vi.fn().mockResolvedValue({}),
      'order/GET_PURCHASES': vi.fn().mockResolvedValue([])
    };

    getters = {
      'profile/getUserProfile': () => ({ balance: 100 }),
      'order/GET_PURCHASES': () => []
    };

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
  });

  it('renders the component', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('displays balance from store', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('100 credits');
  });

  it('calls fetchUserProfile and fetchPurchases on mounted', async () => {
    mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(actions['profile/getProfile']).toHaveBeenCalled();
    expect(actions['order/GET_PURCHASES']).toHaveBeenCalled();
  });

  it('displays next recharge time', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('Next recharge in');
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
    
    actions['profile/getProfile'] = vi.fn().mockRejectedValue(testError);
    
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

    mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading balance information:', testError);
    consoleErrorSpy.mockRestore();
  });

  it('calculates next month start correctly', () => {
    const wrapper = mount(BalanceAvailable, {
      global: {
        plugins: [store]
      }
    });

    const result = wrapper.vm.getNextMonthStart;
    // Should return a string like "X days" where X is the number of days until next month
    expect(result).toMatch(/\d+ days?/);
  });
});
