import React from "react";
import { CreateTokenForm } from "../components/CreateTokenForm";
import { Container } from "@/components/craft";

type Props = {};
function page({}: Props) {
  return (
    <div>
      <Container>
        <CreateTokenForm />
      </Container>
    </div>
  );
}

export default page;
