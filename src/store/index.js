import { createStore } from "vuex";
import { auth } from "./auth.module";
import { profile } from "./profile.module";
import roles from "./roles.module";
import modelfiles from "./modelfile.module";
import categories from "./modules/categories-module";
import { videojobs } from "./videojobs.module";
import { tags } from "./tags.module";
import AuthService from "./modules/auth";
import StatusService from "./modules/status-service";
import User from "./modules/user";
import notification from "./modules/notification";
import Product from "./modules/product";
import Message from "./modules/message";
import chat from "./modules/chat";
import FinanceOperation from "./modules/finance-operation";
import WalletType from "./modules/wallet-type";
import UserWallet from "./modules/user-wallet";
import order from "./modules/order";
import SupportRequest from "./modules/support-request";

export default createStore({
  modules: {
    auth,
    profile,
    videojobs,
    categories,
    tags,
    roles,
    order,
    modelfiles,
    Product,
    Message,
    SupportRequest,
    chat,
    StatusService,
    FinanceOperation,
    WalletType,
    UserWallet,
    FinanceOperation,
    WalletType,
    AuthService,
    User,
    notification,
  },
  actions: {
    setColor({ commit }, payload) {
      commit("color", payload);
    },
  },
  state: {
    hideConfigButton: false,
    isPinned: true,
    showConfig: false,
    sidebarType: "bg-gradient-dark",
    isRTL: false,
    color: "success",
    isNavFixed: false,
    isAbsolute: false,
    showNavs: true,
    showSidenav: true,
    showNavbar: true,
    showFooter: true,
    showMain: true,
    videoFile: null,
    isDarkMode: false,
    navbarFixed:
      "position-sticky blur shadow-blur left-auto top-1 z-index-sticky px-0 mx-4",
    absolute: "position-absolute px-4 mx-0 w-100 z-index-2",
  },
  mutations: {
    setVideoFile(state, file) {
      state.videoFile = file;
    },
    toggleConfigurator(state) {
      state.showConfig = !state.showConfig;
    },
    navbarMinimize(state) {
      const sidenav_show = document.querySelector(".g-sidenav-show");

      if (sidenav_show.classList.contains("g-sidenav-pinned")) {
        sidenav_show.classList.remove("g-sidenav-pinned");
        state.isPinned = true;
      } else {
        sidenav_show.classList.add("g-sidenav-pinned");
        state.isPinned = false;
      }
    },
    navbarFixed(state) {
      if (state.isNavFixed === false) {
        state.isNavFixed = true;
      } else {
        state.isNavFixed = false;
      }
    },
    toggleEveryDisplay(state) {
      state.showNavbar = !state.showNavbar;
      state.showSidenav = !state.showSidenav;
      state.showFooter = !state.showFooter;
    },
    toggleHideConfig(state) {
      state.hideConfigButton = !state.hideConfigButton;
    },
    color(state, payload) {
      state.color = payload;
    },
  },
  getters: {},
});
