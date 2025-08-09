import React from "react";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import NavbarLanding from "../components/NavbarLanding";

export default function LandingLayout() {
  return (
    <>
      <NavbarLanding />
      <Outlet />
      <Footer />
    </>
  );
}
