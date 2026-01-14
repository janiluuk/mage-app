# JWT Security Migration Plan

**Date:** January 14, 2026  
**Status:** Pending Implementation  
**Priority:** High

---

## Current Security Issue

**Problem:** JWT tokens are stored in localStorage, making them vulnerable to XSS attacks.

**Current Implementation:**
```javascript
// src/services/auth.service.js
localStorage.setItem('auth.accessToken', data.access_token);
```

**Vulnerability:**
- Any XSS vulnerability can access localStorage
- Tokens accessible via JavaScript
- No expiration enforcement on client
- Tokens persist across sessions

---

## Recommended Solution: httpOnly Cookies

### Benefits
1. **XSS Protection:** Cookies with httpOnly flag cannot be accessed via JavaScript
2. **Automatic Handling:** Browser automatically includes cookie in requests
3. **Secure Flag:** Can enforce HTTPS-only transmission
4. **SameSite:** CSRF protection built-in with SameSite attribute

### Implementation Requirements

#### Backend Changes (Required)

**1. Update Authentication Endpoints**

```javascript
// POST /api/v2/login
// POST /api/v2/register
// Response: Set cookie instead of returning token in body

res.cookie('authToken', token, {
  httpOnly: true,           // Cannot be accessed via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
});

res.json({
  success: true,
  user: {
    id: user.id,
    email: user.email,
    name: user.name
  }
  // Note: No access_token in response body
});
```

**2. Update Logout Endpoint**

```javascript
// POST /api/v2/logout
res.clearCookie('authToken', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
});

res.json({ success: true });
```

**3. Update Authentication Middleware**

```javascript
// Middleware to verify JWT from cookie
function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

**4. Add Cookie Parser**

```bash
npm install cookie-parser
```

```javascript
// server.js or app.js
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

#### Frontend Changes (Required)

**1. Update auth.service.js**

```javascript
// Before
async function login(user) {
  const { data } = await axios.post(`${API_V2_URL}/login`, {
    email: user.email,
    password: user.password,
  });
  
  if (data?.access_token) {
    localStorage.setItem('auth.accessToken', data.access_token);
  }
  
  return data;
}

// After
async function login(user) {
  const { data } = await axios.post(
    `${API_V2_URL}/login`,
    {
      email: user.email,
      password: user.password,
    },
    {
      withCredentials: true  // Important: Include cookies in request
    }
  );
  
  // No need to store token - it's in httpOnly cookie
  return data;
}

async function logout() {
  await axios.post(
    `${API_V2_URL}/logout`,
    {},
    { withCredentials: true }
  );
  // No need to remove from localStorage
}
```

**2. Update axios configuration**

```javascript
// src/services/request-service/ApiRequestService.js
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Include cookies in all requests
  headers: {
    Accept: 'application/vnd.api+json',
  },
});

// Remove token from headers - cookie handles it
apiClient.interceptors.request.use(
  (config) => {
    // No longer need to add Authorization header manually
    // Cookie is automatically included by browser
    return config;
  },
  (error) => Promise.reject(error)
);
```

**3. Update auth-header.js**

```javascript
// Before
export default function authHeader() {
  const token = localStorage.getItem('auth.accessToken');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// After
export default function authHeader() {
  // No longer needed - authentication via cookie
  // Keep for backwards compatibility during migration
  return {};
}
```

**4. Update auth state management**

```javascript
// src/store/auth.module.js
const state = {
  user: null,
  isAuthenticated: false, // Determined by successful API calls, not token presence
};
```

---

## Migration Strategy

### Phase 1: Backend Implementation (Week 2)

1. **Day 1-2:** Backend changes
   - Add cookie-parser middleware
   - Update login/register endpoints to set httpOnly cookies
   - Update logout endpoint to clear cookies
   - Update authentication middleware to check cookies
   - Keep token in response body for backwards compatibility

2. **Day 3:** Backend testing
   - Test login with cookie setting
   - Test authenticated requests with cookie
   - Test logout with cookie clearing
   - Test token expiration handling

### Phase 2: Frontend Migration (Week 2-3)

3. **Day 4-5:** Frontend changes
   - Update axios configuration with withCredentials
   - Update auth.service.js to not use localStorage
   - Update auth-header.js
   - Keep localStorage as fallback during migration

4. **Day 6-7:** Frontend testing
   - Test login flow
   - Test authenticated API calls
   - Test logout flow
   - Test token expiration handling
   - Test CORS configuration

### Phase 3: Cleanup (Week 3)

5. **Day 8-9:** Remove backwards compatibility
   - Remove token from login/register response body
   - Remove localStorage fallback
   - Update documentation

6. **Day 10:** Final testing
   - End-to-end testing
   - Security testing
   - Performance testing

---

## Testing Checklist

### Backend Testing
- [ ] Login sets httpOnly cookie
- [ ] Register sets httpOnly cookie
- [ ] Logout clears cookie
- [ ] Authenticated endpoints verify cookie
- [ ] Invalid cookie returns 401
- [ ] Expired cookie returns 403
- [ ] Cookie has correct attributes (httpOnly, secure, sameSite)

### Frontend Testing
- [ ] Login flow works with cookies
- [ ] API calls include credentials
- [ ] Logout clears session
- [ ] Token expiration redirects to login
- [ ] CORS allows credentials
- [ ] No token in localStorage after login
- [ ] Session persists across page reloads

### Security Testing
- [ ] Cannot access cookie via JavaScript (document.cookie)
- [ ] Cookie only sent over HTTPS in production
- [ ] Cookie has SameSite=strict for CSRF protection
- [ ] XSS cannot steal tokens
- [ ] Token rotation works properly

---

## Rollback Plan

If issues occur during migration:

1. **Immediate:** Keep dual authentication support
   - Backend accepts both cookie and Authorization header
   - Frontend tries cookie first, falls back to localStorage

2. **Gradual Migration:** User-by-user
   - Feature flag for cookie authentication
   - Gradually enable for users
   - Monitor for issues

3. **Full Rollback:** If critical issues
   - Revert backend changes
   - Revert frontend changes
   - Keep localStorage approach temporarily

---

## Security Considerations

### CORS Configuration
```javascript
// Backend CORS config must allow credentials
app.use(cors({
  origin: allowedOrigins,
  credentials: true,  // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
```

### Cookie Security Best Practices

1. **httpOnly:** ✅ Prevents JavaScript access
2. **secure:** ✅ HTTPS only in production
3. **sameSite:** ✅ CSRF protection
4. **maxAge:** ✅ Explicit expiration
5. **domain:** Consider if using subdomains
6. **path:** Set to '/' for all routes

### Token Rotation

Consider implementing token rotation for additional security:

```javascript
// Refresh token endpoint
app.post('/api/v2/refresh', authenticateToken, (req, res) => {
  // Generate new token
  const newToken = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Set new cookie
  res.cookie('authToken', newToken, cookieOptions);
  res.json({ success: true });
});
```

---

## Timeline

**Total Duration:** 2-3 weeks

- **Week 2 (Days 1-7):** Backend implementation and frontend migration
- **Week 3 (Days 8-10):** Cleanup and final testing
- **Week 3 (Days 11-14):** Buffer for issues and documentation

---

## Success Criteria

1. ✅ JWT tokens not accessible via JavaScript
2. ✅ All authentication flows working
3. ✅ No security vulnerabilities introduced
4. ✅ Performance not impacted
5. ✅ All tests passing
6. ✅ Documentation updated
7. ✅ Security audit passed

---

## Dependencies

- Backend framework: Express.js
- Cookie parser: cookie-parser npm package
- JWT library: jsonwebtoken
- Testing: Supertest for API testing
- Frontend: axios with withCredentials support

---

## Additional Resources

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Status Updates

### January 14, 2026
- Document created
- Migration plan defined
- Awaiting approval to begin implementation

### Next Update
- Backend implementation start date
- Estimated completion date
- Team assignments

---

**Document Version:** 1.0  
**Status:** Pending Implementation  
**Next Review:** Before starting implementation
