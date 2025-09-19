// 환경변수 관리 클래스
class EnvironmentManager {
    constructor() {
        this.config = null;
    }

    // 로컬 환경 감지
    isLocalEnvironment() {
        return window.location.protocol === 'file:' ||
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.port !== '';
    }

    // Edge Function에서 환경변수 가져오기
    async loadConfig() {
        // 로컬 환경에서는 바로 기본값 사용
        if (this.isLocalEnvironment()) {
            console.log('로컬 환경 감지 - 기본값 사용');
            this.config = {
                SUPABASE_URL: 'https://zrbasozrsrszftrqvbcb.supabase.co',
                SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmFzb3pyc3JzemZ0cnF2YmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjk3NDUsImV4cCI6MjA2NTg0NTc0NX0.ab4BgFlJKjyMTCLTxrom5guw7EGzPWThhsjdzcvrGxg',
                USER_ID: '550e8400-e29b-41d4-a716-446655440000'
            };
            return this.config;
        }

        try {
            // 프로덕션 환경에서만 Edge Function 엔드포인트 호출
            const response = await fetch('/functions/v1/config');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            console.log('환경변수 로드 성공:', { hasUrl: !!this.config.SUPABASE_URL });
            return this.config;
        } catch (error) {
            console.error('환경변수 로드 실패 - 기본값 사용:', error);
            // Edge Function 호출 실패 시 기본값 사용
            this.config = {
                SUPABASE_URL: 'https://zrbasozrsrszftrqvbcb.supabase.co',
                SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmFzb3pyc3JzemZ0cnF2YmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjk3NDUsImV4cCI6MjA2NTg0NTc0NX0.ab4BgFlJKjyMTCLTxrom5guw7EGzPWThhsjdzcvrGxg',
                USER_ID: '550e8400-e29b-41d4-a716-446655440000'
            };
            return this.config;
        }
    }

    // 설정값 가져오기
    getConfig() {
        return this.config;
    }

    // 특정 환경변수 값 가져오기
    get(key) {
        return this.config ? this.config[key] : null;
    }
}

// 전역 환경변수 매니저 인스턴스
const envManager = new EnvironmentManager();