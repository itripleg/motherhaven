import React from "react";

type Props = {};

function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="bg-black">{children}</div>;
}

export default layout;
