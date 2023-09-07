### Frontend app

Requires a working local environment with NodeJS version 17.0 or above, npm, VueCLI.

Install Node: https://nodejs.org/ (version 17+ recommended)

Install NPM: https://www.npmjs.com/get-npm

Install VueCLI: https://cli.vuejs.org/guide/installation.html

Uses PrimeVue UI: https://primevue.org/

## Running via docker
1. Start docker desktop or daemon
2. Make sure you have docker command available and are in bash or powershell
3. run scripts/docker.sh to start the env

## Installation

1. Navigate in your repo folder: cd `vimage-app`
2. Install project dependencies: `npm install`
3. Create a new .env file: `cp .env.example .env`
4. `VUE_APP_BASE_URL` should contain the URL of your App
 (eg. http://localhost:8080/)
5. `VUE_APP_API_BASE_URL` should contain the URL of JSON-API server (eg. http://localhost:3000/api/v1)
6. Run `npm run dev` to start the application in a local development environment or npm run build to build release distributables.

# Usage

Register a user from `#/register` or login using pre-created users.

### File Structure

Within the download you'll find the following directories and files:

```
vimage-app
    ├── script (docker scripts)
    ├── public
    │   ├── favicon.png
    │   └── index.html
    ├── src
    │   ├── assets
    │   │   ├── css
    │   │   ├── fonts
    │   │   ├── img
    │   │   ├── js
    │   │   └── scss
    │   ├── components (custom components)
    |   ├── layouts (layout blocks)
    |   ├── pages (migrating to views)
    |   ├── service (temporary mock data for UI dev)
    |   ├── services (migrating to store/services)
    │   ├── mixins
    │   │   ├── formMixin.js
    │   │   └── showSwal.js
    │   ├── router
    |   |    └── index.js
    |   |    └── routes.js (extra routes)
    │   ├── services(expired, migrating to store/services)
    │   │   ├── auth-header.js
    │   │   ├── auth.service.js
    │   │   └── profile.service.js
    │   ├── store
    │   │   ├── auth.module.js
    |   |   ├── index.js
    |   |   |── modules (extra modules for RBAC, tags etc.)
    |   |   |── services (extra services)
    │   │   └── profile.module.js
    │   ├── views (naming e.g. Profile/EditProfie.vue)
    │   │   ├── components
    │   ├── App.vue
    │   ├── main.js
    │   └── material-dashboard.js (legacy crap on its way out)
    ├── .browserslistrc
    ├── .eslintrc.js
    ├── .gitignore
    ├── babel.config.json
    ├── vue.config.js
    ├── .env.example
    ├── Dockerfile
    ├── vite.config.js
    ├── index.html
    ├── package.json
    └── README.md