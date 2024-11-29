import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { moveCamPosition } from "@/hooks/CamTools";
import { Skull } from "lucide-react";

interface CameraSearchProps {
  cameraRef: React.RefObject<any>;
}

export const CameraSearch = ({ cameraRef }: CameraSearchProps) => {
  const [position, setPosition] = useState("");
  const [lastPosition, setLastPosition] = useState([0, 0, -7]);
  const [showSecret, setShowSecret] = useState(false);

  const checkSecretPosition = (pos: number[]) => {
    return (
      (pos[0] === 6 && pos[1] === 6 && pos[2] === 6) ||
      (pos[0] === 666 && pos[1] === 666 && pos[2] === 666)
    );
  };

  const handleCameraPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const coordinates = position.split(",").map(Number);
    if (
      coordinates.length === 3 &&
      coordinates.every((coord) => !isNaN(coord)) &&
      cameraRef?.current
    ) {
      const [x, y, z] = coordinates;
      setLastPosition([x, y, z]);
      moveCamPosition({ cameraRef, x, y, z, scale: 3 });

      if (checkSecretPosition([x, y, z])) {
        setShowSecret(true);
        setTimeout(() => setShowSecret(false), 6000); // Hide after 6 seconds
      }
    }
  };

  const getCurrentPosition = () => {
    if (cameraRef?.current) {
      const camera = cameraRef.current;
      const currentPos = [
        Math.round(camera.position.x),
        Math.round(camera.position.y),
        Math.round(camera.position.z),
      ];
      setPosition(currentPos.join(","));

      if (checkSecretPosition(currentPos)) {
        setShowSecret(true);
        setTimeout(() => setShowSecret(false), 6000);
      }
    }
  };

  return (
    <div className="relative">
      <motion.form
        onSubmit={handleCameraPosition}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-4 mb-8"
      >
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          type="text"
          placeholder="x,y,z (e.g. 1,2,3)"
          className="flex-grow z-40 bg-white/15 border-blue-500"
        />
        <Button type="button" onClick={getCurrentPosition} className="z-40">
          Current
        </Button>
        <Button type="submit" className="z-40">
          Look
        </Button>
      </motion.form>

      <AnimatePresence>
        {showSecret && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0,
              rotate: 180,
              transition: { duration: 0.5 },
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       flex flex-col items-center justify-center space-y-4 z-50"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Skull className="w-16 h-16 text-red-500" />
            </motion.div>
            <motion.h2
              animate={{
                color: ["#ff0000", "#ff6666", "#ff0000"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="text-2xl font-bold text-red-500"
            >
              You found the secret!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
