import React from "react";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      <LeftSidebar />
      <div className="pl-0 pt-14 pb-14 md:pt-0 md:pb-0 md:pl-[72px]">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
