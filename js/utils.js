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
    cycleRPM: 80,
    currentCalendarYear: new Date().getFullYear(),
    currentCalendarMonth: new Date().getMonth(),
    selectedLunchType: 'galbi',
    // 새로 추가된 사용자 정보
    userAge: 37,
    userHeight: 175,
    userGender: 'male'
};

// DOM 유틸리티 함수들
const DOM = {
    // 요소 선택
    get: (id) => document.getElementById(id),
    getAll: (selector) => document.querySelectorAll(selector),

    // 클래스 조작
    addClass: (element, className) => {
        if (element) element.classList.add(className);
    },
    removeClass: (element, className) => {
        if (element) element.classList.remove(className);
    },
    toggleClass: (element, className) => {
        if (element) element.classList.toggle(className);
    },
    hasClass: (element, className) => {
        return element ? element.classList.contains(className) : false;
    },

    // 스타일 조작
    show: (element) => {
        if (element) element.classList.remove('hidden');
    },
    hide: (element) => {
        if (element) element.classList.add('hidden');
    },

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
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    formatShortDate: (date) => {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
};

// 칼로리 계산 유틸리티
const CalorieCalculator = {
    // 운동 칼로리 계산 - 현실적으로 수정됨
    calculateExercise: (exerciseKey, weightCombination, reps, sets, category = AppState.selectedCategory) => {
        const exercise = EXERCISE_DATABASE[category].exercises[exerciseKey];
        if (!exercise) return 0;

        // 한쪽씩 운동인 경우 회수 2배 적용
        const isSingleSide = exercise.singleSide || false;
        const actualReps = isSingleSide ? reps * 2 : reps;

        // 총 무게 계산
        let totalWeight = 0;
        Object.entries(weightCombination).forEach(([weight, count]) => {
            totalWeight += parseFloat(weight) * count;
        });

        // 맨몸 운동 처리
        const isBodyweight = exercise.bodyweight || false;
        if (isBodyweight) {
            // 맨몸 운동은 단순 계산
            const totalMinutes = (actualReps * sets * 2) / 60; // 1회당 2초로 계산
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
        const totalSeconds = actualReps * sets * repTime; // 휴식 시간 제외
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

    // 사이드스텝 칼로리 계산 (추가된 함수)
    calculateSidestep: (duration) => {
        const hours = duration / 60;
        return Math.round(SIDESTEP_MET * AppState.userWeight * hours);
    },

    // 일반 계단 오르기 칼로리 계산
    calculateRegularStairs: (floors, duration) => {
        // 층수에 따른 기본 MET 값 계산
        const baseMET = 4.0; // 기본 계단 오르기 MET
        const floorBonus = floors * REGULAR_STAIRS_MET_PER_FLOOR; // 층수당 추가 MET
        const finalMET = baseMET + floorBonus;

        // 시간을 hour로 변환
        const hours = duration / 60;

        // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour)
        return Math.round(finalMET * AppState.userWeight * hours);
    },

    // 천국의 계단(StairMaster) 칼로리 계산
    calculateStairMaster: (level, duration) => {
        // 레벨에 따른 MET 값
        const met = STAIRMASTER_MET[level] || 6.0;

        // 시간을 hour로 변환
        const hours = duration / 60;

        // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour)
        return Math.round(met * AppState.userWeight * hours);
    },

    // 미플린 공식 기반 BMR 계산 (새로 추가)
    calculateMifflinBMR: () => {
        const weight = AppState.userWeight;
        const height = AppState.userHeight;
        const age = AppState.userAge;
        const gender = AppState.userGender;

        let bmr;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }

        return Math.round(bmr);
    },

    // TDEE 계산 (새로 추가)
    calculateTDEE: (activityLevel = 1.55) => {
        const bmr = CalorieCalculator.calculateMifflinBMR();
        return Math.round(bmr * activityLevel);
    },

    // 사이클 칼로리 계산 (RPM 포함)
    calculateCycle: (intensity, rpm, duration) => {
        const baseMET = CYCLE_MET[intensity] || 5.5;

        // RPM 보정값 계산 (60 RPM을 기준으로 함)
        const rpmBonus = Math.max(0, (rpm - 60) / 40 * 0.3);
        const finalMET = baseMET + rpmBonus;

        const hours = duration / 60;
        return Math.round(finalMET * AppState.userWeight * hours);
    },

    // 마운트 클라이머 칼로리 계산 (계단 속도 대비 2배 페이스)
    calculateMountainClimber: (duration) => {
        // 계단 오르기 대비 2배 빠른 페이스 = MET 9.0
        const averageMET = 9.0;

        // 시간을 hour로 변환
        const hours = duration / 60;

        // MET 공식: 칼로리 = MET × 체중(kg) × 시간(hour)
        return Math.round(averageMET * AppState.userWeight * hours);
    }
};

// 사용자 정보 관리 유틸리티 (새로 추가)
const UserInfoManager = {
    // 사용자 정보 업데이트
    updateUserInfo: () => {
        AppState.userAge = parseInt(DOM.getValue('userAge')) || 25;
        AppState.userHeight = parseInt(DOM.getValue('userHeight')) || 175;
        AppState.userWeight = parseInt(DOM.getValue('userWeight')) || 87;

        const genderElement = document.querySelector('input[name="userGender"]:checked');
        AppState.userGender = genderElement ? genderElement.value : 'male';
    },

    // BMR/TDEE 표시 업데이트
    updateBMRDisplay: () => {
        UserInfoManager.updateUserInfo();

        const bmr = CalorieCalculator.calculateMifflinBMR();
        const tdee = CalorieCalculator.calculateTDEE();

        DOM.setText('bmrValue', bmr.toLocaleString());
        DOM.setText('tdeeValue', tdee.toLocaleString());
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
        DOM.setValue('cycleRPM', 80);
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

// 알림 유틸리티 (수정된 버전 - 실패 팝업 추가)
const NotificationUtils = {
    // 간단한 토스트 팝업 표시
    showSuccessPopup: (message, duration = 3000) => {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.simple-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 간단한 토스트 생성
        const toast = document.createElement('div');
        toast.className = 'simple-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
            max-width: 90vw;
            word-wrap: break-word;
        `;

        document.body.appendChild(toast);

        // 지정된 시간 후 제거
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.remove();
            }
        }, duration);
    },

    // 실패 팝업 표시 (신규 추가)
    showErrorPopup: (message, duration = 3000) => {
        // 기존 팝업 제거
        NotificationUtils.removeExistingPopups();
        
        // 새 팝업 생성
        const popup = document.createElement('div');
        popup.className = 'error-popup';
        popup.textContent = message;
        document.body.appendChild(popup);

        // 지정된 시간 후 제거
        setTimeout(() => {
            if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, duration);
    },

    // 기존 팝업 제거 (중복 방지)
    removeExistingPopups: () => {
        const existingSuccessPopups = document.querySelectorAll('.success-popup');
        const existingErrorPopups = document.querySelectorAll('.error-popup');
        
        existingSuccessPopups.forEach(popup => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        });
        
        existingErrorPopups.forEach(popup => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        });
    },

    // 확인 대화상자
    confirm: (message) => {
        return window.confirm(message);
    },

    // 알림 대화상자 (deprecated - 팝업 사용 권장)
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

// 한국 시간 기준 날짜 유틸리티
const KoreanDateUtils = {
    // 한국 시간 기준 오늘 날짜 반환
    getKoreanToday: () => {
        const now = new Date();
        const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        return koreanTime.toISOString().split('T')[0];
    }

};