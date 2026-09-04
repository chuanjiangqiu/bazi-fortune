import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import App from "./app";
import "./index.css";

function ErrorFallback({ error }: FallbackProps & { error: Error }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">应用加载异常</h1>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-card rounded-md text-left">
          {error?.message || String(error)}
        </pre>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => window.location.reload()}
        >
          刷新重试
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary
        FallbackComponent={ErrorFallback as React.ComponentType<FallbackProps>}
      >
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
);
