import { FrappeApp } from "frappe-js-sdk";

const url = window.location.origin;
export const frappe = new FrappeApp(url);
export const call = frappe.call();
export const db = frappe.db();
export const auth = frappe.auth();
