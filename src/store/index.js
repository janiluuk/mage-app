import { createStore } from 'vuex';
import { auth } from './auth.module';
import { profile } from './profile.module';
import roles from './roles.module';
import modelfiles from './modelfile.module';
import categories from './modules/categories-module';
import { videojobs } from './videojobs.module';
import { tags } from './tags.module';
import { items } from './items.module';
import {
  alertsModule,
  authServiceModule,
  categoriesModule,
  chatModule,
  financeOperationModule,
  itemsModule,
  messageModule,
  notificationModule,
  orderModule,
  productModule,
  profileModule,
  rolesModule,
  statusServiceModule,
  supportRequestModule,
  tagsModule,
  userModule,
  userWalletModule,
  walletTypeModule,
} from './modules';

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
  auth,
  profile,
  roles,
  modelfiles,
  categories,
  videojobs,
  tags,
  items,
  CategoriesV2: categoriesModule,
  TagsV2: tagsModule,
  RolesV2: rolesModule,
  Product: productModule,
  Message: messageModule,
  SupportRequest: supportRequestModule,
  chat: chatModule,
  StatusService: statusServiceModule,
  FinanceOperation: financeOperationModule,
  WalletType: walletTypeModule,
  UserWallet: userWalletModule,
  AuthService: authServiceModule,
  User: userModule,
  notification: notificationModule,
  Alerts: alertsModule,
  Order: orderModule,
  ItemsV2: itemsModule,
  ProfileV2: profileModule,
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
