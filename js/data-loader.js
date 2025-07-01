// 데이터 불러오기 관리 클래스
class DataLoaderManager {
    // 캘린더 생성
    static generateCalendar() {
        const year = AppState.currentCalendarYear;
        const month = AppState.currentCalendarMonth;
        
        // 캘린더 헤더 업데이트
        DOM.setText('calendarHeader', `📅 ${DateUtils.monthNames[month]} 운동 기록 캘린더`);
        
        // 캘린더 그리드 생성
        const calendarGrid = DOM.get('calendarGrid');
        calendarGrid.innerHTML = '';
        
        // 요일 헤더
        const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
        dayHeaders.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day header';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });
        
        // 월의 첫 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // 날짜 채우기
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) { // 6주 = 42일
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (currentDate.getMonth() !== month) {
                dayElement.className += ' disabled';
            } else {
                dayElement.className += ' disabled'; // 초기에는 모든 날짜 비활성화
                dayElement.dataset.date = DateUtils.formatDate(currentDate);
                dayElement.addEventListener('click', function() {
                    if (!this.classList.contains('disabled')) {
                        DataLoaderManager.selectCalendarDate(this.dataset.date);
                    }
                });
            }
            
            dayElement.textContent = currentDate.getDate();
            calendarGrid.appendChild(dayElement);
            
            currentDate.setDate(currentDate.getDate() + 1);
            
            if (currentDate.getMonth() > month + 1) break;
        }
    }

    // 월별 데이터 불러오기
static async loadMonthlyDataFromSupabase() {
    const loadBtn = DOM.get('loadMonthBtn');
    const successPopup = DOM.get('successPopup');
    
    try {
        loadBtn.textContent = '📥 데이터 불러오는 중...';
        loadBtn.style.backgroundColor = '#9ca3af';
        
        const year = AppState.currentCalendarYear;
        const month = AppState.currentCalendarMonth + 1;
        
        const result = await supabaseManager.loadMonthlyData(year, month);
        
        if (!result.success) {
            throw result.error;
        }
        
        // 데이터 저장
        AppState.monthlyData = result.data;
        
        // 월간 통계 계산 및 표시
        DataLoaderManager.calculateAndShowMonthlySummary(result.data, year, month);
        
        // 성공 팝업 표시
        const totalDays = new Set([
            ...AppState.monthlyData.workouts.map(w => w.workout_date),
            ...AppState.monthlyData.cardio.map(c => c.workout_date),
            ...AppState.monthlyData.meals.map(m => m.meal_date)
        ]).size;
        
        const message = `✅ ${year}년 ${DateUtils.monthNames[month-1]} 데이터를 모두 불러왔습니다! (총 ${totalDays}일의 기록)`;
        NotificationUtils.showSuccessPopup(message);
        
        // 캘린더 업데이트
        DataLoaderManager.updateCalendarWithData();
        
    } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        NotificationUtils.alert('데이터 불러오기 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
        loadBtn.textContent = '📥 현재 월 데이터 불러오기';
        loadBtn.style.backgroundColor = '#10b981';
    }
}

    // 월간 통계 계산 및 표시
    static calculateAndShowMonthlySummary(data, year, month) {
        const { workouts, cardio, meals } = data;
        
        // 운동일 계산
        const workoutDates = new Set([
            ...workouts.map(w => w.workout_date),
            ...cardio.map(c => c.workout_date)
        ]);
        const totalWorkoutDays = workoutDates.size;
        
        // 일별 데이터 그룹화
        const dailyData = {};
        
        // 운동 칼로리 집계
        [...workouts, ...cardio].forEach(item => {
            const date = item.workout_date;
            if (!dailyData[date]) dailyData[date] = { burnCalories: 0, foodCalories: 0 };
            dailyData[date].burnCalories += item.calories || 0;
        });
        
        // 식사 칼로리 집계
        meals.forEach(meal => {
            const date = meal.meal_date;
            if (!dailyData[date]) dailyData[date] = { burnCalories: 0, foodCalories: 0 };
            dailyData[date].foodCalories += meal.total_calories || 0;
        });
        
        // 평균 계산
        const dailyValues = Object.values(dailyData);
        const avgBurnCalories = dailyValues.length > 0 ? 
            Math.round(dailyValues.reduce((sum, day) => sum + (day.burnCalories + (87 * 24)), 0) / dailyValues.length) : 0;
        const avgFoodCalories = dailyValues.length > 0 ? 
            Math.round(dailyValues.reduce((sum, day) => sum + day.foodCalories, 0) / dailyValues.length) : 0;
        const avgCalorieBalance = avgFoodCalories - avgBurnCalories;
        
        // UI 업데이트
        DOM.setText('summaryMonth', `${year}년 ${month}월`);
        DOM.setText('totalWorkoutDays', totalWorkoutDays);
        DOM.setText('avgBurnCalories', avgBurnCalories);
        DOM.setText('avgFoodCalories', avgFoodCalories);
        DOM.setText('avgCalorieBalance', (avgCalorieBalance > 0 ? '+' : '') + avgCalorieBalance);
        
        // 월간 요약 표시
        DOM.show(DOM.get('monthlySummary'));
    }

    // 캘린더에 데이터 반영
    static updateCalendarWithData() {
        const dataDateSet = new Set([
            ...AppState.monthlyData.workouts.map(w => w.workout_date),
            ...AppState.monthlyData.cardio.map(c => c.workout_date),
            ...AppState.monthlyData.meals.map(m => m.meal_date)
        ]);
        
        DOM.getAll('.calendar-day').forEach(day => {
            if (day.dataset.date && dataDateSet.has(day.dataset.date)) {
                DOM.removeClass(day, 'disabled');
                DOM.addClass(day, 'has-data');
            }
        });
    }

    // 캘린더 날짜 선택
    static selectCalendarDate(dateString) {
        // 기존 선택 해제
        DOM.getAll('.calendar-day.active').forEach(day => {
            DOM.removeClass(day, 'active');
        });
        
        // 새 날짜 선택
        const selectedDay = document.querySelector(`[data-date="${dateString}"]`);
        if (selectedDay) {
            DOM.addClass(selectedDay, 'active');
        }
        
        AppState.selectedDateForLoad = dateString;
        
        // 데이터 미리보기 표시
        DataLoaderManager.showDataPreview(dateString);
    }

    // 데이터 미리보기 표시
    static showDataPreview(dateString) {
        const preview = DOM.get('dataPreview');
        const previewTitle = DOM.get('previewDateTitle');
        const previewContent = DOM.get('previewContent');
        const applyBtn = DOM.get('applyDataBtn');
        
        DOM.setText('previewDateTitle', `📅 ${dateString} 상세 데이터`);
        
        // 해당 날짜의 데이터 필터링
        const dayWorkouts = AppState.monthlyData.workouts.filter(w => w.workout_date === dateString);
        const dayCardio = AppState.monthlyData.cardio.filter(c => c.workout_date === dateString);
        const dayMeals = AppState.monthlyData.meals.filter(m => m.meal_date === dateString);
        
        let content = '';
        
        // 웨이트 운동
        if (dayWorkouts.length > 0) {
            content += `
                <div class="preview-section">
                    <div class="preview-title">🏋️‍♂️ 웨이트 운동 (${dayWorkouts.length}개)</div>
                    ${dayWorkouts.map(w => `
                        <div class="preview-item">• ${w.exercise_name} - ${w.total_weight}kg×${w.reps}×${w.sets} (${w.calories}kcal)</div>
                    `).join('')}
                </div>
            `;
        }
        
        // 유산소 운동
        if (dayCardio.length > 0) {
            content += `
                <div class="preview-section">
                    <div class="preview-title">🏃‍♂️ 유산소 운동 (${dayCardio.length}개)</div>
                    ${dayCardio.map(c => `
                        <div class="preview-item">• ${c.exercise_type} - ${
                            c.exercise_type === '런닝머신' 
                                ? `${c.incline}도, ${c.speed}km/h, ${c.duration}분`
                                : `강도 ${c.intensity}단계, ${c.duration}분`
                        } (${c.calories}kcal)</div>
                    `).join('')}
                </div>
            `;
        }
        
        // 식사 기록
        if (dayMeals.length > 0) {
            const breakfast = dayMeals.find(m => m.meal_type === 'breakfast');
            const lunch = dayMeals.find(m => m.meal_type === 'lunch');
            const dinner = dayMeals.find(m => m.meal_type === 'dinner');
            
            content += `
                <div class="preview-section">
                    <div class="preview-title">🍽️ 식사 기록</div>
                    ${breakfast ? `<div class="preview-item">• 아침: ${breakfast.total_calories}kcal (고정)</div>` : ''}
                    ${lunch ? `<div class="preview-item">• 점심: ${lunch.total_calories}kcal (고정)</div>` : ''}
                    ${dinner ? `<div class="preview-item">• 저녁: ${dinner.total_calories}kcal (${dinner.is_custom ? '커스텀' : '기본'})</div>` : ''}
                </div>
            `;
        }
        
        // 일일 요약 계산
        const totalWorkoutCal = [...dayWorkouts, ...dayCardio].reduce((sum, item) => sum + (item.calories || 0), 0);
        const basalMetabolicRate = Math.round(AppState.userWeight * 24);
        const totalDailyCalorieBurn = basalMetabolicRate + totalWorkoutCal;
        const totalFoodCal = dayMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
        const calorieBalance = totalFoodCal - totalDailyCalorieBurn;
        
        content += `
            <div class="preview-section summary-preview">
                <div class="preview-title">📊 일일 요약</div>
                <div class="preview-item">• 총 소모칼로리: ${totalDailyCalorieBurn}kcal</div>
                <div class="preview-item">• 총 섭취칼로리: ${totalFoodCal}kcal</div>
                <div class="preview-item">• 칼로리 수지: ${calorieBalance > 0 ? '+' : ''}${calorieBalance}kcal</div>
                <div class="preview-item">• 상태: ${calorieBalance > 0 ? '🔺 잉여' : '🔻 적자'}</div>
            </div>
        `;
        
        DOM.setHTML('previewContent', content);
        DOM.show(preview);
        DOM.show(applyBtn);
    }

    // 선택한 날짜 데이터 적용
    static applySelectedDateData() {
        if (!AppState.selectedDateForLoad) return;
        
        const applyBtn = DOM.get('applyDataBtn');
        applyBtn.textContent = '📥 적용 중...';
        applyBtn.style.backgroundColor = '#9ca3af';
        
        try {
            // 1. 기존 데이터 초기화
            AppState.workouts = [];
            AppState.cardioWorkouts = [];
            AppState.customDinnerItems = [];
            
            // 2. 웨이트 운동 데이터 적용
            const dayWorkouts = AppState.monthlyData.workouts.filter(w => w.workout_date === AppState.selectedDateForLoad);
            dayWorkouts.forEach(w => {
                AppState.workouts.push({
                    id: Date.now() + Math.random(),
                    category: w.category,
                    exercise: w.exercise_name,
                    totalWeight: w.total_weight,
                    reps: w.reps,
                    sets: w.sets,
                    calories: w.calories
                });
            });
            
            // 3. 유산소 운동 데이터 적용
            const dayCardio = AppState.monthlyData.cardio.filter(c => c.workout_date === AppState.selectedDateForLoad);
            dayCardio.forEach(c => {
                const cardioItem = {
                    id: Date.now() + Math.random(),
                    type: c.exercise_type,
                    duration: c.duration,
                    calories: c.calories
                };

                if (c.exercise_type === '런닝머신') {
                    cardioItem.incline = c.incline;
                    cardioItem.speed = c.speed;
                } else {
                    cardioItem.intensity = c.intensity;
                }

                AppState.cardioWorkouts.push(cardioItem);
            });
            
            const dayMeals = AppState.monthlyData.meals.filter(m => m.meal_date === AppState.selectedDateForLoad);

            // 4-1. 아침 식사 데이터 적용
            const breakfastData = dayMeals.find(m => m.meal_type === 'breakfast');
            if (breakfastData && breakfastData.is_custom) {
                DOM.get('useDefaultBreakfast').checked = false;
                MealManager.toggleBreakfastMenu();
                AppState.customBreakfastItems = [{
                    id: Date.now(),
                    name: breakfastData.menu_items || '불러온 아침',
                    calories: breakfastData.total_calories || 0
                }];
                MealManager.renderCustomBreakfast();
            } else if (breakfastData) {
                DOM.get('useDefaultBreakfast').checked = true;
                MealManager.toggleBreakfastMenu();
            }

            // 4-2. 점심 식사 데이터 적용
            const lunchData = dayMeals.find(m => m.meal_type === 'lunch');
            if (lunchData && lunchData.is_custom) {
                DOM.get('useDefaultLunch').checked = false;
                MealManager.toggleLunchMenu();
                AppState.customLunchItems = [{
                    id: Date.now(),
                    name: lunchData.menu_items || '불러온 점심',
                    calories: lunchData.total_calories || 0
                }];
                MealManager.renderCustomLunch();
            } else if (lunchData) {
                DOM.get('useDefaultLunch').checked = true;
                MealManager.toggleLunchMenu();
            }

            // 4. 저녁 식사 데이터 적용
            const dinnerData = dayMeals.find(m => m.meal_type === 'dinner');
            
            if (dinnerData) {
                if (dinnerData.is_custom) {
                    // 커스텀 저녁으로 설정
                    DOM.get('useDefaultDinner').checked = false;
                    MealManager.toggleDinnerMenu();
                    
                    // 커스텀 음식 아이템 파싱 (단순화된 버전)
                    AppState.customDinnerItems = [{
                        id: Date.now(),
                        name: dinnerData.menu_items || '불러온 저녁',
                        calories: dinnerData.total_calories || 0
                    }];
                    MealManager.renderCustomFoods();
                } else {
                    // 기본 저녁으로 설정
                    DOM.get('useDefaultDinner').checked = true;
                    MealManager.toggleDinnerMenu();
                }
            }
            
            // 5. UI 업데이트
            WorkoutManager.renderWorkouts();
            CardioManager.renderCardio();
            SummaryManager.updateSummary();
            
            // 6. 상단 날짜 선택기 업데이트
            DOM.setValue('selectedDate', AppState.selectedDateForLoad);
            
            NotificationUtils.alert(`${AppState.selectedDateForLoad} 데이터가 현재 화면에 적용되었습니다!`);
            
        } catch (error) {
            console.error('데이터 적용 오류:', error);
            NotificationUtils.alert('데이터 적용 중 오류가 발생했습니다: ' + error.message);
        } finally {
            applyBtn.textContent = '📥 이 날짜 데이터를 현재 화면에 적용';
            applyBtn.style.backgroundColor = '#10b981';
        }
    }

    // 데이터 불러오기 관련 초기화
    static resetDataLoader() {
        AppState.monthlyData = {
            workouts: [],
            cardio: [],
            meals: []
        };
        AppState.selectedDateForLoad = null;
        
        DOM.hide(DOM.get('successPopup'));
        DOM.hide(DOM.get('dataPreview'));
        DOM.hide(DOM.get('applyDataBtn'));
        DataLoaderManager.generateCalendar();
    }
    // 이전달 이동
    static moveToPreviousMonth() {
        if (AppState.currentCalendarMonth === 0) {
            AppState.currentCalendarYear--;
            AppState.currentCalendarMonth = 11;
        } else {
            AppState.currentCalendarMonth--;
        }
        DataLoaderManager.generateCalendar();
        DataLoaderManager.resetDataLoader();
    }
    
    // 다음달 이동  
    static moveToNextMonth() {
        if (AppState.currentCalendarMonth === 11) {
            AppState.currentCalendarYear++;
            AppState.currentCalendarMonth = 0;
        } else {
            AppState.currentCalendarMonth++;
        }
        DataLoaderManager.generateCalendar();
        DataLoaderManager.resetDataLoader();
    }
}
