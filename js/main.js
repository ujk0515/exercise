// 메인 애플리케이션 관리 클래스
class FitnessApp {
    // 애플리케이션 초기화
    static async init() {
        // Supabase 환경변수 초기화
        await initializeSupabaseConfig();

        // Supabase 매니저 초기화
        initializeSupabaseManager();

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
        FitnessApp.setupUserInfoEventListeners();
        FitnessApp.setupFabEventListeners();
        FitnessApp.setupBMRAccordionEventListeners();
    }

    static setupBMRAccordionEventListeners() {
        const userInfoToggleButton = DOM.get('userInfoToggleButton');
        const userInfoCollapsibleWrapper = document.querySelector('.user-info-collapsible-wrapper');

        if (userInfoToggleButton && userInfoCollapsibleWrapper) {
            userInfoToggleButton.addEventListener('click', () => {
                userInfoCollapsibleWrapper.classList.toggle('expanded');
            });
        }
    }

    // 플로팅 액션 버튼 관련 이벤트 리스너
    static setupFabEventListeners() {
        const fabContainer = document.querySelector('.fab-container');
        const fabMainBtn = DOM.get('fab-main');
        const fabDownloadBtn = DOM.get('fab-download');
        const fabSaveBtn = DOM.get('fab-save');
        const fabResetBtn = DOM.get('fab-reset');

        if (!fabContainer || !fabMainBtn) return;

        // 메인 버튼 클릭 시 옵션 토글
        fabMainBtn.addEventListener('click', () => {
            fabContainer.classList.toggle('active');
        });

        // 각 옵션 버튼을 기존 기능에 연결
        if (fabDownloadBtn) {
            fabDownloadBtn.addEventListener('click', () => DOM.get('downloadData').click());
        }
        if (fabSaveBtn) {
            fabSaveBtn.addEventListener('click', () => DOM.get('saveToSupabase').click());
        }
        if (fabResetBtn) {
            fabResetBtn.addEventListener('click', () => DOM.get('resetAll').click());
        }

        // 버튼 외 다른 곳 클릭 시 닫기
        document.addEventListener('click', (event) => {
            if (fabContainer.classList.contains('active') && !fabContainer.contains(event.target)) {
                fabContainer.classList.remove('active');
            }
        });

        // 스크롤 시 닫기
        window.addEventListener('scroll', () => {
            if (fabContainer.classList.contains('active')) {
                fabContainer.classList.remove('active');
            }
        }, { passive: true });
    }

    // 사용자 정보 관련 이벤트 리스너
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
                DOM.setValue('userWeight', this.value);
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
        // 카테고리 선택
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
            input.addEventListener('input', function () {
                if (typeof WeightUtils !== 'undefined') {
                    WeightUtils.updateTotalWeight();
                }
            });
        });

        // 운동 선택 변경
        const exerciseSelect = DOM.get('exerciseSelect');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', function () {
                if (typeof WorkoutManager !== 'undefined') {
                    WorkoutManager.updateAddWorkoutButton();
                }
            });
        }

        // 운동 추가
        const addWorkout = DOM.get('addWorkout');
        if (addWorkout) {
            addWorkout.addEventListener('click', function () {
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
                DOM.setValue('userWeightHeader', this.value);
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
            addCardio.addEventListener('click', function () {
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

        // 점심 라디오 버튼 이벤트 리스너
        DOM.getAll('input[name="lunchType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (typeof MealManager !== 'undefined') {
                    MealManager.changeLunchType();
                }
            });
        });

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

    // 유틸리티 관련 이벤트 리스너 (수정된 버전)
    static setupUtilityEventListeners() {
        // 기존 전체 저장/다운로드/초기화 버튼들
        const downloadBtn = DOM.get('downloadData');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function () {
                if (typeof ExcelManager !== 'undefined') {
                    ExcelManager.downloadData();
                }
            });
        }

        const saveBtn = DOM.get('saveToSupabase');
        if (saveBtn) {
            saveBtn.addEventListener('click', FitnessApp.saveAllDataToSupabase);
        }

        const resetBtn = DOM.get('resetAll');
        if (resetBtn) {
            resetBtn.addEventListener('click', FitnessApp.resetAllData);
        }

        // === 개별 저장 버튼들 (수정된 버전) ===
        
        // 웨이트 운동 저장
        const saveWorkoutsBtn = DOM.get('saveWorkoutsBtn');
        if (saveWorkoutsBtn) {
            console.log('웨이트 저장 버튼 이벤트 리스너 등록 완료');
            saveWorkoutsBtn.addEventListener('click', async function () {
                console.log('웨이트 저장 버튼 클릭됨!');
                
                if (AppState.workouts.length === 0) {
                    NotificationUtils.showErrorPopup('❌ 저장할 웨이트 운동이 없습니다.');
                    return;
                }

                const originalText = this.textContent;
                this.textContent = '💾 저장 중...';
                this.disabled = true;

                try {
                    await supabaseManager.saveWorkoutsOnly();
                    NotificationUtils.showSuccessPopup('✅ 웨이트 운동이 저장되었습니다!');
                    setTimeout(() => { window.location.reload(); }, 1500);
                } catch (error) {
                    console.error('웨이트 저장 중 오류:', error);
                    NotificationUtils.showErrorPopup('❌ 웨이트 저장 중 오류가 발생했습니다.');
                } finally {
                    this.textContent = originalText;
                    this.disabled = false;
                }
            });
        }

        // 유산소 운동 저장
        const saveCardioBtn = DOM.get('saveCardioBtn');
        if (saveCardioBtn) {
            console.log('유산소 저장 버튼 이벤트 리스너 등록 완료');
            saveCardioBtn.addEventListener('click', async function () {
                console.log('유산소 저장 버튼 클릭됨!');
                
                if (AppState.cardioWorkouts.length === 0) {
                    NotificationUtils.showErrorPopup('❌ 저장할 유산소 운동이 없습니다.');
                    return;
                }

                const originalText = this.textContent;
                this.textContent = '💾 저장 중...';
                this.disabled = true;

                try {
                    await supabaseManager.saveCardioOnly();
                    NotificationUtils.showSuccessPopup('✅ 유산소 운동이 저장되었습니다!');
                    setTimeout(() => { window.location.reload(); }, 1500);
                } catch (error) {
                    console.error('유산소 저장 중 오류:', error);
                    NotificationUtils.showErrorPopup('❌ 유산소 저장 중 오류가 발생했습니다.');
                } finally {
                    this.textContent = originalText;
                    this.disabled = false;
                }
            });
        }

        // 아침 식사 저장
        const saveBreakfastBtn = DOM.get('saveBreakfastBtn');
        if (saveBreakfastBtn) {
            console.log('아침 저장 버튼 이벤트 리스너 등록 완료');
            saveBreakfastBtn.addEventListener('click', async function () {
                console.log('아침 저장 버튼 클릭됨!');
                
                const originalText = this.textContent;
                this.textContent = '💾 저장 중...';
                this.disabled = true;

                try {
                    await supabaseManager.saveBreakfastOnly();
                    NotificationUtils.showSuccessPopup('✅ 아침 식사가 저장되었습니다!');
                    setTimeout(() => { window.location.reload(); }, 1500);
                } catch (error) {
                    console.error('아침 저장 중 오류:', error);
                    NotificationUtils.showErrorPopup('❌ 아침 저장 중 오류가 발생했습니다.');
                } finally {
                    this.textContent = originalText;
                    this.disabled = false;
                }
            });
        }

        // 점심 식사 저장
        const saveLunchBtn = DOM.get('saveLunchBtn');
        if (saveLunchBtn) {
            console.log('점심 저장 버튼 이벤트 리스너 등록 완료');
            saveLunchBtn.addEventListener('click', async function () {
                console.log('점심 저장 버튼 클릭됨!');
                
                const originalText = this.textContent;
                this.textContent = '💾 저장 중...';
                this.disabled = true;

                try {
                    await supabaseManager.saveLunchOnly();
                    NotificationUtils.showSuccessPopup('✅ 점심 식사가 저장되었습니다!');
                    setTimeout(() => { window.location.reload(); }, 1500);
                } catch (error) {
                    console.error('점심 저장 중 오류:', error);
                    NotificationUtils.showErrorPopup('❌ 점심 저장 중 오류가 발생했습니다.');
                } finally {
                    this.textContent = originalText;
                    this.disabled = false;
                }
            });
        }

        // 저녁 식사 저장
        const saveDinnerBtn = DOM.get('saveDinnerBtn');
        if (saveDinnerBtn) {
            console.log('저녁 저장 버튼 이벤트 리스너 등록 완료');
            saveDinnerBtn.addEventListener('click', async function () {
                console.log('저녁 저장 버튼 클릭됨!');
                
                const originalText = this.textContent;
                this.textContent = '💾 저장 중...';
                this.disabled = true;

                try {
                    await supabaseManager.saveDinnerOnly();
                    NotificationUtils.showSuccessPopup('✅ 저녁 식사가 저장되었습니다!');
                    setTimeout(() => { window.location.reload(); }, 1500);
                } catch (error) {
                    console.error('저녁 저장 중 오류:', error);
                    NotificationUtils.showErrorPopup('❌ 저녁 저장 중 오류가 발생했습니다.');
                } finally {
                    this.textContent = originalText;
                    this.disabled = false;
                }
            });
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
    }

    // 전체 데이터 Supabase에 저장
    static async saveAllDataToSupabase() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefaultBreakfast = DOM.get('useDefaultBreakfast')?.checked || false;
        const useDefaultLunch = DOM.get('useDefaultLunch')?.checked || false;
        const useDefaultDinner = DOM.get('useDefaultDinner')?.checked || false;

        if (typeof supabaseManager !== 'undefined') {
            await supabaseManager.saveAllData(
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

            // 팝업이 표시될 시간을 주고 새로고침
            setTimeout(() => { window.location.reload(); }, 2000);
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
document.addEventListener('DOMContentLoaded', async function () {
    await FitnessApp.init();
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