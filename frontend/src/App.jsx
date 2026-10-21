import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import Signup from "./components/Signup";
import Login from "./components/Login";
import MainLayout from "./components/MainLayout";
import Home from "./components/Home";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ChatPage from "./components/ChatPage";
import Gallery from "./components/Gallery";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { setSocket } from "./redux/socketSlice";
import { setOnlineUsers } from "./redux/chatSlice";
import { setLikeNotification } from "./redux/rtnSlice";
import { updatePostLikes } from "./redux/postSlice";
import { BASE_URL } from "./utils/constants";

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/gallery",
        element: <Gallery />,
      },
      {
        path: "/profile/:id",
        element: <Profile />,
      },
      {
        path: "/account/edit",
        element: <EditProfile />,
      },
      {
        path: "/chat",
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);

function App() {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    let socketio;
    if (user) {
      socketio = io(BASE_URL || undefined, {
        query: {
          userId: user?._id,
        },
        transports: ["websocket", "polling"],
      });

      dispatch(setSocket(socketio));

      // Listen for online users
      socketio.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      // Listen for real-time notifications
      socketio.on("notification", (notification) => {
        dispatch(setLikeNotification(notification));
      });

      // Listen for real-time post likes updates across all users/browsers
      socketio.on("postLikesUpdated", ({ postId, likes }) => {
        dispatch(updatePostLikes({ postId, likes }));
      });

      return () => {
        socketio.close();
        dispatch(setSocket(null));
      };
    } else {
      dispatch(setSocket(null));
    }
  }, [user, dispatch]);

  return (
    <>
      <RouterProvider router={browserRouter} />
    </>
  );
}

export default App;

