import * as React from "react";
import { cn } from "./utils";

const TabsContext = React.createContext(null);

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selectedValue = value ?? internalValue;

  const setSelectedValue = (nextValue) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ selectedValue, setSelectedValue }}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-md bg-muted p-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({ value, className, ...props }) {
  const context = React.useContext(TabsContext);
  const active = context?.selectedValue === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-white text-gray-950 shadow-sm" : "text-gray-600 hover:text-gray-950",
        className
      )}
      onClick={() => context?.setSelectedValue(value)}
      {...props}
    />
  );
}

function TabsContent({ value, className, ...props }) {
  const context = React.useContext(TabsContext);

  if (context?.selectedValue !== value) {
    return null;
  }

  return <div className={cn(className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
