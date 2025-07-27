import { BondingCurveVisualizer } from "@/components/bonding-curve";
import React from "react";

type Props = {};

function page({}: Props) {
  return (
    <div className="p-32">
      <BondingCurveVisualizer />
    </div>
  );
}

export default page;
