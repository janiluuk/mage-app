import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import AuthMenu from '@/layout/AuthMenu.vue';
import * as authActions from '@/store/modules/auth/types/actions';
import * as notificationActions from '@/store/modules/notification/types/actions';

describe('AuthMenu', () => {
  let store;
  let wrapper;
  let push;
  let signOut;
  let setErrorNotification;

  beforeEach(() => {
    push = vi.fn();
    signOut = vi.fn();
    setErrorNotification = vi.fn();

    // Create a mock store with required modules
    store = createStore({
      modules: {
        AuthService: {
          namespaced: true,
          getters: {
            getLoggedUser: () => ({ email: 'test@example.com' })
          },
          actions: {
            [authActions.SIGN_OUT]: signOut
          }
        },
        notification: {
          namespaced: true,
          actions: {
            [notificationActions.SET_ERROR_NOTIFICATION]: setErrorNotification
          }
        }
      }
    });
  });

  it('builds user menu with profile and logout actions', () => {
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

    const accountGroup = wrapper.vm.userMenuItems[0];
    expect(accountGroup.items[0].label).toBe('Profile');
    expect(accountGroup.items[2].label).toBe('Logout');
  });

  it('routes to profile when profile command is executed', async () => {
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

    await wrapper.vm.userMenuItems[0].items[0].command();
    expect(push).toHaveBeenCalledWith('/profile');
  });

  it('logout command calls signOut and routes to login', async () => {
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

    await wrapper.vm.userMenuItems[0].items[2].command();
    await flushPromises();
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login');
  });
});
