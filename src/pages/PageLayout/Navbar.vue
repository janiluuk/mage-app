<template>
  <!-- Navbar -->
  <nav
    class="top-0 navbar navbar-expand-lg position-absolute z-index-3"
    :class="isBlur ? isBlur : 'shadow-none my-2 navbar-transparent w-100'"
  >
    <div class="container px-0">
      <router-link
        class="navbar-brand h3 font-weight-bolder ms-lg-0 ms-3"
        to="/upload"
        v-bind="$attrs"
        :class="isBlur ? 'text-dark' : 'text-vibrant'"
      >
        VimageUI
      </router-link>
      <button
        class="navbar-toggler shadow-none ms-2"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navigation"
        aria-controls="navigation"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon mt-2">
          <span class="navbar-toggler-bar bar1"></span>
          <span class="navbar-toggler-bar bar2"></span>
          <span class="navbar-toggler-bar bar3"></span>
        </span>
      </button>
      <div class="collapse navbar-collapse" id="navigation">
        <ul class="navbar-nav mx-auto">
          <li class="nav-item d-none">
            <router-link
              class="nav-link d-flex align-items-center me-2 active"
              aria-current="page"
              to="/upload"
            >
              <i
                class="fa fa-chart-pie opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              Upload
            </router-link>
          </li>
          <li class="nav-item" v-if="loggedIn()">
            <router-link class="nav-link me-2" to="/user-profile">
              <i
                class="fa fa-user opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              Profile
            </router-link>
          </li> 
          <li class="nav-item" v-if="loggedIn()">
            <router-link class="nav-link me-2" to="/library">
              <i
                class="fa fa-user opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              My content
            </router-link>
          </li> 

          <li class="nav-item" v-if="!loggedIn()" @click="$router.push('/signup/');">
            <router-link class="nav-link me-2" to="/signup">
              <i
                class="fas fa-user-circle opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              Register
            </router-link>
          </li>
          <li class="nav-item" v-if="!loggedIn()" @click="$router.push('/login/');">
            <router-link class="nav-link me-2" to="/login">
              <i
                class="fas fa-user-circle opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              Login
            </router-link>
          </li>
          <li class="nav-item" v-if="loggedIn()" @click="logout">
            <router-link class="nav-link me-2" to="/">

              <i
                class="fas fa-user-circle opacity-6 me-1"
                aria-hidden="true"
                :class="isBlur ? 'text-dark' : 'text-white'"
              ></i>
              Logout
              </router-link>
          </li>          
        </ul>
        <ul class="navbar-nav d-lg-block d-none">
          <li class="nav-item" v-if="loggedIn()">
            <router-link class="nav-link me-2" to="/upload">

            <a
              href="#"
              class="btn btn-sm mb-0 me-1 bg-gradient-warning text-dark shadow-none" target="_blank"
              >Launch Studio</a
            >
          </router-link>

          </li>
        </ul>
      </div>
    </div>
  </nav>
  <!-- End Navbar -->
</template>

<script>
import downArrBlack from "@/assets/img/down-arrow-dark.svg";
import downArrWhite from "@/assets/img/down-arrow-white.svg";

export default {
  name: "navbar",
  data() {
    return {
      downArrWhite,
      downArrBlack,
    };
  },
  props: {
    btnBackground: String,
    isBlur: String,
    darkMode: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    loggedIn() {
      return this.$store.state.auth.loggedIn;
    },
    logout() {
      this.$store.dispatch('auth/logout'); // replace 'auth/logout' with the correct mutation in your store
      // also clear the token from local storage or cookies if you're storing it there
      this.$router.push('/login'); // redirect the user to the login page
    }
  },
  computed: {
    darkModes() {
      return {
        "text-dark": this.darkMode,
      };
      
    }
  },
};
</script>
