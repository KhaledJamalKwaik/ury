import './index.css';
import { createApp, reactive } from "vue";
import App from "./App.vue";

import router from './router';

import { FrappeApp } from "frappe-js-sdk";

const url = window.location.origin;
const frappe = new FrappeApp(url);

const auth = reactive({
	isLoggedIn: false,
	user: null,
	async check() {
		try {
			this.user = await frappe.auth().getLoggedInUser();
			this.isLoggedIn = !!this.user;
		} catch (e) {
			this.isLoggedIn = false;
		}
	},
	async login(username, password) {
		try {
			await frappe.auth().loginWithUsernamePassword({ username, password });
			await this.check();
			return this.isLoggedIn;
		} catch (e) {
			return false;
		}
	}
});

const app = createApp(App);

// Plugins
app.use(router);
app.provide("$auth", auth);

// Configure route guards
router.beforeEach(async (to, from, next) => {
	await auth.check();
	if (to.matched.some((record) => !record.meta.isLoginPage)) {
		// this route requires auth, check if logged in
		// if not, redirect to login page.
		if (!auth.isLoggedIn) {
			next({ name: 'Login', query: { route: to.path } });
		} else {
			next();
		}
	} else {
		if (auth.isLoggedIn) {
			// Redirect to root if already logged in and trying to access login page
			next({ path: '/' });
		} else {
			next();
		}
	}
});


app.mount("#app");
