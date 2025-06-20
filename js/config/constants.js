// Supabase 설정
const SUPABASE_CONFIG = {
    URL: 'https://zrbasozrsrszftrqvbcb.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmFzb3pyc3JzemZ0cnF2YmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjk3NDUsImV4cCI6MjA2NTg0NTc0NX0.ab4BgFlJKjyMTCLTxrom5guw7EGzPWThhsjdzcvrGxg',
    USER_ID: '550e8400-e29b-41d4-a716-446655440000'
};

// 운동 데이터베이스 (MET 기반)
const EXERCISE_DATABASE = {
    back: {
        name: '등',
        exercises: {
            'lat_pulldown_wide': { name: '랫풀다운 (와이드 그립)', met: 6.5 },
            'lat_pulldown_narrow': { name: '랫풀다운 (네로우 그립)', met: 6.0 },
            'high_row_cable': { name: '하이로우 (케이블)', met: 6.8 },
            'high_row_machine': { name: '하이로우 (머신)', met: 6.5 },
            'seated_row': { name: '시티드 로우', met: 6.5 },
            'one_arm_seated_row': { name: '원암 시티드 로우', met: 7.0 },
            'reverse_pec_deck': { name: '리버스 펙덱 플라이', met: 5.5 }
        }
    },
    chest: {
        name: '가슴',
        exercises: {
            'flat_bench_barbell': { name: '플랫 벤치 바벨 체스트 프레스', met: 8.0 },
            'flat_bench_dumbbell': { name: '플랫 벤치 덤벨 체스트 프레스', met: 7.5 },
            'incline_smith': { name: '인클라인 스미스 머신 체스트 프레스', met: 7.0 },
            'incline_dumbbell': { name: '인클라인 덤벨 체스트 프레스', met: 7.5 },
            'cable_chest_press': { name: '케이블 체스트 프레스', met: 6.5 },
            'pec_deck_fly': { name: '펙덱 플라이', met: 5.8 }
        }
    },
    shoulder: {
        name: '어깨',
        exercises: {
            'incline_smith_shoulder': { name: '인클라인 스미스 머신 체스트 프레스 (어깨 중심)', met: 6.8 },
            'dumbbell_shoulder_press': { name: '덤벨 숄더 프레스', met: 7.2 },
            'side_lateral_raise': { name: '사이드 레터럴 레이즈', met: 5.5 },
            'ez_bar_upright_row': { name: '이지바 업라이트 로우', met: 6.5 },
            'cable_face_pull': { name: '케이블 페이스 풀', met: 5.8 },
            'reverse_pec_deck_shoulder': { name: '리버스 펙덱 플라이 (어깨)', met: 5.5 }
        }
    }
};

// 무게 강도별 MET 보정값 (체중 대비)
const WEIGHT_INTENSITY_BONUS = {
    light: 0,      // 체중의 0-30%
    moderate: 0.5, // 체중의 31-50%  
    heavy: 1.0,    // 체중의 51-70%
    veryHeavy: 1.5 // 체중의 71%+
};

// 런닝머신 MET 값 (속도별)
const TREADMILL_MET = {
    1.0: 2.0, 1.5: 2.2, 2.0: 2.5, 2.5: 2.8, 3.0: 3.0, 3.5: 3.3,
    4.0: 3.5, 4.5: 3.8, 5.0: 4.0, 5.5: 4.3, 6.0: 4.5, 6.5: 5.0,
    7.0: 5.5, 7.5: 6.0, 8.0: 8.0, 8.5: 8.5, 9.0: 9.0, 9.5: 9.5,
    10.0: 10.0, 10.5: 10.5, 11.0: 11.0, 11.5: 11.5, 12.0: 12.0
};

// 경사 보정값 (각도별)
const INCLINE_BONUS = {
    1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1.0,
    6: 1.2, 7: 1.4, 8: 1.6, 9: 1.8, 10: 2.0
};

// 고정 칼로리 값
const MEAL_CALORIES = {
    breakfast: 180,
    lunch: 420,
    defaultDinner: 360
};

// 기본 설정값
const DEFAULT_VALUES = {
    userWeight: 87,
    reps: 10,
    sets: 3,
    incline: 1,
    speed: 6.0,
    duration: 30
};