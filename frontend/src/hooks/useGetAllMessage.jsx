import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../redux/chatSlice";
import { MESSAGE_API_END_POINT } from "@/utils/constants";

const useGetAllMessage = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((store) => store.chat);

  useEffect(() => {
    const fetchAllMessages = async () => {
      if (!selectedUser?._id) return;
      try {
        const res = await axios.get(
          `${MESSAGE_API_END_POINT}/all/${selectedUser._id}`,
          { withCredentials: true }
        );
        if (res.data.success) {
          dispatch(setMessages(res.data.messages || []));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        dispatch(setMessages([]));
      }
    };

    fetchAllMessages();
  }, [selectedUser?._id, dispatch]);
};

export default useGetAllMessage;
