// // WebRTCDataChannel.tsx
// import React, { useState } from 'react';
// import Sender from './Sender';
// import Receiver from './Receiver';


// const WebRTCDataChannel: React.FC = () => {
//     const [role, setRole] = useState<"sender" | "receiver" | null>(null);

//     return (
//       <div>
//         <h1>📤 WebRTC File Transfer</h1>
//         {!role && (
//           <>
//             <button onClick={() => setRole("sender")}>I am Sender</button>
//             <button onClick={() => setRole("receiver")}>I am Receiver</button>
//           </>
//         )}
//         {role === "sender" && <Sender />}
//         {role === "receiver" && <Receiver />}
//       </div>
//     );
//   }
  

// export default WebRTCDataChannel;
