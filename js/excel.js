// 엑셀 다운로드 관리 클래스
class ExcelManager {
    // 엑셀 데이터 다운로드
    static async downloadData() {
        const selectedDate = DOM.getValue('selectedDate');
        const currentYear = AppState.currentCalendarYear;
        const currentMonth = AppState.currentCalendarMonth + 1;

        // 다운로드 버튼 상태 변경
        const downloadBtn = DOM.get('downloadData');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '📥 데이터 준비 중...';
        downloadBtn.disabled = true;

        try {
            // 워크북 생성
            const workbook = XLSX.utils.book_new();

            // === 1. 일일 데이터 시트 ===
            const dailyData = ExcelManager.createDailyDataSheet(selectedDate);
            const dailyWorksheet = XLSX.utils.aoa_to_sheet(dailyData);
            XLSX.utils.book_append_sheet(workbook, dailyWorksheet, '일일기록');

            // === 2. 월간 데이터 시트 ===
            if (AppState.monthlyData.workouts.length > 0 || AppState.monthlyData.cardio.length > 0 || AppState.monthlyData.meals.length > 0) {
                const monthlyData = ExcelManager.createMonthlyDataSheet(currentYear, currentMonth);
                const monthlyWorksheet = XLSX.utils.aoa_to_sheet(monthlyData);
                XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, `${currentMonth}월데이터`);

                // === 3. 월간 상세 통계 시트 ===
                const monthlyStats = ExcelManager.createMonthlyStatsSheet(currentYear, currentMonth);
                const monthlyStatsWorksheet = XLSX.utils.aoa_to_sheet(monthlyStats);
                XLSX.utils.book_append_sheet(workbook, monthlyStatsWorksheet, `${currentMonth}월통계`);
            }

            // === 4. 연간 데이터 조회 및 시트 생성 ===
            downloadBtn.textContent = '📥 연간 데이터 조회 중...';
            const yearlyResult = await supabaseManager.loadYearlyData(currentYear);
            
            if (yearlyResult.success && yearlyResult.data) {
                const yearlyData = ExcelManager.createYearlyDataSheet(currentYear, yearlyResult.data);
                const yearlyWorksheet = XLSX.utils.aoa_to_sheet(yearlyData);
                XLSX.utils.book_append_sheet(workbook, yearlyWorksheet, `${currentYear}년데이터`);

                // === 5. 연간 통계 시트 ===
                const yearlyStats = ExcelManager.createYearlyStatsSheet(currentYear, yearlyResult.data);
                const yearlyStatsWorksheet = XLSX.utils.aoa_to_sheet(yearlyStats);
                XLSX.utils.book_append_sheet(workbook, yearlyStatsWorksheet, `${currentYear}년통계`);
            }

            // 엑셀 파일 다운로드
            downloadBtn.textContent = '📥 파일 생성 중...';
            const fileName = `운동기록_${selectedDate}_월간연간데이터포함.xlsx`;
            XLSX.writeFile(workbook, fileName);

        } catch (error) {
            console.error('엑셀 다운로드 오류:', error);
            NotificationUtils.alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message);
        } finally {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        }
    }

    // 일일 데이터 시트 생성
    static createDailyDataSheet(selectedDate) {
        const allData = [];

        // 1. 운동 기록 섹션
        allData.push(['=== 일일 운동 기록 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '운동타입', '카테고리', '운동명', '총무게(kg)', '횟수', '세트', '각도(도)', '속도(km/h)', '강도', '시간(분)', '소모칼로리']);

        // 웨이트 운동 데이터
        if (AppState.workouts.length > 0) {
            AppState.workouts.forEach(workout => {
                allData.push([
                    selectedDate,
                    '웨이트',
                    workout.category,
                    workout.exercise,
                    workout.totalWeight,
                    workout.reps,
                    workout.sets,
                    '',
                    '',
                    '',
                    '',
                    workout.calories
                ]);
            });
        }

        // 유산소 운동 데이터
        if (AppState.cardioWorkouts.length > 0) {
            AppState.cardioWorkouts.forEach(cardio => {
                allData.push([
                    selectedDate,
                    '유산소',
                    cardio.type,
                    cardio.type,
                    '',
                    '',
                    '',
                    cardio.incline || '',
                    cardio.speed || '',
                    cardio.intensity || '',
                    cardio.duration,
                    cardio.calories
                ]);
            });
        }

        if (AppState.workouts.length === 0 && AppState.cardioWorkouts.length === 0) {
            allData.push([selectedDate, '운동 기록 없음', '', '', '', '', '', '', '', '', '', '']);
        }

        // 빈 줄 추가
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 2. 식사 기록 섹션
        const breakfastCal = DOM.get('useDefaultBreakfast').checked ?
            MEAL_CALORIES.breakfast :
            ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
        const lunchCal = DOM.get('useDefaultLunch').checked ?
            MEAL_CALORIES.lunch :
            ArrayUtils.sum(AppState.customLunchItems, 'calories');
        const dinnerCal = DOM.get('useDefaultDinner').checked ?
            MEAL_CALORIES.defaultDinner :
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');

        allData.push(['=== 일일 식사 기록 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '식사타입', '메뉴', '칼로리', '고정여부', '', '', '', '', '', '', '']);
        allData.push([
            selectedDate,
            '아침',
            DOM.get('useDefaultBreakfast').checked ? 
                '단백질 쉐이크 1잔, 에사비 콤부차 1잔' :
                (AppState.customBreakfastItems.length > 0 ? AppState.customBreakfastItems.map(f => f.name).join(', ') : '커스텀 아침'),
            breakfastCal,
            DOM.get('useDefaultBreakfast').checked ? '고정' : '커스텀',
            '', '', '', '', '', '', ''
        ]);
        allData.push([
            selectedDate,
            '점심',
            DOM.get('useDefaultLunch').checked ? 
                '펜네 스파게티 100g, 저당 소스, 작은 소시지 4개' :
                (AppState.customLunchItems.length > 0 ? AppState.customLunchItems.map(f => f.name).join(', ') : '커스텀 점심'),
            lunchCal,
            DOM.get('useDefaultLunch').checked ? '고정' : '커스텀',
            '', '', '', '', '', '', ''
        ]);
        allData.push([
            selectedDate,
            '저녁',
            DOM.get('useDefaultDinner').checked ?
                '쌀밥 150g, 작은 소시지 4개' :
                (AppState.customDinnerItems.length > 0 ? AppState.customDinnerItems.map(f => f.name).join(', ') : '저녁 미입력'),
            dinnerCal,
            DOM.get('useDefaultDinner').checked ? '고정' : '커스텀',
            '', '', '', '', '', '', ''
        ]);

        // 빈 줄 추가
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 3. 일일 요약 섹션
        const basalMetabolicRate = CalorieCalculator.calculateTDEE();
        const totalWorkoutCalories = ArrayUtils.sum(AppState.workouts, 'calories') + ArrayUtils.sum(AppState.cardioWorkouts, 'calories');
        const totalDailyCalorieBurn = basalMetabolicRate + totalWorkoutCalories;
        const totalFoodCalories = breakfastCal + lunchCal + dinnerCal;
        const actualCalorieBalance = totalFoodCalories - totalDailyCalorieBurn;

        allData.push(['=== 일일 요약 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', selectedDate, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['체중(kg)', AppState.userWeight, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['기초대사량(BMR)', basalMetabolicRate, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['운동소모칼로리', totalWorkoutCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['웨이트소모칼로리', ArrayUtils.sum(AppState.workouts, 'calories'), '', '', '', '', '', '', '', '', '', '']);
        allData.push(['유산소소모칼로리', ArrayUtils.sum(AppState.cardioWorkouts, 'calories'), '', '', '', '', '', '', '', '', '', '']);
        allData.push(['일일총소모칼로리', totalDailyCalorieBurn, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총섭취칼로리', totalFoodCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['아침칼로리', breakfastCal, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['점심칼로리', lunchCal, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['저녁칼로리', dinnerCal, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['칼로리수지', actualCalorieBalance, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['수지상태', actualCalorieBalance > 0 ? '잉여' : '적자', '', '', '', '', '', '', '', '', '', '']);

        return allData;
    }

    // 연간 데이터 시트 생성
    static createYearlyDataSheet(year, yearlyData) {
        const { workouts, cardio, meals } = yearlyData;
        const allData = [];

        // 헤더
        allData.push([`=== ${year}년 전체 데이터 ===`, '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 1. 연간 웨이트 운동 데이터 (월별 요약)
        allData.push(['=== 연간 웨이트 운동 월별 요약 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['월', '운동횟수', '총세트수', '총소모칼로리', '평균무게(kg)', '', '', '', '', '', '', '']);
        
        const monthlyWorkoutSummary = ExcelManager.getMonthlyWorkoutSummary(workouts);
        for (let month = 1; month <= 12; month++) {
            const monthData = monthlyWorkoutSummary[month] || { count: 0, totalSets: 0, totalCalories: 0, avgWeight: 0 };
            allData.push([
                `${month}월`,
                monthData.count,
                monthData.totalSets,
                monthData.totalCalories,
                monthData.avgWeight,
                '', '', '', '', '', '', ''
            ]);
        }

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 2. 연간 유산소 운동 데이터 (월별 요약)
        allData.push(['=== 연간 유산소 운동 월별 요약 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['월', '운동횟수', '총시간(분)', '총소모칼로리', '평균시간(분)', '', '', '', '', '', '', '']);
        
        const monthlyCardioSummary = ExcelManager.getMonthlyCardioSummary(cardio);
        for (let month = 1; month <= 12; month++) {
            const monthData = monthlyCardioSummary[month] || { count: 0, totalDuration: 0, totalCalories: 0, avgDuration: 0 };
            allData.push([
                `${month}월`,
                monthData.count,
                monthData.totalDuration,
                monthData.totalCalories,
                monthData.avgDuration,
                '', '', '', '', '', '', ''
            ]);
        }

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 3. 연간 식사 데이터 (월별 평균)
        allData.push(['=== 연간 식사 월별 평균 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['월', '기록일수', '평균섭취칼로리', '아침평균', '점심평균', '저녁평균', '', '', '', '', '', '']);
        
        const monthlyMealSummary = ExcelManager.getMonthlyMealSummary(meals);
        for (let month = 1; month <= 12; month++) {
            const monthData = monthlyMealSummary[month] || { days: 0, avgTotal: 0, avgBreakfast: 0, avgLunch: 0, avgDinner: 0 };
            allData.push([
                `${month}월`,
                monthData.days,
                monthData.avgTotal,
                monthData.avgBreakfast,
                monthData.avgLunch,
                monthData.avgDinner,
                '', '', '', '', '', ''
            ]);
        }

        return allData;
    }

    // 연간 통계 시트 생성
    static createYearlyStatsSheet(year, yearlyData) {
        const { workouts, cardio, meals } = yearlyData;
        const allData = [];

        // 헤더
        allData.push([`=== ${year}년 종합 통계 ===`, '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 1. 연간 기본 통계
        const workoutDates = new Set([...workouts.map(w => w.workout_date), ...cardio.map(c => c.workout_date)]);
        const totalWorkoutDays = workoutDates.size;
        const totalWeightExercises = workouts.length;
        const totalCardioExercises = cardio.length;
        const totalMealRecords = meals.length;

        allData.push(['=== 연간 기본 통계 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 운동일수', totalWorkoutDays, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 웨이트 운동수', totalWeightExercises, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 유산소 운동수', totalCardioExercises, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 식사 기록수', totalMealRecords, '', '', '', '', '', '', '', '', '', '']);

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 2. 연간 칼로리 통계
        const totalWorkoutCalories = [...workouts, ...cardio].reduce((sum, item) => sum + (item.calories || 0), 0);
        const totalFoodCalories = meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
        const avgDailyWorkoutCalories = totalWorkoutDays > 0 ? Math.round(totalWorkoutCalories / totalWorkoutDays) : 0;
        const avgDailyFoodCalories = totalWorkoutDays > 0 ? Math.round(totalFoodCalories / totalWorkoutDays) : 0;

        allData.push(['=== 연간 칼로리 통계 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 운동 소모칼로리', totalWorkoutCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 섭취칼로리', totalFoodCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['일평균 운동 소모칼로리', avgDailyWorkoutCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['일평균 섭취칼로리', avgDailyFoodCalories, '', '', '', '', '', '', '', '', '', '']);

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 3. 가장 많이 한 운동 TOP 10
        allData.push(['=== 가장 많이 한 웨이트 운동 TOP 10 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['순위', '운동명', '실시횟수', '총세트수', '총소모칼로리', '', '', '', '', '', '', '']);

        const workoutCounts = {};
        workouts.forEach(workout => {
            const name = workout.exercise_name;
            if (!workoutCounts[name]) {
                workoutCounts[name] = { count: 0, totalSets: 0, totalCalories: 0 };
            }
            workoutCounts[name].count++;
            workoutCounts[name].totalSets += workout.sets;
            workoutCounts[name].totalCalories += workout.calories;
        });

        const sortedWorkouts = Object.entries(workoutCounts)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 10);

        sortedWorkouts.forEach(([name, stats], index) => {
            allData.push([
                index + 1,
                name,
                stats.count,
                stats.totalSets,
                stats.totalCalories,
                '', '', '', '', '', '', ''
            ]);
        });

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 4. 월별 운동 패턴
        allData.push(['=== 월별 운동 패턴 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['월', '운동일수', '웨이트횟수', '유산소횟수', '총소모칼로리', '평균섭취칼로리', '', '', '', '', '', '']);

        for (let month = 1; month <= 12; month++) {
            const monthWorkouts = workouts.filter(w => new Date(w.workout_date).getMonth() + 1 === month);
            const monthCardio = cardio.filter(c => new Date(c.workout_date).getMonth() + 1 === month);
            const monthMeals = meals.filter(m => new Date(m.meal_date).getMonth() + 1 === month);
            
            const monthWorkoutDates = new Set([...monthWorkouts.map(w => w.workout_date), ...monthCardio.map(c => c.workout_date)]);
            const monthTotalCalories = [...monthWorkouts, ...monthCardio].reduce((sum, item) => sum + (item.calories || 0), 0);
            const monthAvgFoodCalories = monthMeals.length > 0 ? 
                Math.round(monthMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / monthMeals.length) : 0;

            allData.push([
                `${month}월`,
                monthWorkoutDates.size,
                monthWorkouts.length,
                monthCardio.length,
                monthTotalCalories,
                monthAvgFoodCalories,
                '', '', '', '', '', ''
            ]);
        }

        return allData;
    }

    // 월별 웨이트 운동 요약 계산
    static getMonthlyWorkoutSummary(workouts) {
        const summary = {};
        
        workouts.forEach(workout => {
            const month = new Date(workout.workout_date).getMonth() + 1;
            if (!summary[month]) {
                summary[month] = { count: 0, totalSets: 0, totalCalories: 0, totalWeight: 0, weightCount: 0 };
            }
            summary[month].count++;
            summary[month].totalSets += workout.sets;
            summary[month].totalCalories += workout.calories;
            summary[month].totalWeight += workout.total_weight;
            summary[month].weightCount++;
        });

        // 평균 무게 계산
        Object.keys(summary).forEach(month => {
            summary[month].avgWeight = summary[month].weightCount > 0 ? 
                Math.round(summary[month].totalWeight / summary[month].weightCount) : 0;
        });

        return summary;
    }

    // 월별 유산소 운동 요약 계산
    static getMonthlyCardioSummary(cardio) {
        const summary = {};
        
        cardio.forEach(cardioItem => {
            const month = new Date(cardioItem.workout_date).getMonth() + 1;
            if (!summary[month]) {
                summary[month] = { count: 0, totalDuration: 0, totalCalories: 0 };
            }
            summary[month].count++;
            summary[month].totalDuration += cardioItem.duration;
            summary[month].totalCalories += cardioItem.calories;
        });

        // 평균 시간 계산
        Object.keys(summary).forEach(month => {
            summary[month].avgDuration = summary[month].count > 0 ? 
                Math.round(summary[month].totalDuration / summary[month].count) : 0;
        });

        return summary;
    }

    // 월별 식사 요약 계산
    static getMonthlyMealSummary(meals) {
        const summary = {};
        
        // 날짜별로 그룹화
        const dailyMeals = {};
        meals.forEach(meal => {
            const month = new Date(meal.meal_date).getMonth() + 1;
            const date = meal.meal_date;
            
            if (!dailyMeals[month]) dailyMeals[month] = {};
            if (!dailyMeals[month][date]) {
                dailyMeals[month][date] = { total: 0, breakfast: 0, lunch: 0, dinner: 0 };
            }
            
            dailyMeals[month][date].total += meal.total_calories;
            if (meal.meal_type === 'breakfast') dailyMeals[month][date].breakfast = meal.total_calories;
            if (meal.meal_type === 'lunch') dailyMeals[month][date].lunch = meal.total_calories;
            if (meal.meal_type === 'dinner') dailyMeals[month][date].dinner = meal.total_calories;
        });

        // 월별 평균 계산
        Object.keys(dailyMeals).forEach(month => {
            const monthData = dailyMeals[month];
            const dates = Object.keys(monthData);
            const days = dates.length;
            
            if (days > 0) {
                summary[month] = {
                    days: days,
                    avgTotal: Math.round(dates.reduce((sum, date) => sum + monthData[date].total, 0) / days),
                    avgBreakfast: Math.round(dates.reduce((sum, date) => sum + monthData[date].breakfast, 0) / days),
                    avgLunch: Math.round(dates.reduce((sum, date) => sum + monthData[date].lunch, 0) / days),
                    avgDinner: Math.round(dates.reduce((sum, date) => sum + monthData[date].dinner, 0) / days)
                };
            }
        });

        return summary;
    }

    // 월간 데이터 시트 생성
    static createMonthlyDataSheet(year, month) {
        const { workouts, cardio, meals } = AppState.monthlyData;
        const allData = [];

        // 헤더
        allData.push([`=== ${year}년 ${month}월 전체 데이터 ===`, '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 1. 월간 웨이트 운동 데이터
        allData.push(['=== 월간 웨이트 운동 기록 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '카테고리', '운동명', '총무게(kg)', '횟수', '세트', '소모칼로리', '', '', '', '', '']);
        
        if (workouts.length > 0) {
            workouts.forEach(workout => {
                allData.push([
                    workout.workout_date,
                    workout.category,
                    workout.exercise_name,
                    workout.total_weight,
                    workout.reps,
                    workout.sets,
                    workout.calories,
                    '', '', '', '', ''
                ]);
            });
        } else {
            allData.push(['웨이트 운동 기록 없음', '', '', '', '', '', '', '', '', '', '', '']);
        }

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 2. 월간 유산소 운동 데이터
        allData.push(['=== 월간 유산소 운동 기록 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '운동타입', '각도(도)', '속도(km/h)', '강도', 'RPM', '시간(분)', '소모칼로리', '', '', '', '']);
        
        if (cardio.length > 0) {
            cardio.forEach(cardioItem => {
                allData.push([
                    cardioItem.workout_date,
                    cardioItem.exercise_type,
                    cardioItem.incline || '',
                    cardioItem.speed || '',
                    cardioItem.intensity || '',
                    cardioItem.rpm || '',
                    cardioItem.duration,
                    cardioItem.calories,
                    '', '', '', ''
                ]);
            });
        } else {
            allData.push(['유산소 운동 기록 없음', '', '', '', '', '', '', '', '', '', '', '']);
        }

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 3. 월간 식사 데이터
        allData.push(['=== 월간 식사 기록 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '식사타입', '총칼로리', '고정/커스텀', '메뉴상세', '', '', '', '', '', '', '']);
        
        if (meals.length > 0) {
            meals.forEach(meal => {
                allData.push([
                    meal.meal_date,
                    meal.meal_type === 'breakfast' ? '아침' : meal.meal_type === 'lunch' ? '점심' : '저녁',
                    meal.total_calories,
                    meal.is_custom ? '커스텀' : '고정',
                    meal.menu_items,
                    '', '', '', '', '', '', ''
                ]);
            });
        } else {
            allData.push(['식사 기록 없음', '', '', '', '', '', '', '', '', '', '', '']);
        }

        return allData;
    }

    // 월간 상세 통계 시트 생성
    static createMonthlyStatsSheet(year, month) {
        const { workouts, cardio, meals } = AppState.monthlyData;
        const allData = [];

        // 헤더
        allData.push([`=== ${year}년 ${month}월 상세 통계 ===`, '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 1. 기본 통계
        const workoutDates = new Set([...workouts.map(w => w.workout_date), ...cardio.map(c => c.workout_date)]);
        const totalWorkoutDays = workoutDates.size;

        allData.push(['=== 기본 통계 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 운동일수', totalWorkoutDays, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 웨이트 운동수', workouts.length, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 유산소 운동수', cardio.length, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['총 식사 기록수', meals.length, '', '', '', '', '', '', '', '', '', '']);

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 2. 일별 데이터 그룹화 및 평균 계산
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
        const avgWorkoutCalories = dailyValues.length > 0 ?
            Math.round(dailyValues.reduce((sum, day) => sum + day.burnCalories, 0) / dailyValues.length) : 0;
        const avgTotalBurnCalories = dailyValues.length > 0 ?
            Math.round(dailyValues.reduce((sum, day) => sum + (day.burnCalories + (AppState.userWeight * 24)), 0) / dailyValues.length) : 0;
        const avgFoodCalories = dailyValues.length > 0 ?
            Math.round(dailyValues.reduce((sum, day) => sum + day.foodCalories, 0) / dailyValues.length) : 0;
        const avgCalorieBalance = avgFoodCalories - avgTotalBurnCalories;

        allData.push(['=== 평균 통계 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['평균 운동 소모칼로리', avgWorkoutCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['평균 총 소모칼로리(BMR포함)', avgTotalBurnCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['평균 섭취칼로리', avgFoodCalories, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['평균 칼로리수지', avgCalorieBalance, '', '', '', '', '', '', '', '', '', '']);
        allData.push(['월간 평균 수지상태', avgCalorieBalance > 0 ? '잉여' : '적자', '', '', '', '', '', '', '', '', '', '']);

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 3. 운동별 통계
        allData.push(['=== 운동별 통계 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['운동명', '실시횟수', '총세트수', '총소모칼로리', '', '', '', '', '', '', '', '']);

        // 웨이트 운동별 집계
        const workoutStats = {};
        workouts.forEach(workout => {
            const name = workout.exercise_name;
            if (!workoutStats[name]) {
                workoutStats[name] = { count: 0, totalSets: 0, totalCalories: 0 };
            }
            workoutStats[name].count++;
            workoutStats[name].totalSets += workout.sets;
            workoutStats[name].totalCalories += workout.calories;
        });

        Object.entries(workoutStats).forEach(([name, stats]) => {
            allData.push([name, stats.count, stats.totalSets, stats.totalCalories, '', '', '', '', '', '', '', '']);
        });

        // 유산소 운동별 집계
        const cardioStats = {};
        cardio.forEach(cardioItem => {
            const name = cardioItem.exercise_type;
            if (!cardioStats[name]) {
                cardioStats[name] = { count: 0, totalDuration: 0, totalCalories: 0 };
            }
            cardioStats[name].count++;
            cardioStats[name].totalDuration += cardioItem.duration;
            cardioStats[name].totalCalories += cardioItem.calories;
        });

        Object.entries(cardioStats).forEach(([name, stats]) => {
            allData.push([`${name}(유산소)`, stats.count, `${stats.totalDuration}분`, stats.totalCalories, '', '', '', '', '', '', '', '']);
        });

        allData.push(['', '', '', '', '', '', '', '', '', '', '', '']);

        // 4. 일별 상세 데이터
        allData.push(['=== 일별 상세 데이터 ===', '', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '운동소모칼로리', '총소모칼로리', '섭취칼로리', '칼로리수지', '수지상태', '', '', '', '', '', '']);

        const sortedDates = Object.keys(dailyData).sort();
        sortedDates.forEach(date => {
            const data = dailyData[date];
            const totalBurn = data.burnCalories + (AppState.userWeight * 24);
            const balance = data.foodCalories - totalBurn;
            
            allData.push([
                date,
                data.burnCalories,
                totalBurn,
                data.foodCalories,
                balance,
                balance > 0 ? '잉여' : '적자',
                '', '', '', '', '', ''
            ]);
        });

        return allData;
    }
}
