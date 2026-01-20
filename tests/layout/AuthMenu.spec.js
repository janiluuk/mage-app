import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AuthMenu from '@/layout/AuthMenu.vue';
import Menu from 'primevue/menu';

describe('AuthMenu', () => {
  let store;
  let wrapper;
  let mockToast;

  beforeEach(() => {
    // Create a mock store with required modules
    store = createStore({
      modules: {
        AuthService: {
          namespaced: true,
          getters: {
            getLoggedUser: () => ({ email: 'test@example.com' })
          },
          actions: {
            signOut: vi.fn()
          }
        },
        notification: {
          namespaced: true,
          actions: {
            setErrorNotification: vi.fn()
          }
        }
      }
    });

    // Mock toast service
    mockToast = {
      add: vi.fn()
    };
  });

  it('should use $toast for logout notification', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Menu: true,
          Toast: true
        },
        mocks: {
          $router: {
            push: vi.fn(),
            currentRoute: {
              value: {
                path: '/library'
              }
            }
          }
        }
      },
      props: {
        user: {
          email: 'test@example.com'
        }
      }
    });

    // Set up toast on the component instance (from setup function)
    wrapper.vm.toast = mockToast;

    // Get the menu items
    const menuItems = wrapper.vm.getOverlayMenu();
    
    // Find the logout menu item
    const logoutItem = menuItems.find(item => item.label === 'Logout');
    
    expect(logoutItem).toBeDefined();
    expect(logoutItem.command).toBeDefined();

    // Execute the logout command
    await logoutItem.command();

    // Verify that toast.add was called with the correct parameters
    expect(mockToast.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'CYA!',
      detail: 'You have been logged out.'
    });
  });

  it('should not throw error if $toast is not available', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Menu: true,
          Toast: true
        },
        mocks: {
          $router: {
            push: vi.fn(),
            currentRoute: {
              value: {
                path: '/library'
              }
            }
          }
        }
      },
      props: {
        user: {
          email: 'test@example.com'
        }
      }
    });

    // Get the menu items
    const menuItems = wrapper.vm.getOverlayMenu();
    
    // Find the logout menu item
    const logoutItem = menuItems.find(item => item.label === 'Logout');

    // Execute the logout command without $toast - should not throw
    expect(() => logoutItem.command()).not.toThrow();
  });

  it('should properly expose menu and topbarMenuActive from setup', () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Menu: true,
          Toast: true
        },
        mocks: {
          $toast: mockToast,
          $router: {
            push: vi.fn(),
            currentRoute: {
              value: {
                path: '/library'
              }
            }
          }
        }
      },
      props: {
        user: {
          email: 'test@example.com'
        }
      }
    });

    // Verify that setup returns are accessible
    expect(wrapper.vm.menu).toBeDefined();
    expect(wrapper.vm.topbarMenuActive).toBeDefined();
  });

  it('should not expose toast from setup', () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Menu: true,
          Toast: true
        },
        mocks: {
          $toast: mockToast,
          $router: {
            push: vi.fn(),
            currentRoute: {
              value: {
                path: '/library'
              }
            }
          }
        }
      },
      props: {
        user: {
          email: 'test@example.com'
        }
      }
    });

    // Verify that toast is null when not available (PrimeVue not configured in test)
    // The component handles this gracefully
    expect(wrapper.vm.toast).toBeNull();
  });
});
