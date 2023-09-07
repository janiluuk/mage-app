<template>
 
 <!-- Generate history container -->
 <div class="container px-0 mt-8">
      <!-- Generate history header with botto divider -->
      <div class="text-center text-sm text-uppercase fw-bold opacity-7">Generate history</div>
      <hr class="horizontal light mt-2 mb-md-5 mb-4" />

      <div v-for="job in jobs" :key="job.id">
        <div v-if="(job.id !== videoId && job.status != 'pending') || (job.id === videoId && (job.status == 'processing' || job.status == 'finished' || job.status == 'cancelled' || job.status == 'error'))">
        <video-entry :video-preview="videoPreview" :job="job"></video-entry>
        </div>
      </div>
</div>
</template>

      <!-- 
      <div v-if="status === 'approved' || status == 'processing'">

       Example of processing item with bottom divider 
        <div class="row">
          <div class="w-md-50 w-sm-100">
            <div class="d-flex flex-column align-items-center justify-content-center video-container mb-md-0 mb-3">
              <video class="w-100 video-preview" v-if="videoPreview" controls :src="videoPreview" loop></video>
            </div>
          </div>
          <div class="w-md-50 w-sm-100">
            <div class="d-flex flex-row align-items-start justify-content-between">
              <div>
                <h4 class="fw-bold mb-1 lh-sm">
                  {{ prompt }}
                </h4>
                <p class="text-xs text-muted">Last edited 20 June, 2023</p>
              </div>
              <div class="ms-2">
                <span class="badge bg-gradient-vibrant badge-text-shadow">Processing</span>
              </div>
            </div>
            <div class="d-flex flex-column mb-md-2 mb-3">
              <label class="form-label text-sm text-uppercase mb-1 ms-0">Prompt</label>
              <div
                class="copy-area bg-light-opacity-8 p-2 border-radius-md d-flex flex-row align-items-start justify-content-between">
                <div class="copy-content mb-2">
                  {{ prompt }}
                </div>
                <div>
                  <button class="btn-dark btn-icon-only shadow-none btn mb-0" type="submit">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="w-50 w-md-25 d-flex flex-column mb-3">
                <label class="form-label text-sm text-uppercase mb-2 ms-0">Model</label>
                <div>Chill-out mix</div>
              </div>
              <div class="w-50 w-md-25 d-flex flex-column mb-3">
                <label class="form-label text-sm text-uppercase mb-2 ms-0">Denoising</label>
                <div>
                  {{ denoising }}
                </div>
              </div>
              <div class="w-50 w-md-25 d-flex flex-column mb-3">
                <label class="form-label text-sm text-uppercase mb-2 ms-0">Seed</label>
                <div>
                  {{ seed }}
                </div>
              </div>
              <div class="w-50 w-md-25 d-flex flex-column mb-3">
                <label class="form-label text-sm text-uppercase mb-2 ms-0">Dimension</label>
                <div>
                  {{ width }} * {{ height }}
                </div>
              </div>
            </div>
            <div class="align-middle d-flex justify-content-start">
              <div class="progress-wrapper w-80 w-md-40 mb-3">
                <div class="progress-info">
                  <div class="progress-percentage">
                    <span class="text-xs font-weight-bold">Processing 60% completed... </span>
                  </div>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-gradient-info progress-bar-striped progress-bar-animated"
                    role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            </div>
            <div class="d-flex flex-row">
              <button class="btn-light shadow-none btn btn-md border-radius-xxl mb-0 btn-ghost-dark" type="submit">Copy
                settings</button>
            </div>
          </div>
        </div>
      </div>

      <hr class="horizontal light my-md-5 md-4" />

      <div class="row">
        <div class="w-md-50 w-sm-100">
          <div class="d-flex flex-column align-items-center justify-content-center video-container mb-md-0 mb-3">
            <video class="w-100 video-preview" v-if="videoPreview" controls :src="videoPreview" loop></video>
          </div>
        </div>
        <div class="w-md-50 w-sm-100">
          <div class="d-flex flex-row align-items-start justify-content-between">
            <div>
              <h4 class="fw-bold mb-1 lh-sm">
                First few words of the prompt here
              </h4>
              <p class="text-xs text-muted">Last edited 20 June, 2023</p>
            </div>
            <div class="ms-2">
              <span class="badge bg-secondary badge-text-shadow">Draft</span>
            </div>
          </div>
          <div class="d-flex flex-column mb-md-2 mb-3">
            <label class="form-label text-sm text-uppercase mb-1 ms-0">Prompt</label>
            <div
              class="copy-area bg-light-opacity-8 p-2 border-radius-md d-flex flex-row align-items-start justify-content-between d-flex flex-row align-items-start justify-content-between">
              <div class="copy-content mb-2">
                Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...
              </div>
              <div>
                <button class="btn-dark btn-icon-only shadow-none btn mb-0" type="submit">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="w-50 w-md-25 d-flex flex-column mb-3">
              <label class="form-label text-sm text-uppercase ms-0">Model</label>
              <div>Chill-out mix</div>
            </div>
            <div class="w-50 w-md-25 d-flex flex-column mb-3">
              <label class="form-label text-sm text-uppercase mb-2 ms-0">Denoising strength</label>
              <div>
                123
              </div>
            </div>
            <div class="w-50 w-md-25 d-flex flex-column mb-3">
              <label class="form-label text-sm text-uppercase mb-2 ms-0">Seed</label>
              <div>
                123456789
              </div>
            </div>
            <div class="w-50 w-md-25 d-flex flex-column mb-3">
              <label class="form-label text-sm text-uppercase mb-2 ms-0">Dimension</label>
              <div>
                1280 * 790
              </div>
            </div>
          </div>
          <div class="d-flex flex-row">
            <button class="bg-gradient-vibrant shadow-none btn btn-md border-radius-xxl mb-0 me-2 text-dark"
              type="submit">Finalize video</button>
            <button class="btn-light shadow-none btn btn-md border-radius-xxl mb-0 btn-ghost-dark" type="submit">Copy
              settings</button>
          </div>
        </div>
      </div>
    -->