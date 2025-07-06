
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [orientation, setOrientation] = useState("");
  const [about, setAbout] = useState("");
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const user = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    let photoURL = "";

    if (photo) {
      const storageRef = ref(storage, "avatars/" + user.uid);
      await uploadBytes(storageRef, photo);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateDoc(doc(db, "users", user.uid), {
      name,
      age,
      country,
      gender,
      orientation,
      about,
      photoURL,
    });

    navigate("/");
  };

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Заполните профиль</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="number" placeholder="Возраст" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="text" placeholder="Страна" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full p-2 border rounded" required />
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2 border rounded" required>
          <option value="">Пол</option>
          <option value="Мужчина">Мужчина</option>
          <option value="Женщина">Женщина</option>
          <option value="Другой">Другой</option>
        </select>
        <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-full p-2 border rounded" required>
          <option value="">Ориентация</option>
          <option value="Гетеро">Гетеро</option>
          <option value="Гей">Гей</option>
          <option value="Лесби">Лесби</option>
          <option value="Би">Би</option>
          <option value="Асексуал">Асексуал</option>
          <option value="Демисексуал">Демисексуал</option>
        </select>
        <textarea placeholder="О себе..." value={about} onChange={(e) => setAbout(e.target.value)} className="w-full p-2 border rounded" />
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Сохранить</button>
      </form>
    </div>
  );
}
