<template>
<footer class="footer position-absolute bottom-0 p-2 w-100">
      <div class="container">
        <div class="row align-items-center justify-content-lg-between">
          <div class="col-12 my-auto">
            <div class="copyright text-center text-sm text-white">
              © {{ new Date().getFullYear() }}, made with
              <i class="fa fa-heart" aria-hidden="true"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
</template>
<script>
export default {
    name: "NavFooter",
}
</script>