// 메인 애플리케이션 관리 클래스
// 메인 애플리케이션 관리 클래스
class FitnessApp {
    // 애플리케이션 초기화
    static init() {
        // 오늘 날짜 설정
        DOM.setValue('selectedDate', DateUtils.today());
        
        // 초기 운동 목록 로드
        WorkoutManager.loadExercises(AppState.selectedCategory);
        
        // 이벤트 리스너 등록
        FitnessApp.setupEventListeners();
        
        // 초기 칼로리 계산
        SummaryManager.updateSummary();
        
        // 초기 캘린더 생성 (안전한 호출로 수정)
        if (typeof DataLoaderManager !== 'undefined') {
            DataLoaderManager.generateCalendar();
            
            // 스마트 자동 데이터 로딩 (페이지 로드 2초 후로 변경)
            setTimeout(() => {
                console.log('자동 데이터 로딩 시작...');
                DataLoaderManager.autoLoadCurrentMonthData()
                    .then(() => {
                        console.log('자동 데이터 로딩 완료');
                    })
                    .catch((error) => {
                        console.error('자동 데이터 로딩 실패:', error);
                    });
            }, 2000);
        } else {
            console.error('DataLoaderManager를 찾을 수 없습니다. data-loader.js 파일을 확인하세요.');
        }

        // 초기 운동 총합 업데이트
        WorkoutSummaryManager.updateWorkoutSummary();
        
        console.log('피트니스 트래커 애플리케이션이 초기화되었습니다.');
    }

    // 이벤트 리스너 설정
    static setupEventListeners() {
        FitnessApp.setupWorkoutEventListeners();
        FitnessApp.setupCardioEventListeners();
        FitnessApp.setupMealEventListeners();
        FitnessApp.setupDataLoaderEventListeners();
        FitnessApp.setupUtilityEventListeners();
    }

    // 웨이트 운동 관련 이벤트 리스너
    static setupWorkoutEventListeners() {
        // 카테고리 선택
        // 카테고리 선택 (웨이트 운동만)
        DOM.getAll('[data-category]').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.dataset.category;
                WorkoutManager.changeCategory(category);
            });
        });

        // 무게 입력 변경
        DOM.getAll('.weight-input').forEach(input => {
            input.addEventListener('input', WeightUtils.updateTotalWeight);
        });

        // 운동 선택 변경
        DOM.get('exerciseSelect').addEventListener('change', WorkoutManager.updateAddWorkoutButton);

        // 운동 추가
        DOM.get('addWorkout').addEventListener('click', WorkoutManager.addWorkout);

        // 체중 변경 이벤트
        DOM.get('userWeight').addEventListener('input', function() {
            AppState.userWeight = parseInt(this.value) || 87;
            SummaryManager.updateSummary();
        });
    }

    // 유산소 운동 관련 이벤트 리스너
    static setupCardioEventListeners() {
        // 유산소 종류 선택
        DOM.getAll('[data-cardio-type]').forEach(btn => {
            btn.addEventListener('click', function() {
                CardioManager.changeCardioType(this.dataset.cardioType);
            });
        });
        
        // 유산소 추가
        DOM.get('addCardio').addEventListener('click', CardioManager.addCardio);
    }

    // 식사 관련 이벤트 리스너
    static setupMealEventListeners() {
        // 아침 메뉴 토글
        DOM.get('useDefaultBreakfast').addEventListener('change', () => {
            MealManager.toggleBreakfastMenu();
            SummaryManager.updateSummary();
        });

        // 점심 메뉴 토글
        DOM.get('useDefaultLunch').addEventListener('change', () => {
            MealManager.toggleLunchMenu();
            SummaryManager.updateSummary();
        });

        // 저녁 메뉴 토글
        DOM.get('useDefaultDinner').addEventListener('change', () => {
            MealManager.toggleDinnerMenu();
            SummaryManager.updateSummary();
        });

        // 커스텀 음식 추가
        DOM.get('addCustomBreakfast').addEventListener('click', () => {
            MealManager.addCustomBreakfast();
            SummaryManager.updateSummary();
        });
        DOM.get('addCustomLunch').addEventListener('click', () => {
            MealManager.addCustomLunch();
            SummaryManager.updateSummary();
        });
        DOM.get('addCustomFood').addEventListener('click', () => {
            MealManager.addCustomFood();
            SummaryManager.updateSummary();
        });
    }

    // 데이터 불러오기 관련 이벤트 리스너
    static setupDataLoaderEventListeners() {
    // DataLoaderManager가 정의되어 있는지 확인
    if (typeof DataLoaderManager === 'undefined') {
        console.error('DataLoaderManager가 정의되지 않았습니다. data-loader.js 파일을 확인하세요.');
        return;
    }
    
    // 월별 데이터 불러오기 버튼
    const loadBtn = DOM.get('loadMonthBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', DataLoaderManager.loadMonthlyDataFromSupabase);
    }
    
    // 데이터 적용 버튼
    const applyBtn = DOM.get('applyDataBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', DataLoaderManager.applySelectedDateData);
    }

    // 캘린더 이동 버튼들
    const prevBtn = DOM.get('prevMonthBtn');
    const nextBtn = DOM.get('nextMonthBtn');
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', DataLoaderManager.moveToPreviousMonth);
        nextBtn.addEventListener('click', DataLoaderManager.moveToNextMonth);
    }
}

    // 유틸리티 관련 이벤트 리스너
    static setupUtilityEventListeners() {
        // 데이터 다운로드
        DOM.get('downloadData').addEventListener('click', ExcelManager.downloadData);
        
        // Supabase 저장
        DOM.get('saveToSupabase').addEventListener('click', FitnessApp.saveAllDataToSupabase);
        
        // 전체 초기화
        DOM.get('resetAll').addEventListener('click', FitnessApp.resetAllData);
    }

    // 전체 데이터 Supabase에 저장
    static saveAllDataToSupabase() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefaultBreakfast = DOM.get('useDefaultBreakfast').checked;
        const useDefaultLunch = DOM.get('useDefaultLunch').checked;
        const useDefaultDinner = DOM.get('useDefaultDinner').checked;
        
        supabaseManager.saveAllData(
            selectedDate,
            AppState.workouts,
            AppState.cardioWorkouts,
            useDefaultBreakfast,
            useDefaultLunch,
            useDefaultDinner,
            AppState.customBreakfastItems,
            AppState.customLunchItems,
            AppState.customDinnerItems,
            AppState.userWeight
        ).then(() => {
        // 저장 완료 후 1초 뒤에 새로고침
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }).catch((error) => {
        console.error('저장 오류:', error);
        // 에러가 발생해도 새로고침
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    }

    // 전체 데이터 초기화
    static resetAllData() {
        if (!NotificationUtils.confirm('모든 운동 및 식사 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        // 모든 데이터 배열 초기화
        AppState.workouts = [];
        AppState.cardioWorkouts = [];
        AppState.customBreakfastItems = [];
        AppState.customLunchItems = [];
        AppState.customDinnerItems = [];
        
        // 웨이트 운동 폼 초기화
        FormUtils.resetWorkoutForm();
        
        // 유산소 운동 폼 초기화  
        FormUtils.resetCardioForm();
        
        // 식사 데이터 초기화
        MealManager.resetMealData();
        
        // 커스텀 음식 입력 폼 초기화
        FormUtils.resetCustomFoodForm();
        
        // 데이터 불러오기 UI 초기화
        DataLoaderManager.resetDataLoader();
        
        // 화면 렌더링 업데이트
        WorkoutManager.renderWorkouts();
        CardioManager.renderCardio();
        MealManager.renderCustomBreakfast();
        MealManager.renderCustomLunch();
        MealManager.renderCustomFoods();
        SummaryManager.updateSummary();
        
        NotificationUtils.alert('모든 데이터가 초기화되었습니다.');

            // 초기화 완료 후 1초 뒤에 새로고침
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

}

// DOM이 로드되면 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    FitnessApp.init();
});

// 전역 함수들 (HTML에서 직접 호출되는 함수들)
window.WorkoutManager = WorkoutManager;
window.CardioManager = CardioManager;
window.MealManager = MealManager;
