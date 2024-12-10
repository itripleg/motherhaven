import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Set to true to skip splash page and redirect immediately
const SKIP_SPLASH = true;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    if (SKIP_SPLASH) {
      router.push("/dex");
      return;
    }

    const timer = setTimeout(() => {
      router.push("/dex");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  // If skipping, don't render anything
  if (SKIP_SPLASH) {
    return null;
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] flex items-center justify-center">
      <motion.div
        className="text-center px-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text)] mb-4">
            Motherhaven
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text)] opacity-80">
            Decentralized Exchange
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center"
        >
          <Loader2 className="animate-spin h-8 w-8 md:h-10 md:w-10 text-[var(--color-primary)] mb-4" />
          <p className="text-sm md:text-base text-[var(--color-text)] opacity-60">
            Loading secure trading environment...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
