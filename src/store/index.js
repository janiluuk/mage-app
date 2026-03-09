import { createStore } from 'vuex';
import { auth } from './auth.module';
import { profile } from './profile.module';
import roles from './roles.module';
import modelfiles from './modelfile.module';
import categories from './modules/categories-module';
import { videojobs } from './videojobs.module';
import { tags } from './tags.module';
import { items } from './items.module';
import { files } from './files.module';
import { videoeditor } from './videoeditor.module';
import {
  alertsModule,
  authServiceModule,
  chatModule,
  financeOperationModule,
  messageModule,
  notificationModule,
  orderModule,
  productModule,
  statusServiceModule,
  supportRequestModule,
  userModule,
  userWalletModule,
  walletTypeModule,
} from './modules';
import FilmProject from './modules/film-project';

const baseState = () => ({
  hideConfigButton: false,
  isPinned: true,
  showConfig: false,
  sidebarType: 'bg-gradient-dark',
  isRTL: false,
  color: 'success',
  isNavFixed: false,
  isAbsolute: false,
  showNavs: true,
  showSidenav: true,
  showNavbar: true,
  showFooter: true,
  showMain: true,
  videoFile: null,
  isDarkMode: false,
  navbarFixed: 'position-sticky blur shadow-blur left-auto top-1 z-index-sticky px-0 mx-4',
  absolute: 'position-absolute px-4 mx-0 w-100 z-index-2',
});

const toggleSidenavPin = (state) => {
  const sidenavShow = document.querySelector('.g-sidenav-show');
  if (!sidenavShow) return;

  if (sidenavShow.classList.contains('g-sidenav-pinned')) {
    sidenavShow.classList.remove('g-sidenav-pinned');
    state.isPinned = true;
  } else {
    sidenavShow.classList.add('g-sidenav-pinned');
    state.isPinned = false;
  }
};

const toggleNavbarFixed = (state) => {
  state.isNavFixed = !state.isNavFixed;
};

const uiMutations = {
  setVideoFile(state, file) {
    state.videoFile = file;
  },
  toggleConfigurator(state) {
    state.showConfig = !state.showConfig;
  },
  toggleSidenavPin,
  navbarMinimize: toggleSidenavPin,
  toggleNavbarFixed,
  navbarFixed: toggleNavbarFixed,
  toggleEveryDisplay(state) {
    state.showNavbar = !state.showNavbar;
    state.showSidenav = !state.showSidenav;
    state.showFooter = !state.showFooter;
  },
  toggleHideConfig(state) {
    state.hideConfigButton = !state.hideConfigButton;
  },
  setColor(state, payload) {
    state.color = payload;
  },
};

const uiGetters = {
  isNavbarFixed: (state) => state.isNavFixed,
  isConfiguratorOpen: (state) => state.showConfig,
};

const featureModules = {
  // Core auth & profile
  auth,
  profile,
  AuthService: authServiceModule,

  // Resource CRUD (factory-generated modules via createCrudModule)
  roles,
  modelfiles,
  categories,
  tags,
  items,

  // Video & media
  videojobs,
  files,
  videoeditor,
  FilmProject,

  // Products, orders & finance
  Product: productModule,
  Order: orderModule,
  FinanceOperation: financeOperationModule,
  WalletType: walletTypeModule,
  UserWallet: userWalletModule,

  // Users & permissions
  User: userModule,

  // Communication
  Message: messageModule,
  SupportRequest: supportRequestModule,
  chat: chatModule,
  notification: notificationModule,
  Alerts: alertsModule,

  // System
  StatusService: statusServiceModule,
};

export default createStore({
  modules: featureModules,
  actions: {
    setColor({ commit }, payload) {
      commit('setColor', payload);
    },
  },
  state: baseState(),
  mutations: uiMutations,
  getters: uiGetters,
});
