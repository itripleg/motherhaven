// components/AuthWrapper.tsx
import { WalletConnector } from "@/components/WalletConnector";
import { Container } from "@/components/craft";
import { useAuth } from "@/hooks/useAuth";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isConnected, mounted, connectors, handleConnect } = useAuth();

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <Container className="flex h-screen justify-center items-center">
        <WalletConnector
          connectors={connectors}
          onConnect={handleConnect}
          isLoading={false}
        />
      </Container>
    );
  }

  return <>{children}</>;
}
