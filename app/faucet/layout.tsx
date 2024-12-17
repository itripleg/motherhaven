import React from "react";
import { FAUCET_ADDRESS } from "@/types";
import { AddressComponent } from "@/components/AddressComponent";

type Props = { children: any };

function layout({ children }: Props) {
  return (
    <div>
      <div className="text-primary flex justify-center items-center">
        Faucet address:{" "}
        <AddressComponent hash={FAUCET_ADDRESS} type={"address"} />
      </div>
      {children}
    </div>
  );
}

export default layout;
