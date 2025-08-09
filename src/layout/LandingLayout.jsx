import React from "react";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function LandingLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}
