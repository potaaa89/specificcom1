
import { useEffect, useState, useRef } from "react";
import VideoCall from "../components/VideoCall";
import { db, auth, storage } from "../utils/firebase";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [showVideoCall, setShowVideoCall] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map((doc) => doc.data());
      setUsers(usersList.filter((u) => u.uid !== currentUser?.uid && !blockedUsers.includes(u.uid)));
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
    });
    return () => unsub();
  }, [currentUser, selectedUser]);

  
  useEffect(() => {
    const loadLists = async () => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      const data = snap.data();
      if (data) {
        setBlockedUsers(data.blockedUsers || []);
        setFavorites(data.favorites || []);
      }
    };
    loadLists();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return;
    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      senderId: currentUser.uid,
      type: "text",
      timestamp: Date.now(),
    });
    setNewMessage("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser || !selectedUser) return;

    const chatId = getChatId(currentUser.uid, selectedUser.uid);
    const storageRef = ref(storage, `uploads/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      mediaUrl: url,
      mediaType: isImage ? "image" : isVideo ? "video" : "file",
      senderId: currentUser.uid,
      timestamp: Date.now(),
      type: "media",
    });
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Пользователи онлайн</h2>
        {users.map((user) => (
          <div
            key={user.uid}
            className={`p-2 border-b cursor-pointer flex items-center gap-2 ${
              selectedUser?.uid === user.uid ? "bg-blue-100" : ""
            }`}
            onClick={() => setSelectedUser(user)}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                user.online ? "bg-green-500" : "bg-gray-400"
              }`}
            ></span>
            <div>
              <div className="font-medium">{user.name || "Без имени"}</div>
              <div className="text-xs text-gray-600">
                {user.userType === "guest" ? "Гость" : "Пользователь"}
                {user.verified ? " ✅" : ""}
              </div>
            </div>
          </div>
        ))}
      </aside>
      <main className="flex-1 flex flex-col">
        {selectedUser ? (
          <div className="flex-1 flex flex-col p-4">
            <h3 className="text-lg font-semibold mb-2">
              Чат с {selectedUser.name || "пользователем"}
            </h3>
            <div className="flex-1 overflow-y-auto border p-2 space-y-2 bg-white">
              {messages.length === 0 && (
                <div className="text-gray-400 text-sm italic">Сообщений пока нет</div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded max-w-xs ${
                    msg.senderId === currentUser.uid
                      ? "bg-blue-200 self-end text-right"
                      : "bg-gray-200 self-start text-left"
                  }`}
                >
                  {msg.type === "text" && msg.text}
                  {msg.type === "media" && msg.mediaType === "image" && (
                    <img src={msg.mediaUrl} alt="image" className="rounded max-w-full" />
                  )}
                  {msg.type === "media" && msg.mediaType === "video" && (
                    <video controls className="rounded max-w-full">
                      <source src={msg.mediaUrl} />
                    </video>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
{showVideoCall && currentUser && selectedUser && (
  <VideoCall userId={currentUser.uid} peerId={selectedUser.uid} />
)}

            </div>
            
<div className="mt-4 flex gap-2">
  <button
    onClick={async () => {
      const ref = doc(db, "users", currentUser.uid);
      const updated = [...favorites, selectedUser.uid];
      await updateDoc(ref, { favorites: updated });
      setFavorites(updated);
    }}
    className="bg-yellow-500 text-white px-3 py-1 rounded"
  >
    ❤️ В избранное
  </button>
  <button
    onClick={async () => {
      const ref = doc(db, "users", currentUser.uid);
      const updated = [...blockedUsers, selectedUser.uid];
      await updateDoc(ref, { blockedUsers: updated });
      setBlockedUsers(updated);
    }}
    className="bg-gray-600 text-white px-3 py-1 rounded"
  >
    ⛔ Заблокировать
  </button>
</div>

          <div className="mt-2 flex gap-2 items-center">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="block w-40 text-sm text-gray-600"
              />
              <input
                type="text"
                className="flex-1 border p-2 rounded"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              \1
{messages.filter(msg => msg.senderId === currentUser.uid).length >= 3 && (
  <button
    onClick={() => setShowVideoCall(true)}
    className="bg-red-600 text-white px-4 py-2 rounded ml-2"
  >
    📹 Видеозвонок
  </button>
)}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Выберите пользователя для чата
          </div>
        )}
      </main>
    </div>
  );
}
