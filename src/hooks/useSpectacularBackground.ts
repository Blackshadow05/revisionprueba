import { CSSProperties } from 'react';

export const useSpectacularBackground = (): CSSProperties => {
  return {
    backgroundColor: '#0C0E1D',
    backgroundImage: `
      radial-gradient(ellipse 80% 60% at 0% 0%, #0C0E1D 0%, rgba(12,14,29,0) 65%),
      radial-gradient(ellipse 80% 60% at 100% 0%, #616083 0%, rgba(97,96,131,0) 65%),
      radial-gradient(ellipse 70% 50% at 0% 50%, #616083 0%, rgba(97,96,131,0) 60%),
      radial-gradient(ellipse 70% 50% at 100% 50%, #211F36 0%, rgba(33,31,54,0) 60%),
      radial-gradient(ellipse 50% 40% at 50% 80%, #FF81FF 0%, rgba(255,129,255,0) 55%),
      radial-gradient(ellipse 90% 60% at 50% 100%, #51FAAA 0%, rgba(81,250,170,0) 65%)
    `,
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  };
};

export default useSpectacularBackground; 