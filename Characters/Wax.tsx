import { useState, useEffect } from "react";
import Character from "./Character";
import { useGameContext } from "@/contexts/game-context";

function Wax({}: any) {
  const name = "Wax";

  const { gameTimer, heroHealth, applyDamage, gameStatus, gameRestart } =
    useGameContext();

  const [attackLevel, setAttackLevel] = useState(0);
  const [healLevel, setHealLevel] = useState(0);
  const [ultLevel, setUltLevel] = useState(0);
  const [message, setMessage] = useState("");

  const attackMessages = [
    "The void nears...",
    "Shadows whisper...",
    "Dance with despair...",
    "Sorrow's web tightens...",
    "Abyss gazes back...",
    "Fate's hand beckons...",
  ];

  const healMessages = [
    "Light finds a way...",
    "Hope whispers softly...",
    "Strength in each breath...",
    "Healing warmth surrounds...",
    "Embrace life's embrace...",
    "Tomorrow's promise glows...",
  ];

  function attack(damageDealt: number) {
    if (gameStatus != "running") {
      return;
    }
    if (attackLevel >= 100) {
      const randomIndex = Math.floor(Math.random() * 8);
      const damageAmount = randomIndex * 7;
      console.log(name + " attacks for " + damageAmount + " damage!");
      if (!randomIndex) {
        setMessage("Missed!");
      } else setMessage(attackMessages[randomIndex]);
      applyDamage("enemy", damageAmount);
      setAttackLevel(0);
      return randomIndex;
    } else return;
  }

  function heal() {
    if (healLevel >= 100) {
      const randomIndex = Math.floor(Math.random() * healMessages.length);
      const healAmount = heroHealth + randomIndex * 2;
      setMessage(healMessages[randomIndex]);
      console.log(name + " heals for " + healAmount + "!");
      setHealLevel(0);
    }
  }

  function ult() {
    if (gameStatus != "running") {
      return;
    }
    console.log(name + " ults!");
    applyDamage("enemy", 20);
  }

  // Sync with game timer
  useEffect(() => {
    if (gameRestart) {
      setAttackLevel(0);
      setHealLevel(0);
      setUltLevel(0);
      return;
    }
    if (gameStatus === "running") {
      setAttackLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 10 : prevProgress
      );
      setHealLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 10 : prevProgress
      );
      setUltLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 35 : prevProgress
      );
    }

    // Include any additional logic that needs to be run on each timer tick
  }, [gameTimer, gameStatus, gameRestart]); // Dependency on gameTimer and gameStatus

  return (
    <Character
      battle={true}
      name={name}
      message={message}
      image={"/horrifica/Wax.png"}
      width={100}
      health={heroHealth}
      attack={attack}
      heal={heal}
      ult={ult}
      attackLevel={attackLevel}
      healLevel={healLevel}
      ultLevel={ultLevel}
    />
  );
}

export default Wax;
