import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const regBtn = document.querySelector("#registerBtn");
  const loginBtn = document.querySelector("#loginBtn");

  if (regBtn) {
    regBtn.addEventListener("click", async () => {
      const name = document.querySelector("#regName").value;
      const email = document.querySelector("#regEmail").value;
      const pass = document.querySelector("#regPass").value;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          createdAt: new Date()
        });

        alert("Реєстрація успішна!");
      } catch (err) {
        alert("Помилка: " + err.message);
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.querySelector("#loginEmail").value;
      const pass = document.querySelector("#loginPass").value;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("Вхід успішний!");
      } catch (err) {
        alert("Помилка входу: " + err.message);
      }
    });
  }
});
