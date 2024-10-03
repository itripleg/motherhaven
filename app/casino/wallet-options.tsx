import * as React from "react";
import { Connector, useConnect } from "wagmi";

export function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map((connector: any) => (
    <button
      className="p-2 border"
      key={connector.uid}
      onClick={() => connect({ connector })}
    >
      {connector.name}
    </button>
  ));
}
