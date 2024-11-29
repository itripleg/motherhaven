import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import Moon from "@/components-3d/Moon";
import gsap from "gsap";

export const SpaceBackground = () => {
  const { theme } = useTheme();
  const lightRef = useRef();

  useEffect(() => {
    if (lightRef.current) {
      gsap.to(lightRef.current, {
        intensity: theme === "dark" ? 0.3 : 1,
        duration: 2.5,
      });
    }
  }, [theme]);

  return (
    <motion.div
      className="absolute left-0 right-0 w-full h-[1200px] top-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 6, delay: 0 }}
    >
      <Canvas>
        {/* @ts-expect-error always get this ref error */}
        <ambientLight intensity={1} ref={lightRef} />
        <directionalLight position={[0, 10, 0]} />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate={false}
          autoRotateSpeed={0.1}
        />
        <Moon scale={2} position={[0, 1.1, 0]} />
        <Stars />
      </Canvas>
    </motion.div>
  );
};
