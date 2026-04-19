interface ScreenSizeProviderProps {
  children: React.ReactNode;
}

// Mobile is now supported — render children on all screen sizes
const ScreenSizeProvider = ({ children }: ScreenSizeProviderProps) => {
  return <>{children}</>;
};

export default ScreenSizeProvider; 