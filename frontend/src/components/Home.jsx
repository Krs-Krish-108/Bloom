import React from "react";
import Feed from "./Feed";
import RightSidebar from "./RightSidebar";
import useGetAllPost from "@/hooks/useGetAllPost";

const Home = () => {
  useGetAllPost();

  return (
    <div className="flex justify-center max-w-6xl mx-auto px-4">
      <div className="flex-grow flex justify-center">
        <Feed />
      </div>
      <div className="hidden lg:block shrink-0">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
