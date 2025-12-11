import Profile from "../views/Profile.vue";
import Users from "../views/api/users/UsersList.vue";
import NotFound from "../views/pages/NotFound.vue";
import ListItemPage from "../views/ListItemPage.vue";

const routes = [
  {
    path: "/jobs",
    name: "Video Jobs",
    component: ListItemPage,
  },
  {
    path: "/user-profile",
    name: "UserProfile",
    meta: { requiresAuth: true },
    component: Profile,
  },
  {
    path: "/users",
    name: "Users",
    component: Users,
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", component: NotFound },
];

export default routes;
