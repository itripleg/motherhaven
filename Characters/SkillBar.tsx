import React from "react";
import SkillIcon from "../game-components/SkillIcon";
import ProgressBar from "../game-components/ProgressBar";
import { useGameContext } from "@/contexts/game-context";

type Props = {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  health: number;
  attackLevel?: number;
  healLevel?: number;
  ultLevel?: number;
  attack: Function;
  heal: Function;
  ult: Function;
  battle: boolean;
};

function SkillBar({
  health,
  attackLevel,
  healLevel,
  ultLevel,
  width,
  attack,
  heal,
  ult,
}: Props) {
  return (
    <div>
      <div style={{ width: `${width}px` }} className="min-w-[100px] h-[200px]">
        <ProgressBar icon={"💓"} progress={health} style={"bg-green-800"} />
        <SkillIcon icon="⚔" level={attackLevel} action={() => attack()} />
        <SkillIcon icon="🥩" level={healLevel} action={() => heal()} />
        <SkillIcon icon="🌚" level={ultLevel} action={() => ult()} />
      </div>
    </div>
  );
}

export default SkillBar;
