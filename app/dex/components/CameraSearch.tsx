import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { moveCamPosition } from "@/hooks/CamTools";
import { Skull } from "lucide-react";
import OuijAi from "@/components-3d/Ouija/OuijAi";

// CameraSearch.tsx
interface CameraSearchProps {
  cameraRef: React.RefObject<any>;
  onSecretFound: () => void;
  showSecret: boolean;
}

export const CameraSearch = ({
  cameraRef,
  onSecretFound,
  showSecret,
}: CameraSearchProps) => {
  const [position, setPosition] = useState("");
  const [lastPosition, setLastPosition] = useState([0, 0, -7]);

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
        onSecretFound();
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
        onSecretFound();
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.form
        animate={{ y: showSecret ? 500 : 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        onSubmit={handleCameraPosition}
        className="flex items-center space-x-4 mb-8 w-full"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "36vh",
              transition: {
                height: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                },
                opacity: { duration: 0.2 },
              },
            }}
            className="overflow-hidden w-full flex flex-col items-center"
          >
            <motion.div
            // animate={{
            //   rotate: [0, 360],
            //   scale: [1, 1.2, 1],
            // }}
            // transition={{
            //   duration: 2,
            //   repeat: Infinity,
            //   ease: "linear",
            // }}
            >
              <Skull className="w-16 h-16 text-red-500" />
              <OuijAi />
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
              className="text-2xl font-bold text-red-500 h-20"
            >
              You found the secret!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
