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
        const koreanToday = KoreanDateUtils.getKoreanToday();
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) { // 6주 = 42일
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const currentDateString = DateUtils.formatDate(currentDate);

            if (currentDate.getMonth() !== month) {
                dayElement.className += ' disabled';
            } else {
                // 현재 월의 날짜는 일단 모두 disabled로 시작 (데이터 로드 후 has-data 클래스로 활성화)
                dayElement.className += ' disabled';
                dayElement.dataset.date = currentDateString;

                // 오늘 날짜 확인 (한국 시간 기준)
                if (currentDateString === koreanToday) {
                    dayElement.className += ' today';
                }

                dayElement.addEventListener('click', function () {
                    if (this.classList.contains('has-data') || this.classList.contains('no-workout')) {
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

            const message = `✅ ${year}년 ${DateUtils.monthNames[month - 1]} 데이터를 모두 불러왔습니다! (총 ${totalDays}일의 기록)`;
            NotificationUtils.showSuccessPopup(message);

            // 캘린더 업데이트
            DataLoaderManager.updateCalendarWithData();

        } catch (error) {
            console.error('데이터 불러오기 오류:', error);
            NotificationUtils.alert('데이터 불러오기 실패: ' + (error?.message || '알 수 없는 오류'));
        } finally {
            loadBtn.textContent = '📥 현재 월 데이터 불러오기';
            loadBtn.style.backgroundColor = '#10b981';
            loadBtn.disabled = false;
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

        // 월간 UI 업데이트
        DOM.setText('summaryMonth', `${year}년 ${month}월`);
        DOM.setText('totalWorkoutDays', totalWorkoutDays);
        DOM.setText('avgBurnCalories', avgBurnCalories);
        DOM.setText('avgFoodCalories', avgFoodCalories);
        DOM.setText('avgCalorieBalance', (avgCalorieBalance > 0 ? '+' : '') + avgCalorieBalance);

        // 연간 데이터 로드 및 표시
        DataLoaderManager.calculateAndShowYearlySummary(year);

        // 요약 컨테이너 표시
        DOM.show(DOM.get('summaryContainer'));
    }

    // 연간 통계 계산 및 표시
    static async calculateAndShowYearlySummary(year) {
        try {
            // 연간 데이터 조회
            const result = await supabaseManager.loadYearlyData(year);

            if (!result.success) {
                console.warn('연간 데이터 조회 실패:', result.error);
                // 연간 데이터가 없어도 월간은 표시
                DataLoaderManager.showDefaultYearlySummary(year);
                return;
            }

            const { workouts, cardio, meals } = result.data;

            // 운동일 계산
            const workoutDates = new Set([
                ...workouts.map(w => w.workout_date),
                ...cardio.map(c => c.workout_date)
            ]);
            const yearlyWorkoutDays = workoutDates.size;

            // 일별 데이터 그룹화
            const yearlyDailyData = {};

            // 운동 칼로리 집계
            [...workouts, ...cardio].forEach(item => {
                const date = item.workout_date;
                if (!yearlyDailyData[date]) yearlyDailyData[date] = { burnCalories: 0, foodCalories: 0 };
                yearlyDailyData[date].burnCalories += item.calories || 0;
            });

            // 식사 칼로리 집계
            meals.forEach(meal => {
                const date = meal.meal_date;
                if (!yearlyDailyData[date]) yearlyDailyData[date] = { burnCalories: 0, foodCalories: 0 };
                yearlyDailyData[date].foodCalories += meal.total_calories || 0;
            });

            // 연간 평균 계산
            const yearlyDailyValues = Object.values(yearlyDailyData);
            const yearlyAvgBurnCalories = yearlyDailyValues.length > 0 ?
                Math.round(yearlyDailyValues.reduce((sum, day) => sum + (day.burnCalories + (87 * 24)), 0) / yearlyDailyValues.length) : 0;
            const yearlyAvgFoodCalories = yearlyDailyValues.length > 0 ?
                Math.round(yearlyDailyValues.reduce((sum, day) => sum + day.foodCalories, 0) / yearlyDailyValues.length) : 0;
            const yearlyAvgCalorieBalance = yearlyAvgFoodCalories - yearlyAvgBurnCalories;

            // 연간 UI 업데이트
            DOM.setText('summaryYear', `${year}년`);
            DOM.setText('yearlyWorkoutDays', yearlyWorkoutDays);
            DOM.setText('yearlyAvgBurnCalories', yearlyAvgBurnCalories);
            DOM.setText('yearlyAvgFoodCalories', yearlyAvgFoodCalories);
            DOM.setText('yearlyAvgCalorieBalance', (yearlyAvgCalorieBalance > 0 ? '+' : '') + yearlyAvgCalorieBalance);

        } catch (error) {
            console.error('연간 데이터 계산 오류:', error);
            DataLoaderManager.showDefaultYearlySummary(year);
        }
    }

    // 기본 연간 요약 표시
    static showDefaultYearlySummary(year) {
        DOM.setText('summaryYear', `${year}년`);
        DOM.setText('yearlyWorkoutDays', 0);
        DOM.setText('yearlyAvgBurnCalories', 0);
        DOM.setText('yearlyAvgFoodCalories', 0);
        DOM.setText('yearlyAvgCalorieBalance', 0);
    }

    // 캘린더에 데이터 반영
    static updateCalendarWithData() {
        // 운동 데이터만 체크 (식사 데이터 제외)
        const workoutDateSet = new Set([
            ...AppState.monthlyData.workouts.map(w => w.workout_date),
            ...AppState.monthlyData.cardio.map(c => c.workout_date)
        ]);

        // 전체 데이터 (클릭 가능성 체크용)
        const allDataDateSet = new Set([
            ...AppState.monthlyData.workouts.map(w => w.workout_date),
            ...AppState.monthlyData.cardio.map(c => c.workout_date),
            ...AppState.monthlyData.meals.map(m => m.meal_date)
        ]);

        const koreanToday = KoreanDateUtils.getKoreanToday();

        DOM.getAll('.calendar-day').forEach(day => {
            if (day.dataset.date) {
                const dateString = day.dataset.date;
                const isBeforeToday = dateString < koreanToday;

                if (workoutDateSet.has(dateString)) {
                    // 운동 기록이 있는 날짜 - 초록색
                    DOM.removeClass(day, 'disabled');
                    DOM.removeClass(day, 'no-workout');
                    DOM.addClass(day, 'has-data');
                } else if (allDataDateSet.has(dateString) && isBeforeToday) {
                    // 운동 기록은 없지만 식사 기록이 있는 과거 날짜 - 빨간색
                    DOM.removeClass(day, 'disabled');
                    DOM.removeClass(day, 'has-data');
                    DOM.addClass(day, 'no-workout');
                } else if (isBeforeToday) {
                    // 아무 데이터도 없는 과거 날짜 - 빨간색
                    DOM.removeClass(day, 'disabled');
                    DOM.removeClass(day, 'has-data');
                    DOM.addClass(day, 'no-workout');
                } else {
                    // 오늘 이후 날짜는 disabled 상태 유지
                    DOM.addClass(day, 'disabled');
                    DOM.removeClass(day, 'has-data');
                    DOM.removeClass(day, 'no-workout');
                }
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
                        <div class="preview-item">• ${c.exercise_type} - ${c.exercise_type === '런닝머신'
                    ? `${c.incline}도, ${c.speed}km/h, ${c.duration}분`
                    : `강도 ${c.intensity}단계, ${c.rpm || 80}RPM, ${c.duration}분`
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

        // 모든 데이터 존재 여부에 따라 삭제 버튼 활성화 결정
        const totalData = dayWorkouts.length + dayCardio.length + dayMeals.length;
        const deleteBtn = DOM.get('deleteDataBtn');

        if (totalData > 0) {
            // 데이터가 있으면 삭제 버튼 활성화
            DOM.show(deleteBtn);
            deleteBtn.disabled = false;
            deleteBtn.style.backgroundColor = '#ef4444';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.textContent = `🗑️ 데이터 삭제 (총 ${totalData}개)`;
        } else {
            // 데이터가 없으면 삭제 버튼 비활성화
            DOM.show(deleteBtn);
            deleteBtn.disabled = true;
            deleteBtn.style.backgroundColor = '#9ca3af';
            deleteBtn.style.cursor = 'not-allowed';
            deleteBtn.textContent = '🗑️ 삭제할 데이터가 없습니다';
        }
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
                    cardioItem.rpm = c.rpm;
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
                // 볶음밥 타입 설정
                if (lunchData.total_calories === 480) AppState.selectedLunchType = 'galbi';
                else if (lunchData.total_calories === 475) AppState.selectedLunchType = 'kakdugi';
                else if (lunchData.total_calories === 510) AppState.selectedLunchType = 'egg';

                document.querySelector(`input[name="lunchType"][value="${AppState.selectedLunchType}"]`).checked = true;
                DOM.setText('selectedLunchCalories', lunchData.total_calories);
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

    // 선택한 날짜 데이터 삭제
    static async deleteSelectedDateData() {
        if (!AppState.selectedDateForLoad) {
            NotificationUtils.alert('삭제할 날짜를 먼저 선택해주세요.');
            return;
        }

        const selectedDate = AppState.selectedDateForLoad;

        // 해당 날짜의 데이터 개수 확인
        const dayWorkouts = AppState.monthlyData.workouts.filter(w => w.workout_date === selectedDate);
        const dayCardio = AppState.monthlyData.cardio.filter(c => c.workout_date === selectedDate);
        const dayMeals = AppState.monthlyData.meals.filter(m => m.meal_date === selectedDate);

        const totalData = dayWorkouts.length + dayCardio.length + dayMeals.length;

        if (totalData === 0) {
            NotificationUtils.alert('선택한 날짜에 삭제할 데이터가 없습니다.');
            return;
        }

        // 삭제 확인
        const confirmMessage = `${selectedDate}의 모든 데이터를 삭제하시겠습니까?\n\n` +
            `• 웨이트 운동: ${dayWorkouts.length}개\n` +
            `• 유산소 운동: ${dayCardio.length}개\n` +
            `• 식사 기록: ${dayMeals.length}개\n\n` +
            `⚠️ 이 작업은 되돌릴 수 없습니다.`;

        if (!NotificationUtils.confirm(confirmMessage)) {
            return;
        }

        const deleteBtn = DOM.get('deleteDataBtn');
        const originalText = deleteBtn.textContent;

        try {
            deleteBtn.textContent = '🗑️ 삭제 중...';
            deleteBtn.style.backgroundColor = '#9ca3af';
            deleteBtn.style.cursor = 'not-allowed';
            deleteBtn.disabled = true;

            // Supabase에서 데이터 삭제
            const result = await supabaseManager.deleteDataByDate(selectedDate);

            if (!result.success) {
                throw result.error;
            }

            // 로컬 데이터에서도 제거
            AppState.monthlyData.workouts = AppState.monthlyData.workouts.filter(w => w.workout_date !== selectedDate);
            AppState.monthlyData.cardio = AppState.monthlyData.cardio.filter(c => c.workout_date !== selectedDate);
            AppState.monthlyData.meals = AppState.monthlyData.meals.filter(m => m.meal_date !== selectedDate);

            // UI 업데이트
            DataLoaderManager.updateCalendarWithData();

            // 월간 통계 재계산
            const year = AppState.currentCalendarYear;
            const month = AppState.currentCalendarMonth + 1;
            DataLoaderManager.calculateAndShowMonthlySummary(AppState.monthlyData, year, month);

            // 미리보기 숨기기
            DOM.hide(DOM.get('dataPreview'));
            DOM.hide(DOM.get('applyDataBtn'));
            DOM.hide(DOM.get('deleteDataBtn'));

            // 캘린더에서 선택 해제
            DOM.getAll('.calendar-day.active').forEach(day => {
                DOM.removeClass(day, 'active');
            });

            AppState.selectedDateForLoad = null;

            NotificationUtils.alert(`${selectedDate} 데이터가 완전히 삭제되었습니다!`);

            // 1초 후 자동 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('데이터 삭제 오류:', error);
            NotificationUtils.alert('데이터 삭제 중 오류가 발생했습니다: ' + (error?.message || '알 수 없는 오류'));
        } finally {
            deleteBtn.textContent = originalText;
            deleteBtn.style.backgroundColor = '#ef4444';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.disabled = false;
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
        DOM.hide(DOM.get('deleteDataBtn'));
        DOM.hide(DOM.get('summaryContainer'));
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

        // 이동한 달의 데이터 자동 불러오기
        setTimeout(() => {
            DataLoaderManager.autoLoadCurrentMonthData();
        }, 500);
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

        // 이동한 달의 데이터 자동 불러오기
        setTimeout(() => {
            DataLoaderManager.autoLoadCurrentMonthData();
        }, 500);
    }

    // 스마트 자동 데이터 로딩
    static async autoLoadCurrentMonthData() {
        try {
            const year = AppState.currentCalendarYear;
            const month = AppState.currentCalendarMonth + 1;

            // 이미 해당 월 데이터가 있는지 확인
            const hasExistingData = AppState.monthlyData.workouts.length > 0 ||
                AppState.monthlyData.cardio.length > 0 ||
                AppState.monthlyData.meals.length > 0;

            if (hasExistingData) {
                console.log('이미 데이터가 로드되어 있습니다.');
                return;
            }

            // 조용히 데이터 불러오기 (로딩 메시지 없이)
            console.log(`${year}년 ${month}월 데이터를 자동으로 불러옵니다...`);

            const result = await supabaseManager.loadMonthlyData(year, month);

            if (result.success) {
                // 데이터가 있든 없든 저장
                AppState.monthlyData = result.data;

                // 데이터가 있든 없든 항상 월간 통계 표시
                DataLoaderManager.calculateAndShowMonthlySummary(result.data, year, month);

                if (result.data.workouts.length > 0 ||
                    result.data.cardio.length > 0 ||
                    result.data.meals.length > 0) {

                    // 조용한 성공 메시지
                    console.log(`✅ ${year}년 ${month}월 데이터 자동 로딩 완료`);

                    // 선택적: 작은 알림 (2초 후 자동 사라짐)
                    setTimeout(() => {
                        if (typeof NotificationUtils !== 'undefined' && NotificationUtils.showSuccessPopup) {
                            NotificationUtils.showSuccessPopup(
                                `📊 ${year}년 ${DateUtils.monthNames[month - 1]} 데이터가 자동으로 로드되었습니다`,
                                2000
                            );
                        }
                    }, 500);
                } else {
                    console.log('불러올 데이터가 없습니다 (모든 값 0으로 표시).');
                }

                // 데이터가 있든 없든 항상 캘린더 업데이트
                DataLoaderManager.updateCalendarWithData();
            }

        } catch (error) {
            console.log('자동 데이터 로딩 실패:', error.message);
            // 실패해도 앱은 정상 동작하도록 에러를 조용히 처리
        }
    }
}