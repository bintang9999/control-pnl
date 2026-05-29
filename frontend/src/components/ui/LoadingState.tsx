export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[300px]">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}
