import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AuthMenu from '@/layout/AuthMenu.vue';
import * as authActions from '@/store/modules/auth/types/actions';
import * as notificationActions from '@/store/modules/notification/types/actions';

describe('AuthMenu Dropdown Functionality', () => {
  let store;
  let wrapper;
  let push;

  beforeEach(() => {
    push = vi.fn();

    // Create a mock store with required modules
    store = createStore({
      modules: {
        AuthService: {
          namespaced: true,
          getters: {
            getLoggedUser: () => ({ email: 'test@example.com' })
          },
          actions: {
            [authActions.SIGN_OUT]: vi.fn()
          }
        },
        notification: {
          namespaced: true,
          actions: {
            [notificationActions.SET_ERROR_NOTIFICATION]: vi.fn()
          }
        }
      }
    });
  });

  it('should expose setup refs for user and mobile menus', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Toast: true
        },
        mocks: {
          $router: {
            push,
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

    expect(wrapper.vm.userMenu).toBeDefined();
    expect(wrapper.vm.mobileMenu).toBeDefined();
  });

  it('toggleUserMenu delegates to userMenu.toggle when ref exists', async () => {
    wrapper = mount(AuthMenu, {
      global: {
        plugins: [store],
        stubs: {
          Toast: true
        },
        mocks: {
          $router: {
            push,
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

    const toggleSpy = vi.fn();
    wrapper.vm.userMenu = { toggle: toggleSpy };
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    wrapper.vm.toggleUserMenu(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalledWith(event);
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
          $router: {
            push,
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

    const menuItems = wrapper.vm.userMenuItems[0].items;
    
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
