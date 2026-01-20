// Light mode (default)
export const lightGradients = {
  main: {
    baseGradient: "linear-gradient(135deg, rgba(219,234,254,0.05) 0%, rgba(191,219,254,0.02) 40%, rgba(147,197,253,0.01) 100%)",
    radial1: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 40%)",
    radial2: "radial-gradient(circle at 80% 80%, rgba(147,197,253,0.02) 0%, transparent 50%)"
  },
  accent: {
    baseGradient: "linear-gradient(135deg, rgba(196,181,253,0.08) 0%, rgba(168,85,247,0.04) 40%, rgba(147,197,253,0.01) 100%)",
    radial1: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.12) 0%, transparent 40%)",
    radial2: "radial-gradient(circle at 80% 80%, rgba(168,85,247,0.03) 0%, transparent 50%)"
  }
};

// Dark mode
export const darkGradients = {
  main: {
    baseGradient: "linear-gradient(135deg, rgba(30,58,87,0.25) 0%, rgba(217,70,56,0.18) 40%, rgba(244,114,61,0.15) 100%)",
    radial1: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08) 0%, transparent 40%)",
    radial2: "radial-gradient(circle at 80% 80%, rgba(236,100,82,0.18) 0%, transparent 50%)"
  },
  accent: {
    baseGradient: "linear-gradient(135deg, rgba(30,58,87,0.3) 0%, rgba(236,100,82,0.22) 40%, rgba(244,114,61,0.2) 100%)",
    radial1: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 40%)",
    radial2: "radial-gradient(circle at 80% 80%, rgba(244,114,61,0.22) 0%, transparent 50%)"
  }
};

export const getGradientStyle = (theme, type = 'main') => {
  const gradients = theme === 'dark' ? darkGradients : lightGradients;
  const selected = gradients[type];
  return `${selected.baseGradient}, ${selected.radial1}, ${selected.radial2}`;
};

export const getBackdropFilter = () => 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)';

export const getBoxShadow = (type = 'main') => {
  if (type === 'main') {
    return `inset -1px -1px 3px rgba(0,0,0,0.03), 
            inset 1px 1px 4px rgba(255,255,255,0.15),
            0 10px 40px rgba(31,65,100,0.05),
            0 1px 3px rgba(255,255,255,0.1),
            inset 0 -1px 0px rgba(0,0,0,0.02)`;
  }
  return `inset -1px -1px 3px rgba(0,0,0,0.02), 
          inset 1px 1px 4px rgba(255,255,255,0.15),
          0 10px 40px rgba(99,102,241,0.06),
          0 1px 3px rgba(255,255,255,0.1),
          inset 0 -1px 0px rgba(0,0,0,0.02)`;
};

export const getBorderColor = (theme) => theme === 'dark' ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.1)';