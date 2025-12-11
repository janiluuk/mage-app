import { describe, it, expect } from 'vitest'
import routes from './routes.js'

describe('Routes Configuration', () => {
  describe('Route Structure', () => {
    it('exports an array of routes', () => {
      expect(Array.isArray(routes)).toBe(true)
      expect(routes.length).toBeGreaterThan(0)
    })

    it('all routes have required properties', () => {
      routes.forEach(route => {
        expect(route).toHaveProperty('path')
        // Components or redirect should be present, but catch-all route might not have name
        if (route.path !== '/:pathMatch(.*)*') {
          expect(route).toHaveProperty('name')
        }
      })
    })
  })

  describe('Specific Routes', () => {
    // Tables and Billing routes have been removed as demo pages
    // it('has a tables route', () => {
    //   const tablesRoute = routes.find(r => r.path === '/tables')
    //   expect(tablesRoute).toBeDefined()
    //   expect(tablesRoute.name).toBe('Tables')
    //   expect(tablesRoute.component).toBeDefined()
    // })

    // it('has a billing route', () => {
    //   const billingRoute = routes.find(r => r.path === '/billing')
    //   expect(billingRoute).toBeDefined()
    //   expect(billingRoute.name).toBe('Billing')
    //   expect(billingRoute.component).toBeDefined()
    // })

    it('has a jobs route', () => {
      const jobsRoute = routes.find(r => r.path === '/jobs')
      expect(jobsRoute).toBeDefined()
      expect(jobsRoute.name).toBe('Video Jobs')
      expect(jobsRoute.component).toBeDefined()
    })

    it('has a user-profile route', () => {
      const profileRoute = routes.find(r => r.path === '/user-profile')
      expect(profileRoute).toBeDefined()
      expect(profileRoute.name).toBe('UserProfile')
      expect(profileRoute.component).toBeDefined()
    })

    it('has a users route', () => {
      const usersRoute = routes.find(r => r.path === '/users')
      expect(usersRoute).toBeDefined()
      expect(usersRoute.name).toBe('Users')
      expect(usersRoute.component).toBeDefined()
    })

    it('has a catch-all 404 route', () => {
      const notFoundRoute = routes.find(r => r.path === '/:pathMatch(.*)*')
      expect(notFoundRoute).toBeDefined()
      expect(notFoundRoute.component).toBeDefined()
    })
  })

  describe('Authentication Requirements', () => {
    it('user-profile route requires authentication', () => {
      const profileRoute = routes.find(r => r.path === '/user-profile')
      expect(profileRoute.meta).toBeDefined()
      expect(profileRoute.meta.requiresAuth).toBe(true)
    })

    it('users route requires authentication', () => {
      const usersRoute = routes.find(r => r.path === '/users')
      expect(usersRoute.meta).toBeDefined()
      expect(usersRoute.meta.requiresAuth).toBe(true)
    })

    it('jobs route does not require authentication', () => {
      // Tables and Billing routes removed, only testing jobs now
      const jobsRoute = routes.find(r => r.path === '/jobs')
      expect(jobsRoute).toBeDefined()
      expect(jobsRoute.meta?.requiresAuth).not.toBe(true)
    })
  })

  describe('Route Paths', () => {
    it('all route paths start with forward slash', () => {
      routes.forEach(route => {
        expect(route.path).toMatch(/^\//)
      })
    })

    it('route paths are unique', () => {
      const paths = routes.map(r => r.path)
      const uniquePaths = new Set(paths)
      expect(uniquePaths.size).toBe(paths.length)
    })
  })

  describe('Route Names', () => {
    it('route names are unique where present', () => {
      const names = routes
        .filter(r => r.name)
        .map(r => r.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('Components', () => {
    it('all routes have components or redirects', () => {
      routes.forEach(route => {
        // Each route should have a component or redirect
        const hasComponent = route.component !== undefined
        const hasRedirect = route.redirect !== undefined
        expect(hasComponent || hasRedirect).toBe(true)
      })
    })
  })
})
