// 엑셀 다운로드 관리 클래스
class ExcelManager {
    // 엑셀 데이터 다운로드
    static downloadData() {
        const selectedDate = DOM.getValue('selectedDate');
        const currentYear = AppState.currentCalendarYear;
        const currentMonth = AppState.currentCalendarMonth + 1;

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

        // 엑셀 파일 다운로드
        const fileName = `운동기록_${selectedDate}_월간데이터포함.xlsx`;
        XLSX.writeFile(workbook, fileName);
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
        const basalMetabolicRate = CalorieCalculator.calculateBMR();
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
