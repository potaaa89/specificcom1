
import { useState } from "react";
import { auth, db } from "../utils/firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateDoc(doc(db, "users", user.uid), { online: true });
      navigate("/");
    } catch (error) {
      alert("Ошибка: " + error.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: "Гость",
        email: "",
        userType: "guest",
        verified: false,
        online: true,
        createdAt: Date.now()
      });
      navigate("/");
    } catch (error) {
      alert("Ошибка при входе гостем: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Вход</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input className="w-full p-2 border" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full p-2 border" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-green-600 text-white p-2 rounded">Войти</button>
      </form>
      <div className="mt-4 text-center">
        <button onClick={handleGuestLogin} className="text-sm text-blue-600 underline">Войти как гость</button>
      </div>
    </div>
  );
}
