import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Configurator from "@/pages/configurator";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Configurator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading Power Whip Configurator");

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, message: "Loading Power Whip Configurator", submessage: "Initializing application framework..." },
      { progress: 40, message: "Loading Components", submessage: "Loading electrical components library..." },
      { progress: 60, message: "Setting Up AG-Grid", submessage: "Initializing professional spreadsheet features..." },
      { progress: 80, message: "Loading Design Canvas", submessage: "Preparing visual design interface..." },
      { progress: 100, message: "Ready!", submessage: "Power Whip Configurator is ready to use" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setLoadingProgress(step.progress);
        setLoadingMessage(step.message);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsLoading(false), 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} progress={loadingProgress} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
