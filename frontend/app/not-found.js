"use client";

import { useRouter } from "next/navigation";
import React from "react";

const NotFound = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-6">
      <h1 className="text-6xl font-extrabold">404</h1>
      <h2 className="text-lg">This page does not exist</h2>
      <p className="text-lg">Go back to the Homepage</p>
      <button
        onClick={() => router.push("/")}
        className="p-2 text-md bg-blue-100 border border-blue-300 rounded"
      >
        Home
      </button>
    </div>
  );
};

export default NotFound;
