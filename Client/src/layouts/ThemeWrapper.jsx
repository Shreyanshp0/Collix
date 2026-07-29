function ThemeWrapper({ children }) {
  return <div className="min-h-screen bg-background text-primaryText">{children}</div>;
}

export default ThemeWrapper;
