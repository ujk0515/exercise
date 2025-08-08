// AI 분석 관리 클래스 (고도화, 균형잡힌 코칭 스타일)
class AIManager {
    static async getAnalysis() {
        if (!GEMMA_API_KEY) {
            NotificationUtils.alert('Gemma API 키가 constants.js 파일에 설정되지 않았습니다.');
            return null;
        }

        // 1. 분석 대상 데이터 추출
        const analysisData = this.getAnalysisData();
        if (!analysisData) {
            NotificationUtils.alert('분석할 데이터가 없습니다. 먼저 월간 데이터를 불러와주세요.');
            return null;
        }

        // 2. 프롬프트 생성
        const prompt = this.createPrompt(analysisData);

        // 3. API 호출
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMMA_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API 요청 실패: ${errorBody.error.message}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('AI 분석 API 호출 오류:', error);
            NotificationUtils.alert(`AI 분석 중 오류가 발생했습니다: ${error.message}`);
            return null;
        }
    }

    static getAnalysisData() {
        const { workouts, cardio, meals } = AppState.monthlyData;
        if (workouts.length === 0 && cardio.length === 0 && meals.length === 0) {
            return null;
        }

        // 분석 대상 날짜 추출
        const dates = [...new Set([
            ...workouts.map(w => w.workout_date),
            ...cardio.map(c => c.workout_date),
            ...meals.map(m => m.meal_date)
        ])].sort();

        // 데이터 요약
        const totalWorkoutDays = new Set([...workouts.map(w => w.workout_date), ...cardio.map(c => c.workout_date)]).size;
        const totalVolume = workouts.reduce((sum, w) => sum + (w.total_weight * w.reps * w.sets), 0);
        const dinnerMeals = meals.filter(m => m.meal_type === 'dinner');
        const avgDinnerCalories = dinnerMeals.length > 0 ? dinnerMeals.reduce((sum, m) => sum + m.total_calories, 0) / dinnerMeals.length : 0;

        return {
            dates: dates,
            summary: `- 총 운동 횟수: ${totalWorkoutDays}회\n- 웨이트 총 볼륨: ${Math.round(totalVolume).toLocaleString()} kg\n- 저녁 식사 평균 칼로리: ${avgDinnerCalories.toFixed(0)} kcal`
        };
    }

    static createPrompt(analysisData) {
        return `당신은 사용자의 데이터를 분석하고 동기를 부여하는 친절하고 전문적인 피트니스 코치입니다.\n\n다음은 사용자가 선택한 특정 날짜들의 운동 및 식사 기록입니다. 이 데이터를 바탕으로, 아래 형식에 맞춰 사용자의 상태를 분석하고 조언해주세요.\n\n1. **종합 평가 (2~3 문장):** 데이터에 기반한 전반적인 상태를 긍정적으로 요약하고 격려해주세요.\n2. **잘하고 있는 점 (1~2개):** 구체적인 데이터를 근거로 칭찬할 점을 찾아주세요.\n3. **개선 제안 (1~2개):** 가장 개선이 필요한 부분에 대해 구체적이고 실천 가능한 조언을 제시해주세요.\n\n전체적으로 내용은 너무 길지 않게, 핵심만 전달하되 따뜻한 코칭 스타일을 유지해주세요.\n\n---데이터---\n\n[분석 대상 날짜]\n- ${analysisData.dates.join(', ')}\n\n[위 날짜들의 상세 기록 요약]\n${analysisData.summary}\n\n---분석 시작---`;
    }
}


// 메인 애플리케이션 관리 클래스
class FitnessApp {
    // 애플리케이션 초기화
    static init() {
        // 오늘 날짜 설정
        DOM.setValue('selectedDate', DateUtils.today());

        // 초기 사용자 정보 설정
        FitnessApp.initUserInfo();

        // 초기 운동 목록 로드
        WorkoutManager.loadExercises(AppState.selectedCategory);

        // 이벤트 리스너 등록
        FitnessApp.setupEventListeners();

        // 초기 칼로리 계산
        SummaryManager.updateSummary();

        // 초기 BMR/TDEE 계산 및 표시
        if (typeof UserInfoManager !== 'undefined') {
            UserInfoManager.updateBMRDisplay();
        }

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
        if (typeof WorkoutSummaryManager !== 'undefined') {
            WorkoutSummaryManager.updateWorkoutSummary();
        }

        // 차트 초기화 (새로 추가)
        if (typeof ChartManager !== 'undefined') {
            setTimeout(() => {
                ChartManager.renderAllCharts();
            }, 1000);
        }

        console.log('피트니스 트래커 애플리케이션이 초기화되었습니다.');
    }

    // 초기 사용자 정보 설정
    static initUserInfo() {
        // HTML에서 설정된 기본값들로 AppState 초기화
        AppState.userAge = parseInt(DOM.getValue('userAge')) || 25;
        AppState.userHeight = parseInt(DOM.getValue('userHeight')) || 175;
        AppState.userWeight = parseInt(DOM.getValue('userWeight')) || 87;
        AppState.userGender = 'male'; // 기본값
    }

    // 이벤트 리스너 설정
    static setupEventListeners() {
        FitnessApp.setupWorkoutEventListeners();
        FitnessApp.setupCardioEventListeners();
        FitnessApp.setupMealEventListeners();
        FitnessApp.setupDataLoaderEventListeners();
        FitnessApp.setupUtilityEventListeners();
        FitnessApp.setupUserInfoEventListeners(); // 새로 추가
    }

    // 사용자 정보 관련 이벤트 리스너 (새로 추가)
    static setupUserInfoEventListeners() {
        // 나이 입력 변경
        const ageInput = DOM.get('userAge');
        if (ageInput) {
            ageInput.addEventListener('input', function () {
                AppState.userAge = parseInt(this.value) || 25;
                if (typeof UserInfoManager !== 'undefined') {
                    UserInfoManager.updateBMRDisplay();
                }
                SummaryManager.updateSummary();
            });
        }

        // 키 입력 변경
        const heightInput = DOM.get('userHeight');
        if (heightInput) {
            heightInput.addEventListener('input', function () {
                AppState.userHeight = parseInt(this.value) || 175;
                if (typeof UserInfoManager !== 'undefined') {
                    UserInfoManager.updateBMRDisplay();
                }
                SummaryManager.updateSummary();
            });
        }

        // 헤더 체중 입력 변경
        const headerWeightInput = DOM.get('userWeightHeader');
        if (headerWeightInput) {
            headerWeightInput.addEventListener('input', function () {
                AppState.userWeight = parseInt(this.value) || 87;
                DOM.setValue('userWeight', this.value); // 웨이트 섹션 동기화
                if (typeof UserInfoManager !== 'undefined') {
                    UserInfoManager.updateBMRDisplay();
                }
                SummaryManager.updateSummary();
            });
        }

        // 성별 선택 변경
        DOM.getAll('input[name="userGender"]').forEach(radio => {
            radio.addEventListener('change', function () {
                AppState.userGender = this.value;
                if (typeof UserInfoManager !== 'undefined') {
                    UserInfoManager.updateBMRDisplay();
                }
                SummaryManager.updateSummary();
            });
        });
    }

    // 웨이트 운동 관련 이벤트 리스너
    static setupWorkoutEventListeners() {
        // 카테고리 선택 (웨이트 운동만)
        DOM.getAll('[data-category]').forEach(btn => {
            btn.addEventListener('click', function () {
                const category = this.dataset.category;
                if (typeof WorkoutManager !== 'undefined') {
                    WorkoutManager.changeCategory(category);
                }
            });
        });

        // 무게 입력 변경
        DOM.getAll('.weight-input').forEach(input => {
            input.addEventListener('input', function() {
                if (typeof WeightUtils !== 'undefined') {
                    WeightUtils.updateTotalWeight();
                }
            });
        });

        // 운동 선택 변경
        const exerciseSelect = DOM.get('exerciseSelect');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', function() {
                if (typeof WorkoutManager !== 'undefined') {
                    WorkoutManager.updateAddWorkoutButton();
                }
            });
        }

        // 운동 추가
        const addWorkout = DOM.get('addWorkout');
        if (addWorkout) {
            addWorkout.addEventListener('click', function() {
                if (typeof WorkoutManager !== 'undefined') {
                    WorkoutManager.addWorkout();
                }
            });
        }

        // 웨이트 섹션 체중 변경 이벤트
        const weightInput = DOM.get('userWeight');
        if (weightInput) {
            weightInput.addEventListener('input', function () {
                AppState.userWeight = parseInt(this.value) || 87;
                DOM.setValue('userWeightHeader', this.value); // 헤더 동기화
                if (typeof UserInfoManager !== 'undefined') {
                    UserInfoManager.updateBMRDisplay();
                }
                SummaryManager.updateSummary();
            });
        }
    }

    // 유산소 운동 관련 이벤트 리스너
    static setupCardioEventListeners() {
        // 유산소 종류 선택
        DOM.getAll('[data-cardio-type]').forEach(btn => {
            btn.addEventListener('click', function () {
                if (typeof CardioManager !== 'undefined') {
                    CardioManager.changeCardioType(this.dataset.cardioType);
                }
            });
        });

        // 유산소 추가
        const addCardio = DOM.get('addCardio');
        if (addCardio) {
            addCardio.addEventListener('click', function() {
                if (typeof CardioManager !== 'undefined') {
                    CardioManager.addCardio();
                }
            });
        }
    }

    // 식사 관련 이벤트 리스너
    static setupMealEventListeners() {
        // 아침 메뉴 토글
        const useDefaultBreakfast = DOM.get('useDefaultBreakfast');
        if (useDefaultBreakfast) {
            useDefaultBreakfast.addEventListener('change', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.toggleBreakfastMenu();
                }
                SummaryManager.updateSummary();
            });
        }

        // 점심 메뉴 토글
        const useDefaultLunch = DOM.get('useDefaultLunch');
        if (useDefaultLunch) {
            useDefaultLunch.addEventListener('change', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.toggleLunchMenu();
                }
                SummaryManager.updateSummary();
            });
        }

        // 저녁 메뉴 토글
        const useDefaultDinner = DOM.get('useDefaultDinner');
        if (useDefaultDinner) {
            useDefaultDinner.addEventListener('change', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.toggleDinnerMenu();
                }
                SummaryManager.updateSummary();
            });
        }

        // 커스텀 음식 추가
        const addCustomBreakfast = DOM.get('addCustomBreakfast');
        if (addCustomBreakfast) {
            addCustomBreakfast.addEventListener('click', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.addCustomBreakfast();
                }
                SummaryManager.updateSummary();
            });
        }

        const addCustomLunch = DOM.get('addCustomLunch');
        if (addCustomLunch) {
            addCustomLunch.addEventListener('click', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.addCustomLunch();
                }
                SummaryManager.updateSummary();
            });
        }

        const addCustomFood = DOM.get('addCustomFood');
        if (addCustomFood) {
            addCustomFood.addEventListener('click', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.addCustomFood();
                }
                SummaryManager.updateSummary();
            });
        }
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

        // 데이터 삭제 버튼
        const deleteBtn = DOM.get('deleteDataBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', DataLoaderManager.deleteSelectedDateData);
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
        const downloadBtn = DOM.get('downloadData');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                if (typeof ExcelManager !== 'undefined') {
                    ExcelManager.downloadData();
                }
            });
        }

        // Supabase 저장
        const saveBtn = DOM.get('saveToSupabase');
        if (saveBtn) {
            saveBtn.addEventListener('click', FitnessApp.saveAllDataToSupabase);
        }

        // 전체 초기화
        const resetBtn = DOM.get('resetAll');
        if (resetBtn) {
            resetBtn.addEventListener('click', FitnessApp.resetAllData);
        }

        // 차트 관련 이벤트 리스너
        DOM.getAll('[data-chart]').forEach(btn => {
            btn.addEventListener('click', function () {
                const chartType = this.dataset.chart;
                if (typeof ChartManager !== 'undefined') {
                    ChartManager.switchChart(chartType);
                }
            });
        });

        const refreshChartsBtn = DOM.get('refreshCharts');
        if (refreshChartsBtn) {
            refreshChartsBtn.addEventListener('click', function () {
                if (typeof ChartManager !== 'undefined') {
                    ChartManager.renderAllCharts();
                }
            });
        }

        // AI 분석 버튼
        const aiBtn = DOM.get('generateAiAnalysisBtn');
        if (aiBtn) {
            aiBtn.addEventListener('click', FitnessApp.requestAiAnalysis);
        }
    }

    // AI 분석 요청 핸들러 (신규)
    static async requestAiAnalysis() {
        const aiBtn = DOM.get('generateAiAnalysisBtn');
        const aiResultDiv = DOM.get('aiAnalysisResult');

        if (!aiBtn || !aiResultDiv) return;

        aiBtn.disabled = true;
        aiBtn.textContent = '🤖 분석 중...';
        DOM.removeClass(aiResultDiv, 'empty-state');
        aiResultDiv.innerHTML = 'AI가 월간/연간 데이터를 분석하고 있습니다. 잠시만 기다려주세요...';

        const analysis = await AIManager.getAnalysis();

        if (analysis) {
            let formattedAnalysis = analysis.replace(/\n/g, '<br>');
            formattedAnalysis = formattedAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedAnalysis = formattedAnalysis.replace(/\*(.*?)\*/g, '<em>$1</em>');
            aiResultDiv.innerHTML = formattedAnalysis;
        } else {
            aiResultDiv.innerHTML = 'AI 분석에 실패했습니다. API 키를 확인하거나 나중에 다시 시도해주세요.';
            DOM.addClass(aiResultDiv, 'empty-state');
        }

        aiBtn.disabled = false;
        aiBtn.textContent = 'AI 분석 생성';
    }

    // 전체 데이터 Supabase에 저장
    static saveAllDataToSupabase() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefaultBreakfast = DOM.get('useDefaultBreakfast')?.checked || false;
        const useDefaultLunch = DOM.get('useDefaultLunch')?.checked || false;
        const useDefaultDinner = DOM.get('useDefaultDinner')?.checked || false;

        if (typeof supabaseManager !== 'undefined') {
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
            );

            // 간단한 새로고침
            setTimeout(() => { window.location.reload(); }, 1000);
        } else {
            console.error('supabaseManager가 정의되지 않았습니다.');
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
        if (typeof FormUtils !== 'undefined') {
            FormUtils.resetWorkoutForm();
        }

        // 유산소 운동 폼 초기화  
        if (typeof FormUtils !== 'undefined') {
            FormUtils.resetCardioForm();
        }

        // 식사 데이터 초기화
        if (typeof MealManager !== 'undefined') {
            MealManager.resetMealData();
        }

        // 커스텀 음식 입력 폼 초기화
        if (typeof FormUtils !== 'undefined') {
            FormUtils.resetCustomFoodForm();
        }

        // 데이터 불러오기 UI 초기화
        if (typeof DataLoaderManager !== 'undefined') {
            DataLoaderManager.resetDataLoader();
        }

        // 화면 렌더링 업데이트
        if (typeof WorkoutManager !== 'undefined') {
            WorkoutManager.renderWorkouts();
        }
        
        if (typeof CardioManager !== 'undefined') {
            CardioManager.renderCardio();
        }
        
        if (typeof MealManager !== 'undefined') {
            MealManager.renderCustomBreakfast();
            MealManager.renderCustomLunch();
            MealManager.renderCustomFoods();
        }
        
        SummaryManager.updateSummary();

        NotificationUtils.alert('모든 데이터가 초기화되었습니다.');

        // 간단한 새로고침
        setTimeout(() => { window.location.reload(); }, 1000);
    }
}

// DOM이 로드되면 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function () {
    FitnessApp.init();
});

// 전역 함수들 (HTML에서 직접 호출되는 함수들)
if (typeof WorkoutManager !== 'undefined') {
    window.WorkoutManager = WorkoutManager;
}
if (typeof CardioManager !== 'undefined') {
    window.CardioManager = CardioManager;
}
if (typeof MealManager !== 'undefined') {
    window.MealManager = MealManager;
}