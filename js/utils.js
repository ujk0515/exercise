// 전역 상태 관리
const AppState = {
    workouts: [],
    cardioWorkouts: [],
    customBreakfastItems: [],
    customLunchItems: [],
    customDinnerItems: [],
    monthlyData: {
        workouts: [],
        cardio: [],
        meals: []
    },
    selectedDateForLoad: null,
    selectedCategory: 'back',
    userWeight: 87,
    selectedCardioType: 'treadmill',
    currentCalendarYear: new Date().getFullYear(),
    currentCalendarMonth: new Date().getMonth(),
};

// DOM 유틸리티 함수들
const DOM = {
    // 요소 선택
    get: (id) => document.getElementById(id),
    getAll: (selector) => document.querySelectorAll(selector),
    
    // 클래스 조작
    addClass: (element, className) => element.classList.add(className),
    removeClass: (element, className) => element.classList.remove(className),
    toggleClass: (element, className) => element.classList.toggle(className),
    hasClass: (element, className) => element.classList.contains(className),
    
    // 스타일 조작
    show: (element) => element.classList.remove('hidden'),
    hide: (element) => element.classList.add('hidden'),
    
    // 값 설정/가져오기
    setValue: (id, value) => {
        const element = DOM.get(id);
        if (element) element.value = value;
    },
    getValue: (id) => {
        const element = DOM.get(id);
        return element ? element.value : '';
    },
    setText: (id, text) => {
        const element = DOM.get(id);
        if (element) element.textContent = text;
    },
    setHTML: (id, html) => {
        const element = DOM.get(id);
        if (element) element.innerHTML = html;
    },
    getText: (id) => {
        const element = DOM.get(id);
        return element ? element.textContent : '';
    }
};

// 날짜 유틸리티
const DateUtils = {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    today: () => new Date().toISOString().split('T')[0],
    
    // Date 객체를 YYYY-MM-DD 형식으로 변환
    formatDate: (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 월의 첫날과 마지막날 반환
    getMonthRange: (year, month) => {
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
        return { startDate, endDate };
    },
    
    // 월 이름 배열
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
};

// 사이클 MET 값 (강도별)
const CYCLE_MET = {
    1: 3.5, 2: 4.0, 3: 4.5, 4: 5.0, 5: 5.5,
    6: 6.0, 7: 7.0, 8: 8.0, 9: 9.0, 10: 10.0
};

// 칼로리 계산 유틸리티
const CalorieCalculator = {
    // 운동 칼로리 계산 - 현실적으로 수정됨
    calculateExercise: (exerciseKey, weightCombination, reps, sets, category = AppState.selectedCategory) => {
        const exercise = EXERCISE_DATABASE[category].exercises[exerciseKey];
        if (!exercise) return 0;

        // 총 무게 계산
        let totalWeight = 0;
        Object.entries(weightCombination).forEach(([weight, count]) => {
            totalWeight += parseFloat(weight) * count;
        });
        
        // 맨몸 운동 처리
        const isBodyweight = exercise.bodyweight || false;
        if (isBodyweight) {
            // 맨몸 운동은 단순 계산
            const totalMinutes = (reps * sets * 2) / 60; // 1회당 2초로 계산
            const hours = totalMinutes / 60;
            return Math.round(exercise.met * AppState.userWeight * hours);
        }

        if (totalWeight === 0) return 0;

        // 무게 강도 계산 (체중 대비) - 더 현실적으로 조정
        let intensityBonus = 0;
        const weightRatio = totalWeight / AppState.userWeight;
        if (weightRatio > 0.7) intensityBonus = WEIGHT_INTENSITY_BONUS.veryHeavy;
        else if (weightRatio > 0.5) intensityBonus = WEIGHT_INTENSITY_BONUS.heavy;
        else if (weightRatio > 0.3) intensityBonus = WEIGHT_INTENSITY_BONUS.moderate;
        else intensityBonus = WEIGHT_INTENSITY_BONUS.light;

        // 최종 MET 값
        const finalMET = exercise.met + intensityBonus;

        // 운동 시간 계산 - 현실적으로 수정 (휴식 시간 제외)
        const repTime = 2; // 1회당 2초로 감소 (기존 3초)
        const totalSeconds = reps * sets * repTime; // 휴식 시간 제외
        const hours = totalSeconds / 3600;

        // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour)
        return Math.round(finalMET * AppState.userWeight * hours);
    },

    // 런닝머신 칼로리 계산
    calculateTreadmill: (incline, speed, duration) => {
        // 속도에 따른 기본 MET 값 찾기
        let baseMET = 2.0;
        for (let speedKey in TREADMILL_MET) {
            if (speed >= parseFloat(speedKey)) {
                baseMET = TREADMILL_MET[speedKey];
            }
        }

        // 경사 보정
        const inclineBonus = INCLINE_BONUS[incline] || 0;
        const finalMET = baseMET + inclineBonus;

        // 시간을 hour로 변환
        const hours = duration / 60;

        // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour)
        return Math.round(finalMET * AppState.userWeight * hours);
    },

    // 기초대사량 계산
    calculateBMR: () => Math.round(AppState.userWeight * 24),

    // 사이클 칼로리 계산
    calculateCycle: (intensity, duration) => {
        const baseMET = CYCLE_MET[intensity] || 5.5;
        const hours = duration / 60;
        return Math.round(baseMET * AppState.userWeight * hours);
    }
};

// 폼 유틸리티
const FormUtils = {
    // 웨이트 폼 초기화 (운동 선택은 유지)
    resetWorkoutForm: () => {
        // DOM.setValue('exerciseSelect', '');  // 이 줄을 주석처리하여 운동 선택 유지
        DOM.setValue('reps', 10);
        DOM.setValue('sets', 3);
        DOM.getAll('.weight-input').forEach(input => input.value = 0);
        WeightUtils.updateTotalWeight();
        if (window.WorkoutManager) {
            WorkoutManager.updateAddWorkoutButton();
        }
    },

    // 유산소 폼 초기화
    resetCardioForm: () => {
        DOM.setValue('incline', 1);
        DOM.setValue('speed', 6.0);
        DOM.setValue('duration', 30);
        DOM.setValue('cycleIntensity', 5);
        DOM.setValue('cycleDuration', 30);
    },

    // 커스텀 음식 폼 초기화
    resetCustomFoodForm: () => {
        DOM.setValue('newFoodName', '');
        DOM.setValue('newFoodCalories', '');
    }
};

// 무게 관련 유틸리티
const WeightUtils = {
    // 총 무게 계산
    calculateTotalWeight: () => {
        let total = 0;
        DOM.getAll('.weight-input').forEach(input => {
            const weight = parseFloat(input.dataset.weight);
            const count = parseInt(input.value) || 0;
            total += weight * count;
        });
        return total;
    },

    // 총 무게 업데이트
    updateTotalWeight: () => {
        const total = WeightUtils.calculateTotalWeight();
        DOM.setText('totalWeight', total);
        if (window.WorkoutManager) {
            WorkoutManager.updateAddWorkoutButton();
        }
        // 실시간 요약 업데이트
        if (window.SummaryManager) {
            SummaryManager.updateSummary();
        }
    },

    // 무게 조합 수집
    getWeightCombination: () => {
        const combination = {};
        DOM.getAll('.weight-input').forEach(input => {
            combination[input.dataset.weight] = parseInt(input.value) || 0;
        });
        return combination;
    }
};

// 렌더링 유틸리티
const RenderUtils = {
    // 빈 상태 메시지 렌더링
    renderEmptyState: (container, message) => {
        container.innerHTML = `<div class="empty-state">${message}</div>`;
    },

    // 아이템 삭제 버튼 생성
    createDeleteButton: (id, onClickFunction) => {
        return `<button class="btn btn-danger" onclick="${onClickFunction}(${id})">🗑️</button>`;
    }
};

// 알림 유틸리티
const NotificationUtils = {
    // 성공 팝업 표시
    showSuccessPopup: (message, duration = 3000) => {
        const popup = DOM.get('successPopup');
        popup.textContent = message;
        DOM.show(popup);
        
        setTimeout(() => {
            DOM.hide(popup);
        }, duration);
    },

    // 확인 대화상자
    confirm: (message) => {
        return window.confirm(message);
    },

    // 알림 대화상자
    alert: (message) => {
        window.alert(message);
    }
};

// 배열 유틸리티
const ArrayUtils = {
    // ID로 아이템 제거
    removeById: (array, id) => {
        return array.filter(item => item.id !== id);
    },

    // 배열의 총합 계산
    sum: (array, property) => {
        return array.reduce((sum, item) => sum + (item[property] || 0), 0);
    }
};
