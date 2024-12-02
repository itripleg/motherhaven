import { motion } from "framer-motion";
import React from "react";
import Background from "./Background";
import Image from "next/image";
type Props = {};

const LoadingBar = ({ icon = null, progress, style = "bg-red-800" }: any) => {
  return (
    <div className="">
      <p className="text-[25px] text-center">{icon}</p>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border-[2px]">
        <motion.div
          className={`h-full ${style}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </div>
    </div>
  );
};

export default LoadingBar;
