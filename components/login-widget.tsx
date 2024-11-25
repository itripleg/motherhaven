"use client";
import { useKindeBrowserClient, LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { motion } from "framer-motion";
import React from "react";
import MyMenu2 from "./my-menu";

type Props = {};

function LoginWidget({}: Props) {
  const { user } = useKindeBrowserClient();

  const loginPromptVariants = {
    initial: { scale: 0 },
    animate: { rotate: [0, 10, -10, 10, -10, 0], scale: 1 },
    transition: { type: "spring", stiffness: 260, damping: 20 },
  };

  if (!user) {
    return (
      <motion.div
        className="min-h-screen p-8 flex justify-center items-center text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <motion.div
            variants={loginPromptVariants}
            initial="initial"
            animate="animate"
            className="inline-block"
          >
            <span role="img" aria-label="pointing down" className="text-4xl">
              👇
            </span>
          </motion.div>
          <p className="mt-4 text-lg">
            Please{" "}
            <LoginLink
              // postLoginRedirectURL={"/"}
              // postLoginRedirectURL="/dashboard"
              className="text-primary md:hover:underline underline md:no-underline"
            >
              login
            </LoginLink>{" "}
            to view Dashbaord.
          </p>
        </div>
      </motion.div>
    );
  }
}

export default LoginWidget;
