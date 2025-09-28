import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EnvStatus = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isConfigured = supabaseUrl && supabaseAnonKey;

  return (
    <Card className="mt-4 border border-border">
      <CardHeader>
        <CardTitle className="text-sm">환경 설정 상태</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Supabase URL:</span>
          <span className={`font-mono ${supabaseUrl ? 'text-green-600' : 'text-red-600'}`}>
            {supabaseUrl ? '✓ 설정됨' : '✗ 누락'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Supabase Key:</span>
          <span className={`font-mono ${supabaseAnonKey ? 'text-green-600' : 'text-red-600'}`}>
            {supabaseAnonKey ? '✓ 설정됨' : '✗ 누락'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>전체 상태:</span>
          <span className={isConfigured ? 'text-green-600' : 'text-red-600'}>
            {isConfigured ? '✓ 정상' : '✗ 설정 필요'}
          </span>
        </div>
        {!isConfigured && (
          <p className="text-xs text-muted-foreground mt-2">
            Vercel에서 환경 변수를 설정해주세요:
            <br />• VITE_SUPABASE_URL
            <br />• VITE_SUPABASE_ANON_KEY
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvStatus;