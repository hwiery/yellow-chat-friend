import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth";
import { useState, useEffect } from "react";
import { parseAuthError, clearAuthErrorFromUrl, getAuthErrorMessage, hasAuthError } from "@/utils/auth";
import AuthDebug from "@/components/Debug/AuthDebug";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for auth errors on component mount
  useEffect(() => {
    if (hasAuthError()) {
      const authError = parseAuthError();
      if (authError) {
        console.error('Authentication error detected:', authError);
        toast({
          title: "로그인 실패",
          description: getAuthErrorMessage(authError),
          variant: "destructive"
        });

        // Clear error parameters from URL
        clearAuthErrorFromUrl();
      }
    }
  }, [toast]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('Initiating Google login...');

      const { data, error } = await authService.signInWithGoogle();

      if (error) {
        console.error('Google login error:', error);
        toast({
          title: "로그인 실패",
          description: "Google 로그인 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return;
      }

      console.log('Google login initiated successfully');
      // Note: Don't show success toast here as user will be redirected
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "로그인 실패",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">YellowTalk</h1>
          <p className="text-muted-foreground">간편하게 대화하세요</p>
        </div>

        {/* Login Card */}
        <Card className="border border-border">
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-3"
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{loading ? "로그인 중..." : "Google로 로그인"}</span>
            </Button>
            
            <div className="text-center text-xs text-muted-foreground">
              계속 진행하면 서비스 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
      <AuthDebug />
    </div>
  );
};

export default Login;