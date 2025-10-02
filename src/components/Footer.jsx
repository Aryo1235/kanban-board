import React from "react";

export default function Footer() {
  return (
    <div>
      <footer className="bg-gray-800 text-gray-400 pt-8">
        <section className="container mx-auto p-4 flex flex-col md:flex-row justify-between gap-8 mb-8">
          {/* Kiri: Logo, judul, deskripsi, sosmed */}
          <div className="flex-1  min-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold bg-green-600 px-3 text-white py-1 rounded-md">
                B
              </span>
              <h3 className="text-lg font-semibold text-white">Team Bokaw</h3>
            </div>
            <p className="mb-4 text-sm max-w-64 ">
              Team Bokaw adalah tim pengembang perangkat lunak yang berdedikasi
              untuk menciptakan solusi inovatif.
            </p>
            <div className="flex gap-2">
              {/* Ganti dengan icon react-icons sesuai kebutuhan */}
              <span className="bg-gray-700 p-2 rounded-md text-white">F</span>
              <span className="bg-gray-700 p-2 rounded-md text-white">T</span>
              <span className="bg-gray-700 p-2 rounded-md text-white">I</span>
            </div>
          </div>
          {/* Tengah: Layanan */}
          <div className="flex-1 min-w-[180px]">
            <h4 className="font-semibold text-green-400 mb-2">Layanan</h4>
            <ul className="space-y-1">
              <li>Konsultasi IT</li>
              <li>Pengembangan Software</li>
              <li>Cloud Solutions</li>
              <li>Keamanan Cyber</li>
              <li>Data Analytics</li>
              <li>Digital Transformation</li>
            </ul>
          </div>
          {/* Kanan: Perusahaan */}
          <div className="flex-1 min-w-[180px]">
            <h4 className="font-semibold text-green-400 mb-2">Perusahaan</h4>
            <ul className="space-y-1">
              <li>Tentang Kami</li>
              <li>Tim Kami</li>
              <li>Karir</li>
              <li>Blog</li>
              <li>Press Release</li>
              <li>Partnership</li>
            </ul>
          </div>
          <div className="flex-1 min-w-[180px]">
            <h4 className="font-semibold text-green-400 mb-2">Kontak Kami</h4>
            <ul className="space-y-1">
              <li>Email: info@teambokaw.com</li>
              <li>Telepon: (021) 123-4567</li>
              <li>Alamat: Jl. Bokaw No. 123, Kota Bokaw</li>
            </ul>
            <div className=" pt-6">
              <h4 className="font-semibold text-green-400 mb-2">Newsletter</h4>
              <p className="mb-4 text-sm max-w-64 ">
                Dapatkan pembaruan terbaru dari kami langsung di kotak masuk
                Anda.
              </p>
              <form className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Email Anda"
                  className="p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                />
                <button className="bg-green-600 text-white py-2 rounded-md cursor-pointer">
                  Berlangganan
                </button>
              </form>
            </div>
          </div>
        </section>
        <div className=" text-gray-500 border-t border-gray-600  py-4 mt-5 ">
          <p className="text-center text-sm">
            &copy; 2023 Team Bokaw. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
