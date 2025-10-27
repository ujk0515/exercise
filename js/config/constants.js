// Supabase 설정 - 환경변수를 통해 동적으로 로드
let SUPABASE_CONFIG = {};

// 환경변수 초기화 함수
async function initializeSupabaseConfig() {
    await envManager.loadConfig();
    const config = envManager.getConfig();

    SUPABASE_CONFIG = {
        URL: config.SUPABASE_URL,
        ANON_KEY: config.SUPABASE_ANON_KEY,
        USER_ID: config.USER_ID || '550e8400-e29b-41d4-a716-446655440000'
    };

    console.log('Supabase 설정 초기화 완료');
}

// 운동 데이터베이스 (MET 기반) - 바벨/덤벨/머신 타입 정리
const EXERCISE_DATABASE = {
    back: {
        name: '등',
        exercises: {
            'lat_pulldown_wide': { name: '랫풀다운 (와이드 그립)', met: 4.8, type: 'machine' },
            'lat_pulldown_narrow': { name: '랫풀다운 (네로우 그립)', met: 4.5, type: 'machine' },
            'high_row_cable': { name: '하이로우 (케이블)', met: 5.0, type: 'machine' },
            'high_row_machine': { name: '하이로우 (머신)', met: 4.8, type: 'machine' },
            'seated_row': { name: '시티드 로우', met: 4.8, type: 'machine' },
            'one_arm_seated_row': { name: '원암 시티드 로우', met: 4.8, type: 'machine', singleSide: true },
            'reverse_pec_deck': { name: '리버스 펙덱 플라이', met: 4.0, type: 'machine' },
            'cable_arm_pulldown': { name: '케이블 암 풀다운', met: 4.5, type: 'machine' },
            'tbar_row': { name: 'T바 로우', met: 5.5, type: 'barbell' }
        }
    },
    chest: {
        name: '가슴',
        exercises: {
            'flat_bench_barbell': { name: '플랫 벤치 바벨 체스트 프레스', met: 6.0, type: 'barbell' },
            'flat_bench_dumbbell': { name: '플랫 벤치 덤벨 체스트 프레스', met: 5.8, type: 'dumbbell' },
            'incline_smith': { name: '인클라인 스미스 머신 체스트 프레스', met: 5.5, type: 'machine' },
            'incline_barbell': { name: '인클라인 바벨 체스트 프레스', met: 6.2, type: 'barbell' },
            'incline_dumbbell': { name: '인클라인 덤벨 체스트 프레스', met: 6.0, type: 'dumbbell' },
            'cable_chest_press': { name: '케이블 체스트 프레스', met: 4.8, type: 'machine' },
            'seated_chest_press': { name: '시티드 체스트 프레스', met: 4.5, type: 'machine' },
            'pec_deck_fly': { name: '펙덱 플라이', met: 4.2, type: 'machine' }
        }
    },
    shoulder: {
        name: '어깨',
        exercises: {
            'incline_smith_shoulder': { name: '인클라인 스미스 머신 체스트 프레스 (어깨 중심)', met: 5.0, type: 'machine' },
            'dumbbell_shoulder_press': { name: '덤벨 숄더 프레스', met: 5.5, type: 'dumbbell' },
            'smith_machine_shoulder_press_single': { name: '스미스 머신 숄더 프레스 (한쪽씩)', met: 4.5, type: 'machine', singleSide: true },
            'side_lateral_raise': { name: '사이드 레터럴 레이즈', met: 4.0, type: 'dumbbell' },
            'y_raise': { name: 'Y-레이즈', met: 4.2, type: 'dumbbell' },
            'ez_bar_upright_row': { name: '이지바 업라이트 로우', met: 4.8, type: 'barbell' },
            'cable_face_pull': { name: '케이블 페이스 풀', met: 4.2, type: 'machine' },
            'machine_shoulder_press': { name: '머신 숄더 프레스', met: 4.5, type: 'machine' },
            'reverse_pec_deck_shoulder': { name: '리버스 펙덱 플라이 (어깨)', met: 4.0, type: 'machine' }
        }
    },
    legs: {
        name: '하체',
        exercises: {
            'leg_press': { name: '레그프레스', met: 5.5, type: 'machine' },
            'leg_press_single': { name: '레그프레스(다리 한쪽씩x2)', met: 5.5, type: 'machine', singleSide: true },
            'seated_leg_press': { name: '시티드 레그프레스', met: 5.2, type: 'machine' },
            'seated_leg_press_single': { name: '시티드 레그프레스(다리 한쪽씩x2)', met: 5.2, type: 'machine', singleSide: true },
            'hip_adduction': { name: '힙 어덕션(안쪽)', met: 4.0, type: 'machine' },
            'hip_abduction': { name: '힙 어브덕션(바깥쪽)', met: 4.0, type: 'machine' },
            'leg_extension': { name: '레그 익스텐션', met: 4.5, type: 'machine' },
            'leg_curl': { name: '레그 컬', met: 4.5, type: 'machine' },
            'split_squat': { name: '스플릿 스쿼트(맨몸)', met: 3.5, bodyweight: true, type: 'bodyweight' }
        }
    }
};

// 무게 강도별 MET 보정값 (체중 대비) - 현실적으로 조정됨
const WEIGHT_INTENSITY_BONUS = {
    light: 0,        // 체중의 0-30%
    moderate: 0.2,   // 체중의 31-50% (기존 0.5에서 감소)
    heavy: 0.4,      // 체중의 51-70% (기존 1.0에서 감소)
    veryHeavy: 0.6   // 체중의 71%+ (기존 1.5에서 감소)
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
    6: 1.2, 7: 1.4, 8: 1.6, 9: 1.8, 10: 2.0,
    11: 2.2, 12: 2.4
};

// 사이클 MET 값 (강도별)
const CYCLE_MET = {
    1: 2.8, 2: 3.2, 3: 3.8, 4: 4.5, 5: 5.2,
    6: 6.0, 7: 6.8, 8: 7.8, 9: 8.8, 10: 10.0
};

// 사이드스텝 MET 값 (스텝박스 고정)
const SIDESTEP_MET = 6.0;

// 🔥 새로 추가: 일반 계단 오르기 MET 값
// 층수당 기본 칼로리 소모 (체중 1kg당 층당 0.15kcal 기준으로 MET 환산)
const REGULAR_STAIRS_MET_PER_FLOOR = 0.05; // 층당 추가 MET

// 🔥 새로 추가: 천국의 계단(StairMaster) MET 값 (속도별)
const STAIRMASTER_MET = {
    1: 4.0,  // 느린 속도
    2: 4.5,
    3: 5.0,
    4: 5.5,
    5: 6.0,  // 보통 속도
    6: 6.5,
    7: 7.0,
    8: 7.5,
    9: 8.0,
    10: 9.0  // 빠른 속도
};

// 고정 칼로리 값
const MEAL_CALORIES = {
    breakfast: 200,
    lunch: {
        galbi: 480,
        kakdugi: 475,
        egg: 510
    },
    defaultDinner: 360
};