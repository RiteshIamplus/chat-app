import Navbar from "./Pages/Navbar";
// import PushNotifications from "./PushNotifications";
import AuthRoutes from "./routes/MainRouts";
import { useEffect } from 'react';
import { registerPush } from "./utils/registerPush";



function App() {
  const userString = localStorage.getItem("user");
  //   console.log(userString)
  const user = userString ? JSON.parse(userString) : null;
  useEffect(() => {
    if (user?._id) {
      registerPush(user._id);
    }
  }, [user]);
  return (
    <div className="">
      {/* <Button className="text-blue-800">Data Tyapes</Button>
      <Button variant="default" className='bg-red-800' >abc</Button>
      <Button  className='text-white'>Primary</Button>
      <Button variant="secondary" className='text-white'>Secondary</Button>
      
      <CardWithForm/> */}
      {/* <ChatPage/> */}
      {/* <ChatBox currentUserId="ajay001" otherUserId="john002" />
<hr />
   <ChatBox currentUserId="john002" otherUserId="ajay001" /> */}
      <Navbar/>
      <AuthRoutes />
      {/* <PushNotifications/> */}
     

      {/* <div>
        <h1 className='text-amber-700'>ajay tayde</h1>
      </div> */}
    </div>
  );
}

export default App;
