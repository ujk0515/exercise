// 웨이트 운동 관리 클래스
class WorkoutManager {
    // 운동 목록 로드
    static loadExercises(category) {
        const select = DOM.get('exerciseSelect');
        select.innerHTML = '<option value="">운동을 선택하세요</option>';
        
        Object.entries(EXERCISE_DATABASE[category].exercises).forEach(([key, exercise]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = exercise.name;
            select.appendChild(option);
        });
    }

    // 운동 추가 버튼 상태 업데이트
    static updateAddWorkoutButton() {
        const exerciseSelected = DOM.getValue('exerciseSelect');
        const totalWeight = parseFloat(DOM.get('totalWeight').textContent);
        const btn = DOM.get('addWorkout');
        
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
        
        const weightCombination = WeightUtils.getWeightCombination();
        const totalWeight = WeightUtils.calculateTotalWeight();
        const calories = CalorieCalculator.calculateExercise(exerciseKey, weightCombination, reps, sets);
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
        FormUtils.resetWorkoutForm();
        SummaryManager.updateSummary();
    }

    // 웨이트 운동 기록 렌더링
    static renderWorkouts() {
        const container = DOM.get('workoutRecords');
        
        if (AppState.workouts.length === 0) {
            RenderUtils.renderEmptyState(container, '아직 웨이트 운동 기록이 없습니다');
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
                    ${RenderUtils.createDeleteButton(workout.id, 'WorkoutManager.removeWorkout')}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // 웨이트 운동 삭제
    static removeWorkout(id) {
        AppState.workouts = ArrayUtils.removeById(AppState.workouts, id);
        WorkoutManager.renderWorkouts();
        SummaryManager.updateSummary();
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
    // 유산소 운동 추가
    static addCardio() {
        const incline = parseInt(DOM.getValue('incline'));
        const speed = parseFloat(DOM.getValue('speed'));
        const duration = parseInt(DOM.getValue('duration'));
        const calories = CalorieCalculator.calculateTreadmill(incline, speed, duration);
        
        const cardio = {
            id: Date.now(),
            type: '런닝머신',
            incline,
            speed,
            duration,
            calories
        };
        
        AppState.cardioWorkouts.push(cardio);
        CardioManager.renderCardio();
        
        // 시간만 리셋
        DOM.setValue('duration', 30);  // DEFAULT_VALUES 대신 직접 값
        SummaryManager.updateSummary();
    }

    // 유산소 운동 기록 렌더링
    static renderCardio() {
        const container = DOM.get('cardioRecords');
        
        if (AppState.cardioWorkouts.length === 0) {
            RenderUtils.renderEmptyState(container, '아직 유산소 운동 기록이 없습니다');
            return;
        }
        
        container.innerHTML = '';
        
        AppState.cardioWorkouts.forEach(cardio => {
            const div = document.createElement('div');
            div.className = 'cardio-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight: 600;">${cardio.type}</div>
                    <div class="workout-details">각도 ${cardio.incline}도, 속도 ${cardio.speed}km/h, ${cardio.duration}분</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="calories">${cardio.calories}kcal</span>
                    ${RenderUtils.createDeleteButton(cardio.id, 'CardioManager.removeCardio')}
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
        const basalMetabolicRate = CalorieCalculator.calculateBMR();
        const totalDailyCalorieBurn = basalMetabolicRate + totalWorkoutCalories;
        
        // 식사 칼로리 계산
        const breakfastCal = DOM.get('useDefaultBreakfast').checked ? 
            MEAL_CALORIES.breakfast : 
            ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
        const lunchCal = DOM.get('useDefaultLunch').checked ? 
            MEAL_CALORIES.lunch : 
            ArrayUtils.sum(AppState.customLunchItems, 'calories');
        const dinnerCal = DOM.get('useDefaultDinner').checked ? 
            MEAL_CALORIES.defaultDinner : 
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');
        const totalFoodCalories = breakfastCal + lunchCal + dinnerCal;
        
        // 실제 칼로리 수지 (기초대사량 포함)
        const balance = totalFoodCalories - totalDailyCalorieBurn;
        
        // UI 업데이트
        DOM.setText('totalWorkoutCal', totalDailyCalorieBurn);
        DOM.setText('totalFoodCal', totalFoodCalories);
        DOM.setText('calorieBalance', (balance > 0 ? '+' : '') + balance);
        DOM.setText('balanceStatus', balance > 0 ? '🔺 잉여' : '🔻 적자');
        
        // 칼로리 수지 색상 변경
        const balanceElement = DOM.get('calorieBalance');
        balanceElement.style.color = balance > 0 ? '#fca5a5' : '#86efac';
    }
}