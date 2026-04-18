export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dims = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${dims} relative`} style={{ animation: 'spin 0.8s linear infinite' }}>
      <div className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(99,102,241,0.1)' }} />
      <div className="absolute inset-0 rounded-full"
        style={{ border: '2px solid transparent', borderTopColor: '#6366f1', borderRightColor: 'rgba(6,182,212,0.6)' }} />
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center"
    style={{ backgroundColor: '#03050f' }}>
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-xs font-mono tracking-widest" style={{ color: '#334155' }}>LOADING</p>
    </div>
  </div>
);
