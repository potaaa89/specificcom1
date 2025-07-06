
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { db, auth } from "../utils/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";


const socket = io("http://localhost:5000"); // URL сервера

export default function VideoCall({ userId, peerId }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);

  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [userType, setUserType] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      const docSnap = await getDoc(doc(db, "users", userId));
      if (docSnap.exists()) {
        setUserType(docSnap.data().userType || "");
      }
    };
    fetchUserType();
  }, [userId]);


  const toggleMic = () => {
    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setMicOn(prev => !prev);
  };

  const toggleCam = () => {
    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setCamOn(prev => !prev);
  };

  const endCall = () => {
    stream.getTracks().forEach(track => track.stop());
    if (pc.current) {
      pc.current.close();
    }
    window.location.reload();
  };


  useEffect(() => {
    socket.emit("join", userId);

    const start = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream;
      setStream(localStream);

      pc.current = new RTCPeerConnection();

      localStream.getTracks().forEach(track => {
        pc.current.addTrack(track, localStream);
      });

      pc.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            to: peerId,
            from: userId,
            candidate: e.candidate
          });
        }
      };

      pc.current.ontrack = (e) => {
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      socket.on("incoming-call", async ({ from, offer }) => {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        socket.emit("answer-call", {
          to: from,
          from: userId,
          answer
        });
      });

      socket.on("call-answered", async ({ answer }) => {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("ICE error", err);
        }
      });
    };

    start();
  }, [userId, peerId]);

  const startCall = async () => {
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.emit("call-user", {
      to: peerId,
      from: userId,
      offer
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Видеозвонок</h2>
      <div className="flex gap-4">
        <video ref={localVideoRef} autoPlay muted playsInline className="w-1/2 rounded border" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 rounded border" />
      </div>
      
<div className="mt-4 flex gap-4">

{userType === "moderator" && !confirmed && (
  <button
    onClick={async () => {
      await updateDoc(doc(db, "users", peerId), { verified: true });
      setConfirmed(true);
      alert("Пользователь подтверждён");
    }}
    className="px-4 py-2 bg-green-700 text-white rounded"
  >
    ✅ Подтвердить аккаунт
  </button>
)}

  <button onClick={toggleMic} className="px-4 py-2 bg-blue-500 text-white rounded">
    {micOn ? "🔇 Выкл. микрофон" : "🎙 Вкл. микрофон"}
  </button>
  <button onClick={toggleCam} className="px-4 py-2 bg-purple-500 text-white rounded">
    {camOn ? "📷 Выкл. камеру" : "🎥 Вкл. камеру"}
  </button>
  <button onClick={endCall} className="px-4 py-2 bg-gray-800 text-white rounded">
    ❌ Завершить звонок
  </button>
</div>

      <button
        onClick={startCall}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Начать звонок
      </button>
    </div>
  );
}
