// 웨이트 운동 관리 클래스
class WorkoutManager {
    // 운동 목록 로드
    static loadExercises(category) {
        const select = DOM.get('exerciseSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">운동을 선택하세요</option>';

        if (EXERCISE_DATABASE[category] && EXERCISE_DATABASE[category].exercises) {
            Object.entries(EXERCISE_DATABASE[category].exercises).forEach(([key, exercise]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = exercise.name;
                select.appendChild(option);
            });
        }
    }

    // 운동 추가 버튼 상태 업데이트
    static updateAddWorkoutButton() {
        const exerciseSelected = DOM.getValue('exerciseSelect');
        const totalWeightElement = DOM.get('totalWeight');
        const btn = DOM.get('addWorkout');
        
        if (!totalWeightElement || !btn) return;
        
        const totalWeight = parseFloat(totalWeightElement.textContent);

        // 맨몸 운동인지 확인
        const exercise = EXERCISE_DATABASE[AppState.selectedCategory]?.exercises[exerciseSelected];
        const isBodyweight = exercise?.bodyweight || false;

        btn.disabled = !exerciseSelected || (!isBodyweight && totalWeight === 0);
    }

    // 웨이트 운동 추가
    static addWorkout() {
        const exerciseKey = DOM.getValue('exerciseSelect');
        const reps = parseInt(DOM.getValue('reps'));
        const sets = parseInt(DOM.getValue('sets'));

        if (!exerciseKey || !reps || !sets) return;

        const weightCombination = WeightUtils.getWeightCombination();
        const totalWeight = WeightUtils.calculateTotalWeight();
        const calories = CalorieCalculator.calculateExercise(exerciseKey, weightCombination, reps, sets);
        
        if (!EXERCISE_DATABASE[AppState.selectedCategory]?.exercises[exerciseKey]) return;
        
        const exerciseName = EXERCISE_DATABASE[AppState.selectedCategory].exercises[exerciseKey].name;

        const workout = {
            id: Date.now(),
            category: EXERCISE_DATABASE[AppState.selectedCategory].name,
            exercise: exerciseName,
            totalWeight,
            reps,
            sets,
            calories
        };

        AppState.workouts.push(workout);
        WorkoutManager.renderWorkouts();

        // 폼 리셋
        if (typeof FormUtils !== 'undefined') {
            FormUtils.resetWorkoutForm();
        }
        SummaryManager.updateSummary();
    }

    // 웨이트 운동 기록 렌더링
    static renderWorkouts() {
        const container = DOM.get('workoutRecords');
        if (!container) return;

        if (AppState.workouts.length === 0) {
            if (typeof RenderUtils !== 'undefined') {
                RenderUtils.renderEmptyState(container, '아직 웨이트 운동 기록이 없습니다');
            }
            return;
        }

        container.innerHTML = '';

        AppState.workouts.forEach(workout => {
            const div = document.createElement('div');
            div.className = 'workout-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${workout.exercise}</div>
                    <div class="workout-details">${workout.totalWeight}kg × ${workout.reps}회 × ${workout.sets}세트</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="calories">${workout.calories}kcal</span>
                    ${typeof RenderUtils !== 'undefined' ? 
                        RenderUtils.createDeleteButton(workout.id, 'WorkoutManager.removeWorkout') : 
                        `<button class="btn btn-danger" onclick="WorkoutManager.removeWorkout(${workout.id})">🗑️</button>`}
                </div>
            `;
            container.appendChild(div);
        });

        // 운동 총합 업데이트
        if (typeof WorkoutSummaryManager !== 'undefined') {
            WorkoutSummaryManager.updateWorkoutSummary();
        }
    }

    // 웨이트 운동 삭제
    static removeWorkout(id) {
        AppState.workouts = ArrayUtils.removeById(AppState.workouts, id);
        WorkoutManager.renderWorkouts();
        SummaryManager.updateSummary();
        if (typeof WorkoutSummaryManager !== 'undefined') {
            WorkoutSummaryManager.updateWorkoutSummary();
        }
    }

    // 카테고리 변경 처리
    static changeCategory(category) {
        // 모든 카테고리 버튼에서 active 클래스 제거
        DOM.getAll('.category-btn').forEach(btn => DOM.removeClass(btn, 'active'));

        // 선택된 카테고리 버튼에 active 클래스 추가
        const selectedBtn = document.querySelector(`[data-category="${category}"]`);
        if (selectedBtn) DOM.addClass(selectedBtn, 'active');

        AppState.selectedCategory = category;
        WorkoutManager.loadExercises(category);
        DOM.setValue('exerciseSelect', '');
        WorkoutManager.updateAddWorkoutButton();
    }
}

// 유산소 운동 관리 클래스
class CardioManager {
    // 유산소 운동 추가 (사이드스텝 로직 추가)
    static addCardio() {
        let cardio;

        if (AppState.selectedCardioType === 'treadmill') {
            const incline = parseInt(DOM.getValue('incline'));
            const speed = parseFloat(DOM.getValue('speed'));
            const duration = parseInt(DOM.getValue('duration'));
            
            if (!incline || !speed || !duration) return;
            
            const calories = CalorieCalculator.calculateTreadmill(incline, speed, duration);

            cardio = {
                id: Date.now(),
                type: '런닝머신',
                incline, speed, duration, calories
            };
            DOM.setValue('duration', 30);
        } else if (AppState.selectedCardioType === 'cycle') {
            const intensity = parseInt(DOM.getValue('cycleIntensity'));
            const rpm = parseInt(DOM.getValue('cycleRPM'));
            const duration = parseInt(DOM.getValue('cycleDuration'));
            
            if (!intensity || !rpm || !duration) return;
            
            const calories = CalorieCalculator.calculateCycle(intensity, rpm, duration);
        
            cardio = {
                id: Date.now(),
                type: '사이클',
                intensity, rpm, duration, calories
            };
            DOM.setValue('cycleDuration', 30);
            DOM.setValue('cycleRPM', 80);
        } else if (AppState.selectedCardioType === 'sidestep') {
            const duration = parseInt(DOM.getValue('sidestepDuration'));
            
            if (!duration) return;
            
            const calories = CalorieCalculator.calculateSidestep(duration);
            
            cardio = {
                id: Date.now(),
                type: '스텝박스 사이드스텝',
                duration,
                calories
            };
            DOM.setValue('sidestepDuration', 30);
        }

        AppState.cardioWorkouts.push(cardio);
        CardioManager.renderCardio();
        SummaryManager.updateSummary();
        if (typeof WorkoutSummaryManager !== 'undefined') {
            WorkoutSummaryManager.updateWorkoutSummary();
        }
    }

    // 유산소 운동 종류 변경 (사이드스텝 포함)
    static changeCardioType(type) {
        DOM.getAll('[data-cardio-type]').forEach(btn => DOM.removeClass(btn, 'active'));
        const selectedBtn = document.querySelector(`[data-cardio-type="${type}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        AppState.selectedCardioType = type;

        const treadmillForm = DOM.get('treadmillForm');
        const cycleForm = DOM.get('cycleForm');
        const sidestepForm = DOM.get('sidestepForm');

        if (type === 'treadmill') {
            if (treadmillForm) DOM.show(treadmillForm);
            if (cycleForm) DOM.hide(cycleForm);
            if (sidestepForm) DOM.hide(sidestepForm);
        } else if (type === 'cycle') {
            if (treadmillForm) DOM.hide(treadmillForm);
            if (cycleForm) DOM.show(cycleForm);
            if (sidestepForm) DOM.hide(sidestepForm);
        } else if (type === 'sidestep') {
            if (treadmillForm) DOM.hide(treadmillForm);
            if (cycleForm) DOM.hide(cycleForm);
            if (sidestepForm) DOM.show(sidestepForm);
        }
    }

    // 유산소 운동 기록 렌더링 (사이드스텝 표시 포함)
    static renderCardio() {
        const container = DOM.get('cardioRecords');
        if (!container) return;

        if (AppState.cardioWorkouts.length === 0) {
            if (typeof RenderUtils !== 'undefined') {
                RenderUtils.renderEmptyState(container, '아직 유산소 운동 기록이 없습니다');
            }
            return;
        }

        container.innerHTML = '';

        AppState.cardioWorkouts.forEach(cardio => {
            const div = document.createElement('div');
            div.className = 'cardio-item';
            
            let detailsText = '';
            if (cardio.type === '런닝머신') {
                detailsText = `각도 ${cardio.incline}도, 속도 ${cardio.speed}km/h, ${cardio.duration}분`;
            } else if (cardio.type === '사이클') {
                detailsText = `강도 ${cardio.intensity}단계, ${cardio.rpm || 80}RPM, ${cardio.duration}분`;
            } else if (cardio.type === '스텝박스 사이드스텝') {
                detailsText = `${cardio.duration}분`;
            }
            
            div.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${cardio.type}</div>
                    <div class="workout-details">${detailsText}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="calories">${cardio.calories}kcal</span>
                    ${typeof RenderUtils !== 'undefined' ? 
                        RenderUtils.createDeleteButton(cardio.id, 'CardioManager.removeCardio') : 
                        `<button class="btn btn-danger" onclick="CardioManager.removeCardio(${cardio.id})">🗑️</button>`}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // 유산소 운동 삭제
    static removeCardio(id) {
        AppState.cardioWorkouts = ArrayUtils.removeById(AppState.cardioWorkouts, id);
        CardioManager.renderCardio();
        SummaryManager.updateSummary();
        if (typeof WorkoutSummaryManager !== 'undefined') {
            WorkoutSummaryManager.updateWorkoutSummary();
        }
    }
}

// 일일 요약 관리 클래스
class SummaryManager {
    // 요약 정보 업데이트
    static updateSummary() {
        // 운동 칼로리 계산
        const workoutCalories = ArrayUtils.sum(AppState.workouts, 'calories');
        const cardioCalories = ArrayUtils.sum(AppState.cardioWorkouts, 'calories');
        const totalWorkoutCalories = workoutCalories + cardioCalories;

        // 기초대사량 계산
        const basalMetabolicRate = CalorieCalculator.calculateTDEE();
        const totalDailyCalorieBurn = basalMetabolicRate + totalWorkoutCalories;

        // 식사 칼로리 계산 - 안전한 접근
        const useDefaultBreakfast = DOM.get('useDefaultBreakfast');
        const useDefaultLunch = DOM.get('useDefaultLunch');
        const useDefaultDinner = DOM.get('useDefaultDinner');

        const breakfastCal = useDefaultBreakfast?.checked ?
            MEAL_CALORIES.breakfast :
            ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
        
        const lunchCal = useDefaultLunch?.checked ?
            MEAL_CALORIES.lunch[AppState.selectedLunchType] :
            ArrayUtils.sum(AppState.customLunchItems, 'calories');
        
        const dinnerCal = useDefaultDinner?.checked ?
            MEAL_CALORIES.defaultDinner :
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');
        
        const totalFoodCalories = breakfastCal + lunchCal + dinnerCal;

        // 실제 칼로리 수지 (기초대사량 포함)
        const balance = totalFoodCalories - totalDailyCalorieBurn;

        // UI 업데이트 - 안전한 요소 접근
        const totalWorkoutCalElement = DOM.get('totalWorkoutCal');
        if (totalWorkoutCalElement) {
            DOM.setText('totalWorkoutCal', totalDailyCalorieBurn);
        }
        
        const totalFoodCalElement = DOM.get('totalFoodCal');
        if (totalFoodCalElement) {
            DOM.setText('totalFoodCal', totalFoodCalories);
        }
        
        const calorieBalanceElement = DOM.get('calorieBalance');
        if (calorieBalanceElement) {
            DOM.setText('calorieBalance', (balance > 0 ? '+' : '') + balance);
            // 안전한 스타일 접근
            calorieBalanceElement.style.color = balance > 0 ? '#fca5a5' : '#86efac';
        }
        
        const balanceStatusElement = DOM.get('balanceStatus');
        if (balanceStatusElement) {
            DOM.setText('balanceStatus', balance > 0 ? '🔺 잉여' : '🔻 적자');
        }
    }
}

// 운동 총합 관리 클래스
class WorkoutSummaryManager {
    // 운동 총합 업데이트
    static updateWorkoutSummary() {
        // 웨이트 운동 총 세트 계산
        let totalSets = 0;
        AppState.workouts.forEach(workout => {
            totalSets += workout.sets;
        });

        // 총 칼로리 계산 (웨이트 + 유산소)
        let totalCalories = 0;

        // 웨이트 운동 칼로리
        AppState.workouts.forEach(workout => {
            totalCalories += workout.calories;
        });

        // 유산소 운동 칼로리
        AppState.cardioWorkouts.forEach(cardio => {
            totalCalories += cardio.calories;
        });

        // UI 업데이트 - 안전한 요소 접근
        const totalWorkoutSetsElement = DOM.get('totalWorkoutSets');
        if (totalWorkoutSetsElement) {
            DOM.setText('totalWorkoutSets', totalSets);
        }
        
        const totalWorkoutCaloriesElement = DOM.get('totalWorkoutCalories');
        if (totalWorkoutCaloriesElement) {
            DOM.setText('totalWorkoutCalories', Math.round(totalCalories));
        }
    }
}