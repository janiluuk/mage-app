import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AuthMenu from '@/layout/AuthMenu.vue';
import Menu from 'primevue/menu';

describe('AuthMenu Dropdown Functionality', () => {
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

  it('should toggle menu when Account button is clicked', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
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

    // Verify menu ref is accessible
    expect(wrapper.vm.menu).toBeDefined();
    
    // Find the Account button (the one that triggers the dropdown)
    const accountButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Account')
    );
    
    expect(accountButton).toBeDefined();

    // Mock the menu component's toggle method
    const menuComponent = wrapper.findComponent(Menu);
    const toggleSpy = vi.spyOn(menuComponent.vm, 'toggle');

    // Click the Account button
    await accountButton.trigger('click');

    // Verify toggle was called
    expect(toggleSpy).toHaveBeenCalled();
  });

  it('should have menu ref properly connected to template', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
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

    // The menu ref from setup should be defined
    expect(wrapper.vm.menu).toBeDefined();
    
    // Verify we can access the menu component
    const menuComponent = wrapper.findComponent(Menu);
    expect(menuComponent.exists()).toBe(true);
    
    // Verify the menu has the toggle method
    expect(typeof menuComponent.vm.toggle).toBe('function');
  });

  it('should render dropdown menu items correctly', () => {
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

    // Get the overlay menu items
    const menuItems = wrapper.vm.getOverlayMenu();
    
    // Should have 3 items: Profile, separator, Logout
    expect(menuItems).toHaveLength(3);
    
    // Check Profile menu item
    expect(menuItems[0].label).toBe('Profile');
    expect(menuItems[0].icon).toBe('pi pi-user');
    expect(typeof menuItems[0].command).toBe('function');
    
    // Check separator
    expect(menuItems[1].separator).toBe(true);
    
    // Check Logout menu item
    expect(menuItems[2].label).toBe('Logout');
    expect(menuItems[2].icon).toBe('pi pi-sign-out');
    expect(typeof menuItems[2].command).toBe('function');
  });
});
