import React from "react";
import { Link } from "react-router-dom";
import {
  MdOutlineViewKanban,
  MdListAlt,
  MdSecurity,
  MdLogin,
  MdAddBox,
  MdDragIndicator,
  MdDone,
} from "react-icons/md";
import BoardLocal from "./BoardLocal";
import Footer from "../components/Footer";
export default function LandingPage() {
  return (
    <div className="container mx-auto min-h-screen px-4 py-12  bg-gray-900 text-white ">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section
          className="relative flex items-end justify-center rounded-md py-4 h-[550px] mx-auto bg-green-800 bg-no-repeat bg-cover bg-center w-full"
          style={{
            backgroundImage: "url('/hero-section.svg')",
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex flex-col items-center pb-20">
            <h1 className="text-4xl md:text-6xl font-bold  text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 text-center drop-shadow-lg leading-tight pb-1">
              Manage Your Task With KanbanBoard
            </h1>
            <h3 className="text-lg md:text-2xl mb-6 text-center font-semibold text-green-200 drop-shadow">
              Kelola tugas dan proyek Anda dengan mudah, aman, dan fleksibel.
              Mulai Sekarang!
            </h3>

            <Link
              to="/login"
              className="bg-green-700 text-gray-100 font-semibold py-3 px-8 rounded-md hover:bg-green-800 transition duration-300"
            >
              Get Started
            </Link>
          </div>
        </section>
        <section className="flex flex-col pt-10 ">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-100  drop-shadow-lg">
              Visualisasi Tugas Anda
            </h2>
            <h3 className="text-lg md:text-lg mb-4 font-light font-serif text-gray-300 drop-shadow ">
              KanbanBoard membantu Anda mengelola tugas dengan cara yang lebih
              efisien dan terstruktur, sehingga setiap pekerjaan dapat dipantau
              dengan jelas dari awal hingga selesai. Nikmati kemudahan drag &
              drop, notifikasi instan, serta tampilan modern yang responsif di
              semua perangkat.
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-gray-800 p-4 rounded-md">
                <MdOutlineViewKanban className="mb-2" size={30} />
                <h4 className="font-semibold ">Fitur 1</h4>
                <p className="text-sm">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Aliquam deserunt modi deleniti aperiam facilis earum quam
                  molestias in eos quo!.
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-md">
                <MdListAlt className="mb-2" size={30} />
                <h4 className="font-semibold ">Fitur 2</h4>
                <p className="text-sm">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Magni, rem exercitationem perspiciatis voluptates modi officia
                  itaque odio alias temporibus! Ipsum?.
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-md">
                <MdSecurity className="mb-2" size={30} />
                <h4 className="font-semibold ">Keamanan & Privasi</h4>
                <p className="text-sm">
                  Data Anda aman dengan proteksi Row Level Security (RLS)
                  Supabase, session management, dan akses board yang hanya bisa
                  dibuka oleh user yang sudah login. Privasi dan keamanan
                  menjadi prioritas utama dalam setiap aktivitas di KanbanBoard.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Section How It Works (Interaktif) */}
        <section className="pt-16">
          <div className="w-full mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-100 drop-shadow-lg ">
              Langkah Penggunaan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {/* Step 1 */}
              <div className="group bg-gray-800 border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105 hover:border-green-500 shadow-lg cursor-pointer">
                <MdLogin className="text-green-400 text-4xl mb-3 group-hover:animate-bounce" />
                <span className="font-semibold mb-1 text-lg">
                  Daftar / Login
                </span>
                <span className="text-gray-300 text-sm text-center">
                  Masuk dengan email atau Google untuk mulai menggunakan
                  aplikasi.
                </span>
              </div>
              {/* Step 2 */}
              <div className="group bg-gray-800 border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105 hover:border-blue-500 shadow-lg cursor-pointer">
                <MdOutlineViewKanban className="text-blue-400 text-4xl mb-3 group-hover:animate-bounce" />
                <span className="font-semibold mb-1 text-lg">Buat Board</span>
                <span className="text-gray-300 text-sm text-center">
                  Buat board baru sesuai kebutuhan proyek Anda.
                </span>
              </div>
              {/* Step 3 */}
              <div className="group bg-gray-800 border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105 hover:border-yellow-400 shadow-lg cursor-pointer">
                <MdAddBox className="text-yellow-400 text-4xl mb-3 group-hover:animate-bounce" />
                <span className="font-semibold mb-1 text-lg">Tambah Task</span>
                <span className="text-gray-300 text-sm text-center">
                  Tambahkan tugas ke kolom yang sesuai dengan mudah.
                </span>
              </div>
              {/* Step 4 */}
              <div className="group bg-gray-800 border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105 hover:border-pink-400 shadow-lg cursor-pointer">
                <MdDragIndicator className="text-pink-400 text-4xl mb-3 group-hover:animate-bounce" />
                <span className="font-semibold mb-1 text-lg">Drag & Drop</span>
                <span className="text-gray-300 text-sm text-center">
                  Pindahkan tugas antar kolom dengan drag & drop interaktif.
                </span>
              </div>
              {/* Step 5 */}
              <div className="group bg-gray-800 border-2 border-gray-700 rounded-xl p-6 flex flex-col items-center transition-transform hover:scale-105 hover:border-emerald-400 shadow-lg cursor-pointer">
                <MdDone className="text-emerald-400 text-4xl mb-3 group-hover:animate-bounce" />
                <span className="font-semibold mb-1 text-lg">Selesai!</span>
                <span className="text-gray-300 text-sm text-center">
                  Pantau progres dan selesaikan tugas dengan lebih terstruktur.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section Demo Board */}
        <section className="pt-16">
          <div className="w-full mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-100 drop-shadow-lg text-center">
              Coba Demo Board
            </h2>
            <p className="text-center text-gray-300 mb-6">
              Rasakan langsung fitur drag & drop, tambah, dan hapus task tanpa
              login. <span className="italic">(Data tidak tersimpan)</span>
            </p>
            <div className="rounded-lg shadow-lg overflow-x-auto bg-gray-950/80 p-4">
              <BoardLocal />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
