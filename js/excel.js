// 엑셀 다운로드 관리 클래스
class ExcelManager {
    // 엑셀 데이터 다운로드
    static downloadData() {
        const selectedDate = DOM.getValue('selectedDate');

        // 워크북 생성
        const workbook = XLSX.utils.book_new();

        // 하나의 시트에 모든 데이터 통합
        const allData = [];

        // 1. 운동 기록 섹션
        allData.push(['=== 운동 기록 ===', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '운동타입', '카테고리', '운동명', '총무게(kg)', '횟수', '세트', '각도(도)', '속도(km/h)', '시간(분)', '소모칼로리']);

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
                    cardio.incline,
                    cardio.speed,
                    cardio.duration,
                    cardio.calories
                ]);
            });
        }

        if (AppState.workouts.length === 0 && AppState.cardioWorkouts.length === 0) {
            allData.push([selectedDate, '운동 기록 없음', '', '', '', '', '', '', '', '', '']);
        }

        // 빈 줄 추가
        allData.push(['', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '']);

        // 2. 식사 기록 섹션
        const breakfastCal = MEAL_CALORIES.breakfast;
        const lunchCal = MEAL_CALORIES.lunch;
        const dinnerCal = DOM.get('useDefaultDinner').checked ?
            MEAL_CALORIES.defaultDinner :
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');

        allData.push(['=== 식사 기록 ===', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', '식사타입', '메뉴', '칼로리', '고정여부', '', '', '', '', '', '']);
        allData.push([
            selectedDate,
            '아침',
            '단백질 쉐이크 1잔, 에사비 콤부차 1잔',
            breakfastCal,
            '고정',
            '', '', '', '', '', ''
        ]);
        allData.push([
            selectedDate,
            '점심',
            '펜네 스파게티 100g, 저당 소스, 작은 소시지 4개',
            lunchCal,
            '고정',
            '', '', '', '', '', ''
        ]);
        allData.push([
            selectedDate,
            '저녁',
            DOM.get('useDefaultDinner').checked ?
                '쌀밥 150g, 작은 소시지 4개' :
                (AppState.customDinnerItems.length > 0 ? AppState.customDinnerItems.map(f => f.name).join(', ') : '저녁 미입력'),
            dinnerCal,
            DOM.get('useDefaultDinner').checked ? '고정' : '커스텀',
            '', '', '', '', '', ''
        ]);

        // 빈 줄 추가
        allData.push(['', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['', '', '', '', '', '', '', '', '', '', '']);

        // 3. 일일 요약 섹션
        const totalWorkoutCalories = parseInt(DOM.getText('totalWorkoutCal')) || 0;
        const totalFoodCalories = parseInt(DOM.getText('totalFoodCal')) || 960;
        const calorieBalanceText = DOM.getText('calorieBalance') || '0';
        const calorieBalance = parseInt(calorieBalanceText.replace('+', '').replace('-', '')) * (calorieBalanceText.includes('-') ? -1 : 1);

        // 기초대사량 계산
        const basalMetabolicRate = CalorieCalculator.calculateBMR();
        const totalDailyCalorieBurn = basalMetabolicRate + ArrayUtils.sum(AppState.workouts, 'calories') + ArrayUtils.sum(AppState.cardioWorkouts, 'calories');
        const actualCalorieBalance = totalFoodCalories - totalDailyCalorieBurn;

        allData.push(['=== 일일 요약 ===', '', '', '', '', '', '', '', '', '', '']);
        allData.push(['항목', '값', '', '', '', '', '', '', '', '', '']);
        allData.push(['날짜', selectedDate, '', '', '', '', '', '', '', '', '']);
        allData.push(['체중(kg)', AppState.userWeight, '', '', '', '', '', '', '', '', '']);
        allData.push(['기초대사량(BMR)', basalMetabolicRate, '', '', '', '', '', '', '', '', '']);
        allData.push(['운동소모칼로리', ArrayUtils.sum(AppState.workouts, 'calories') + ArrayUtils.sum(AppState.cardioWorkouts, 'calories'), '', '', '', '', '', '', '', '', '']);
        allData.push(['웨이트소모칼로리', ArrayUtils.sum(AppState.workouts, 'calories'), '', '', '', '', '', '', '', '', '']);
        allData.push(['유산소소모칼로리', ArrayUtils.sum(AppState.cardioWorkouts, 'calories'), '', '', '', '', '', '', '', '', '']);
        allData.push(['일일총소모칼로리', totalDailyCalorieBurn, '', '', '', '', '', '', '', '', '']);
        allData.push(['총섭취칼로리', totalFoodCalories, '', '', '', '', '', '', '', '', '']);
        allData.push(['아침칼로리', breakfastCal, '', '', '', '', '', '', '', '', '']);
        allData.push(['점심칼로리', lunchCal, '', '', '', '', '', '', '', '', '']);
        allData.push(['저녁칼로리', dinnerCal, '', '', '', '', '', '', '', '', '']);
        allData.push(['실제칼로리수지', actualCalorieBalance, '', '', '', '', '', '', '', '', '']);
        allData.push(['화면표시수지', calorieBalance, '', '', '', '', '', '', '', '', '']);
        allData.push(['수지상태', actualCalorieBalance > 0 ? '잉여' : '적자', '', '', '', '', '', '', '', '', '']);

        // 시트 생성
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        XLSX.utils.book_append_sheet(workbook, worksheet, '운동기록');

        // 엑셀 파일 다운로드
        const fileName = `운동기록_${selectedDate}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    }
}