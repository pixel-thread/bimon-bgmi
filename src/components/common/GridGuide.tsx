"use client";
import React, { useEffect, useState } from "react";

export const GridGuide = () => {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setColumns(12);
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setColumns(8);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      <div className="container mx-auto h-full w-full grid grid-cols-4 gap-2 md:grid-cols-8 md:gap-4 lg:grid-cols-12 lg:gap-5">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="bg-red-500/5 h-full w-full" />
        ))}
      </div>
    </div>
  );
};
