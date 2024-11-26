import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTokenForm } from "@/app/dex/components/CreateTokenForm";
import { BuyTokenForm } from "@/app/dex/components/BuyTokenForm";
import { WithdrawTokenForm } from "@/app/dex/components/WithdrawTokenForm";
import { SacrificeForm } from "@/app/dex/components/SacrificeForm";
// import AllTokensDisplay from "@/app/factory/components/AllTokensDisplay";
import { Container } from "@/components/craft";

const TakeAction = () => {
  return (
    <Container>
      <Tabs defaultValue="create" className="mt-8">
        <TabsList className="hidden">
          <TabsTrigger value="create">Create Token</TabsTrigger>
          <TabsTrigger value="buy">Buy Token</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw Token</TabsTrigger>
          <TabsTrigger value="sacrifice">Sacrifice</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Token</CardTitle>
              <CardDescription>Deploy a new token contract</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTokenForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle>Buy Token</CardTitle>
              <CardDescription>
                Purchase tokens during ICO phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuyTokenForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Token</CardTitle>
              <CardDescription>Withdraw your purchased tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawTokenForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sacrifice">
          <SacrificeForm />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default TakeAction;
