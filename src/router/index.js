import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "@/layout/AppLayout.vue";
import routes from "./routes";
import AuthService from "@/services/auth/AuthService";
import VideoLibraryTabs from "@/components/library/VideoLibraryTabs.vue";
import UserProfile from "@/views/api/profile/UserProfile.vue";
import VideoEdit from "@/components/video/VideoEdit.vue";
import Deforum from "@/views/dev/Deforum.vue";
import Signup from "@/views/pages/auth/Signup.vue";
import ForgotPassword from "@/views/pages/auth/ForgotPassword.vue";
import PasswordReset from "@/views/api/PasswordReset.vue";
import { ConnectableObservable } from "rxjs";
import DeforumUI from "@/views/dev/DeforumUI.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: '/frontpage',
          name: 'Frontpage',
          component: () => import('@/views/FrontPage.vue')
        },

        {
          path: "/uikit/formlayout",
          name: "formlayout",
          component: () => import("@/views/uikit/FormLayout.vue"),
        },
        {
          path: "/uikit/input",
          name: "input",
          component: () => import("@/views/uikit/Input.vue"),
        },
        {
          path: "/uikit/floatlabel",
          name: "floatlabel",
          component: () => import("@/views/uikit/FloatLabel.vue"),
        },
        {
          path: "/uikit/invalidstate",
          name: "invalidstate",
          component: () => import("@/views/uikit/InvalidState.vue"),
        },
        {
          path: "/uikit/button",
          name: "button",
          component: () => import("@/views/uikit/Button.vue"),
        },
        {
          path: "/uikit/table",
          name: "table",
          component: () => import("@/views/uikit/Table.vue"),
        },
        {
          path: "/uikit/list",
          name: "list",
          component: () => import("@/views/uikit/List.vue"),
        },
        {
          path: "/uikit/tree",
          name: "tree",
          component: () => import("@/views/uikit/Tree.vue"),
        },
        {
          path: "/uikit/panel",
          name: "panel",
          component: () => import("@/views/uikit/Panels.vue"),
        },

        {
          path: "/uikit/overlay",
          name: "overlay",
          component: () => import("@/views/uikit/Overlay.vue"),
        },
        {
          path: "/uikit/media",
          name: "media",
          component: () => import("@/views/uikit/Media.vue"),
        },
        {
          path: "/uikit/menu",
          component: () => import("@/views/uikit/Menu.vue"),
          children: [
            {
              path: "/uikit/menu",
              component: () => import("@/views/uikit/menu/PersonalDemo.vue"),
            },
            {
              path: "/uikit/menu/seat",
              component: () => import("@/views/uikit/menu/SeatDemo.vue"),
            },
            {
              path: "/uikit/menu/payment",
              component: () => import("@/views/uikit/menu/PaymentDemo.vue"),
            },
            {
              path: "/uikit/menu/confirmation",
              component: () =>
                import("@/views/uikit/menu/ConfirmationDemo.vue"),
            },
          ],
        },
        {
          path: "/uikit/message",
          name: "message",
          component: () => import("@/views/uikit/Messages.vue"),
        },
        {
          path: "/uikit/file",
          name: "file",
          component: () => import("@/views/uikit/File.vue"),
        },
        {
          path: "/uikit/charts",
          name: "charts",
          component: () => import("@/views/uikit/Chart.vue"),
        },
        {
          path: "/uikit/misc",
          name: "misc",
          component: () => import("@/views/uikit/Misc.vue"),
        },
        {
          path: "/blocks",
          name: "blocks",
          component: () => import("@/views/utilities/Blocks.vue"),
        },
        {
          path: "/utilities/icons",
          name: "icons",
          component: () => import("@/views/utilities/Icons.vue"),
        },
        {
          path: "/pages/timeline",
          name: "timeline",
          component: () => import("@/views/pages/Timeline.vue"),
        },
        {
          path: "/pages/empty",
          name: "empty",
          component: () => import("@/views/pages/Empty.vue"),
        },
        {
          path: "/pages/crud",
          name: "crud",
          component: () => import("@/views/pages/Crud.vue"),
        },
        {
          path: "/documentation",
          name: "documentation",
          component: () => import("@/views/utilities/Documentation.vue"),
        },
        {
          path: "/library",
          name: "Library",
          component: () => import("@/views/pages/Library.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "/oldlibrary",
          name: "OldLibrary",
          component: VideoLibraryTabs,
          meta: { requiresAuth: true },
        },
        {
          path: "/upload",
          name: "upload",
          meta: { requiresAuth: true },
          component: () => import("@/views/pages/video/Upload.vue"),
        },
        {
          path: "/timeline",
          component: () => import("@/views/Studio.vue"),
        },
        {
          path: "/profile",
          name: "profile",
          component: UserProfile,
          meta: { requiresAuth: true },
        },
        {
          path: "/dev",
          component: () => import("@/views/dev/DevBoard.vue"),
          children: [
            {
              path: "/dev",
              component: () =>
                import("@/views/dev/pages/FFMpegWebTranscoder.vue"),
            },
            {
              path: "/dev/webcam",
              component: () => import("@/views/dev/pages/Webcam.vue"),
            },
            {
              path: "/dev/videomodal",
              component: () => import("@/views/dev/pages/VideoModal.vue"),
            },
          ],
        },
        {
          path: "/dev/deforum",
          component: () => Deforum,
        },
        {
          path: "/dev/deforumui",
          component: () => DeforumUI,
        },
        // Other routes
        {
          path: "/edit/:id", // :id is a dynamic route parameter for the video ID
          name: "Video Editor",
          requiresAuth: true,
          component: VideoEdit,
        },
      ],
    },
    {
      path: "/landing",
      name: "landing",
      component: () => import("@/views/pages/Landing.vue"),
    },
    {
      path: "/pages/notfound",
      name: "notfound",
      component: () => import("@/views/pages/NotFound.vue"),
    },
    {
      path: "/signup",
      name: "Signup",

      component: Signup,
    },
    {
        path: "/signout",
        name: "Sign",
        requiredAuth: true,
        component: () => import("@/views/pages/auth/Signout.vue"),
    },
    {
      path: "/login",
      name: "login",
      meta: { handleAuth: true },
      component: () => import("@/views/pages/auth/Login.vue"),
    },
    {
      path: "/password-forgot",
      name: "Password Forgot",
      component: ForgotPassword,
    },
    {
      path: "/password-reset",
      name: "Password Reset",
      meta: { handleAuth: true },
      component: PasswordReset,
    },

    {
      path: "/auth/access",
      name: "accessDenied",
      component: () => import("@/views/pages/auth/Access.vue"),
    },
    {
      path: "/auth/error",
      name: "error",
      component: () => import("@/views/pages/auth/Error.vue"),
    },

    ...routes,
  ],
});

router.beforeEach((to, from, next) => {
  const token = AuthService.getToken();
  if (token) {
    const jwtPayload = AuthService.getJwtData();
    if (jwtPayload.exp < Date.now() / 1000) {
      AuthService.removeToken();
      // token expired
    }
  }
  const isAuthenticatedRoute = to.matched.some(
    (record) => record.meta.requiresAuth
  );
  const isAuthSectionRoute = to.matched.some(
    (record) => record.meta.handleAuth
  );

  if (isAuthenticatedRoute && !AuthService.hasToken()) {
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  if (isAuthSectionRoute && AuthService.hasToken()) {
    next({ name: "Library" });
    return;
  }
  // External redirect
  if (to.matched.some((record) => record.meta.RedirectExternalUrl)) {
    const url = to.meta.RedirectExternalUrl;
    window.location.replace(url);
    return;
  }
  next();
  return;
});

export default router;
