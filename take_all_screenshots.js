// Script to take screenshots of all pages
// This will be run via browser automation

const pages = [
  // Public/Auth Pages
  '/login',
  '/signup',
  '/password-forgot',
  '/landing',
  '/pages/notfound',
  '/auth/access',
  '/auth/error',
  
  // User Pages
  '/',
  '/library',
  '/browser',
  '/upload',
  '/jobs',
  '/stories',
  '/profile',
  '/timeline',
  '/story',
  '/soundscape',
  '/mage',
  '/projects',
  
  // Admin Pages
  '/admin/instances',
  '/admin/video-processing',
  
  // Developer/UI Pages
  '/dev',
  '/documentation',
  '/uikit/formlayout',
  '/uikit/input',
  '/uikit/button',
  '/uikit/table',
  '/uikit/charts',
  '/blocks',
  '/utilities/icons',
  '/pages/timeline',
  '/pages/empty',
  '/pages/crud',
];

console.log(`Total pages to screenshot: ${pages.length}`);

