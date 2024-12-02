import { useGameContext } from "@/contexts/game-context";
import { motion } from "framer-motion";
import Image from "next/image";

type Props = {};

export default function Background({}: Props) {
  const { wallpaper } = useGameContext();
  return (
    <>
      {wallpaper && (
        <motion.div
          className="absolute h-screen w-full"
          key={wallpaper}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <Image src={wallpaper} alt={""} fill={true} />
        </motion.div>
      )}
    </>
  );
}
