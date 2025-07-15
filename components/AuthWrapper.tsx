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
      <WalletConnector
        connectors={connectors}
        onConnect={handleConnect}
        isLoading={false}
      />
    );
  }

  return <>{children}</>;
}
