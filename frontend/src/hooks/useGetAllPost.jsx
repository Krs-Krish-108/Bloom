import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { POST_API_END_POINT } from "@/utils/constants";
import { setPosts } from "@/redux/postSlice";

const useGetAllPost = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAllPost = async () => {
      try {
        const res = await axios.get(`${POST_API_END_POINT}/all`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setPosts(res.data.posts));
        }
      } catch (error) {
        console.error("Error fetching all posts:", error);
      }
    };

    fetchAllPost();
  }, [dispatch]);
};

export default useGetAllPost;
