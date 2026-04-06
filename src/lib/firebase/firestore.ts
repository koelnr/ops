import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "./admin";

export const db = getFirestore(adminApp);
