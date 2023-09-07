import { toRefs, reactive, computed  } from 'vue';
import { LocalStorage } from "@/components/Deforum/services/LocalStorage";

const userTheme = LocalStorage.getUserConfig('usertheme');
const layoutConfig = reactive({
    ripple: true,
    darkTheme: true,
    inputStyle: 'outlined',
    menuMode: 'overlay',
    theme: 'lara-dark-teal',
    scale: 15,
    activeMenuItem: null
});
if (userTheme) {
    layoutConfig.theme = userTheme.theme;
    layoutConfig.darkTheme = userTheme.darkTheme;
    layoutConfig.scale = userTheme.scale;

}

const layoutState = reactive({
    staticMenuDesktopInactive: true,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    fullScreenOverlay: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false
});

export function useLayout() {
    const changeThemeSettings = (theme, darkTheme) => {
        layoutConfig.darkTheme = darkTheme;
        layoutConfig.theme = theme;
        LocalStorage.saveUserConfig(layoutConfig, 'usertheme');
    };

    const setScale = (scale) => {
        layoutConfig.scale = scale;
        LocalStorage.saveUserConfig(layoutConfig, 'usertheme');

    };

    const setActiveMenuItem = (item) => {
        layoutConfig.activeMenuItem = item.value || item;
    };

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);
    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    return { layoutConfig: toRefs(layoutConfig), layoutState: toRefs(layoutState), changeThemeSettings, setScale, onMenuToggle, isSidebarActive, isDarkTheme, setActiveMenuItem };
}
