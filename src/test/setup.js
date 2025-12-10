import { config } from '@vue/test-utils'

// Mock global properties that might be used in components
config.global.mocks = {
  $t: (key) => key, // Mock translation function
  $router: {
    push: () => {},
    replace: () => {},
  },
  $route: {
    params: {},
    query: {},
  },
}

// Suppress Vue warnings in tests
config.global.config = {
  warnHandler: () => null,
}
