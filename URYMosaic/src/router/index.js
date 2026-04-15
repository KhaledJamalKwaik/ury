import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import authRoutes from './auth';
import KOT from '../components/kot.vue';

const routes = [
  {
	path: "/:production",
	name: "KOT",
	component: KOT,
  },
  {
    path: "/",
    redirect: "/Kitchen"
  },
  ...authRoutes,
];


const router = createRouter({
  history: createWebHistory("/URYMosaic/"),
  routes,
});


export default router;
