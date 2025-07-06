
import { useState } from "react";
import { auth, db } from "../utils/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        userType: "user",
        verified: false,
        online: true,
        createdAt: Date.now()
      });
      navigate("/profile-setup");
    } catch (error) {
      alert("Ошибка: " + error.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Регистрация</h2>
      <form onSubmit={handleRegister} className="space-y-3">
        <input className="w-full p-2 border" type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full p-2 border" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full p-2 border" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Зарегистрироваться</button>
      </form>
    </div>
  );
}
