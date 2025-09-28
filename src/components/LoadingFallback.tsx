import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface LoadingFallbackProps {
  children: React.ReactNode;
}

const LoadingFallback = ({ children }: LoadingFallbackProps) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Show fallback after 8 seconds of loading
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">로딩이 너무 오래 걸려요</h1>
          <p className="text-muted-foreground mb-4">
            앱이 로딩 중에 멈춘 것 같습니다. 새로고침을 시도해주세요.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              페이지 새로고침
            </Button>
            <Button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              variant="outline"
              className="w-full"
            >
              캐시 삭제 후 새로고침
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            계속 문제가 발생하면 환경 변수 설정을 확인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingFallback;