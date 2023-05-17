import Vue from "vue"
import VueRouter from "vue-router";
import Home from "./views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home
  },
  {
    path: "/addevent",
    name: "addevent",
    component: () => import(/* webpackChunkName: "addevent" */ "./views/AddEvent.vue")
  },
  {
    path: "/editmessage",
    name: "editmessage",
    component: () => import(/* webpackChunkName: "editmessage" */ "./views/EditMessage.vue")
  },
  {
    path: "/editAnnouncement",
    name: "editAnnouncement",
    component: () => import(/* webpackChunkName: "editAnnouncement" */ "./views/EditAnnouncement.vue")
  },
  {
    path: "/edit",
    name: "edit",
    component: () => import(/* webpackChunkName: "editschedule" */ "./views/EditSchedule.vue")
  },
  {
    path: "/editLunch",
    name: "editLunch",
    component: () => import(/* webpackChunkName: "editschedule" */ "./views/EditLunch.vue")
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
