import React from "react";
import { Link } from "react-router-dom";
export default function NavbarLanding() {
  return (
    <>
      <header className="bg-green-900 text-white p-4  sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-28">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-3xl py-1 px-4 bg-green-600 rounded-md">
              B
            </span>
            <h1 className="text-2xl font-semibold">The Bokaw</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li className="relative group">
                <Link to="/" className="px-1 relative">
                  Home
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full rounded "></span>
                </Link>
              </li>
              <li className="relative group">
                <Link to="/about" className="px-1 relative">
                  Fitur
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full rounded "></span>
                </Link>
              </li>
              <li className="relative group">
                <Link to="/about" className="px-1 relative">
                  Penggunaan
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full rounded "></span>
                </Link>
              </li>
              <li className="relative group">
                <Link to="/login" className="px-1 relative">
                  Login
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full rounded "></span>
                </Link>
              </li>
              <li className="relative group">
                <Link to="/register" className="px-1 relative">
                  Register
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-white transition-all duration-500 group-hover:w-full rounded "></span>
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <Link
              to="/login"
              className="bg-green-600 font-semibold text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-500 "
            >
              Login Disini
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
