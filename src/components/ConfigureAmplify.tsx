'use client';

import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';

// This component configures Amplify on the client side
export default function ConfigureAmplify({ children }: { children: React.ReactNode }) {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    async function configure() {
      try {
        // Try to load amplify_outputs.json dynamically
        const outputs = await import('../../amplify_outputs.json');
        Amplify.configure(outputs.default || outputs);
        setConfigured(true);
      } catch {
        // Running without Amplify backend (development mode)
        console.log('Amplify outputs not found - running in development mode');
        setConfigured(true);
      }
    }
    configure();
  }, []);

  if (!configured) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return <>{children}</>;
}
