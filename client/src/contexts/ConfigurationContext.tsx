import { createContext, useContext, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PowerWhipConfiguration, ElectricalComponent, InsertPowerWhipConfiguration } from "@shared/schema";
import { validateConfiguration } from "@/lib/electricalCalculations";

interface ConfigurationContextType {
  configuration: Partial<PowerWhipConfiguration>;
  components: ElectricalComponent[];
  updateConfiguration: (updates: Partial<InsertPowerWhipConfiguration>) => void;
  addComponent: (component: ElectricalComponent) => void;
  removeComponent: (componentId: string) => void;
  saveConfiguration: () => Promise<void>;
  loadConfiguration: (id: string) => Promise<void>;
}

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export function ConfigurationProvider({ children }: { children: React.ReactNode }) {
  const [configuration, setConfiguration] = useState<Partial<PowerWhipConfiguration>>({
    name: "PowerWhip-001",
    voltage: 120,
    current: 20,
    wireGauge: "12",
    totalLength: 12.5,
    components: [],
    wireConnections: [],
    configuration: {},
    isValid: false,
  });
  
  const [components, setComponents] = useState<ElectricalComponent[]>([]);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const configData: InsertPowerWhipConfiguration = {
        name: configuration.name || "Untitled",
        voltage: configuration.voltage || 120,
        current: configuration.current || 20,
        wireGauge: configuration.wireGauge || "12",
        totalLength: configuration.totalLength || 0,
        components: components.map(c => c.id),
        wireConnections: configuration.wireConnections || [],
        configuration: configuration.configuration || {},
        isValid: configuration.isValid || false,
        validationResults: validateConfiguration({
          voltage: configuration.voltage || 120,
          current: configuration.current || 20,
          wireGauge: configuration.wireGauge || "12",
          totalLength: configuration.totalLength || 0,
        }),
      };

      const response = await apiRequest("POST", "/api/configurations", configData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configurations"] });
    },
  });

  const updateConfiguration = useCallback((updates: Partial<InsertPowerWhipConfiguration>) => {
    setConfiguration(prev => {
      const updated = { ...prev, ...updates };
      
      // Validate the updated configuration
      const validation = validateConfiguration({
        voltage: updated.voltage || 120,
        current: updated.current || 20,
        wireGauge: updated.wireGauge || "12",
        totalLength: updated.totalLength || 0,
      });
      
      updated.isValid = validation.isValid;
      updated.validationResults = validation;
      
      return updated;
    });
  }, []);

  const addComponent = useCallback((component: ElectricalComponent) => {
    setComponents(prev => [...prev, component]);
  }, []);

  const removeComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
  }, []);

  const saveConfiguration = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  const loadConfiguration = useCallback(async (id: string) => {
    try {
      const response = await apiRequest("GET", `/api/configurations/${id}`);
      const config = await response.json();
      setConfiguration(config);
      
      // Load components based on configuration
      const componentIds = Array.isArray(config.components) ? config.components : [];
      const componentPromises = componentIds.map((id: string) =>
        apiRequest("GET", `/api/components/${id}`).then(r => r.json())
      );
      
      const loadedComponents = await Promise.all(componentPromises);
      setComponents(loadedComponents.filter(Boolean));
    } catch (error) {
      console.error("Failed to load configuration:", error);
      throw error;
    }
  }, []);

  return (
    <ConfigurationContext.Provider
      value={{
        configuration,
        components,
        updateConfiguration,
        addComponent,
        removeComponent,
        saveConfiguration,
        loadConfiguration,
      }}
    >
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error("useConfiguration must be used within a ConfigurationProvider");
  }
  return context;
}
