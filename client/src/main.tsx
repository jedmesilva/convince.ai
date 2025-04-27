import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AIChatProvider } from "./contexts/AIChatContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AIChatProvider>
        <Toaster />
        <App />
      </AIChatProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
