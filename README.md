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

### FFmpeg worker pool

`docker-compose.yml` defines an `ffmpeg-worker` service. Scale it to six
instances so concurrent audio streams each get their own encoder:

```bash
docker compose up --build --scale ffmpeg-worker=6
```

Each worker provides an FFmpeg binary used to transcode and stream audio in
AAC at 128 kbps.

## Installation

1. Navigate in your repo folder: cd `vimage-app`
2. Install project dependencies: `npm install`
3. Create a new .env file: `cp .env.example .env`
4. `VUE_APP_BASE_URL` should contain the URL of your App
 (eg. http://localhost:8080/)
5. `VUE_APP_API_BASE_URL` should contain the URL of JSON-API server (eg. http://localhost:3000/api/v1)
6. Run `npm run dev` to start the application in a local development environment or `npm run build` to build release distributables.
7. In another terminal, launch the audio backend with `npm run api`.

# Usage

Register a user from `#/register` or login using pre-created users.

### File Structure

Within the download you'll find the following directories and files:

```
vimage-app
    ├── index.html 
    ├── public
    │   ├── layout
    │   ├── themes
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
    |   |   └── component-name
    |   ├── layouts (layout blocks)
    |   ├── service (temporary mock data for UI dev)
    |   ├── services (use only these to connect to API!)
    │   ├── mixins
    │   │   ├── formMixin.js
    │   │   └── showSwal.js
    │   ├── router
    |   |    └── index.js
    |   |    └── routes.js (extra routes)
    │   ├── store
    │   │   ├── auth.module.js
    |   |   ├── index.js
    |   |   |── modules
    |   |   |    ├── module-name
    |   |   |── services (extra services, deprecating)
    │   │   └── profile.module.js
    │   ├── views (naming e.g. Profile/EditProfie.vue)
    │   │   ├── components
    │   ├── App.vue
    │   └── main.js
    ├── .browserslistrc
    ├── .whyareyoulookingatthis
    ├── .eslintrc.js
    ├── .gitignore
    ├── babel.config.json
    ├── vue.config.js
    ├── webpack.config.js
    ├── .env.example
    ├── Dockerfile
    ├── vite.config.js
    ├── docker-compose.yml
    ├── package.json
    └── README.md

### Backend

An experimental Node.js helper lives in `backend/` and demonstrates how to
call a local [ComfyUI](https://github.com/comfyanonymous/ComfyUI) server to
generate audio and stream it through an FFmpeg filter chain. The helper now
outputs AAC at 128 kbps and is served by `backend/server.js` on `/api/stream`.

Visit [http://localhost:8080/soundscape](http://localhost:8080/soundscape) and
click **Generate** to hear the streaming result in the built‑in audio player.
Adjust `backend/audio-workflow.json` to match your ComfyUI workflow.
