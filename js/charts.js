// 차트 관리 클래스
class ChartManager {
    // 일별 칼로리 수지 선그래프
    static renderCalorieBalanceChart() {
        const chartContainer = DOM.get('calorieBalanceChart');
        if (!chartContainer) return;

        // 최근 7일 데이터 준비
        const last7Days = ChartManager.getLast7DaysData();
        
        const chartData = last7Days.map(dayData => ({
            date: DateUtils.formatShortDate(dayData.date),
            섭취칼로리: dayData.foodCalories,
            소모칼로리: dayData.burnCalories,
            칼로리수지: dayData.foodCalories - dayData.burnCalories
        }));

        chartContainer.innerHTML = `
            <div style="width: 100%; height: 300px;">
                <canvas id="calorieBalanceCanvas"></canvas>
            </div>
        `;

        // Chart.js로 선그래프 생성
        const ctx = DOM.get('calorieBalanceCanvas').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [
                    {
                        label: '칼로리 수지',
                        data: chartData.map(d => d.칼로리수지),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '섭취 칼로리',
                        data: chartData.map(d => d.섭취칼로리),
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    },
                    {
                        label: '소모 칼로리',
                        data: chartData.map(d => d.소모칼로리),
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '최근 7일 칼로리 추이'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 하루 칼로리 구성 막대그래프
    static renderDailyCalorieComposition() {
        const chartContainer = DOM.get('dailyCompositionChart');
        if (!chartContainer) return;

        // 오늘 데이터 계산
        const breakfastCal = DOM.get('useDefaultBreakfast').checked ?
            MEAL_CALORIES.breakfast :
            ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
        const lunchCal = DOM.get('useDefaultLunch').checked ?
            MEAL_CALORIES.lunch[AppState.selectedLunchType] :
            ArrayUtils.sum(AppState.customLunchItems, 'calories');
        const dinnerCal = DOM.get('useDefaultDinner').checked ?
            MEAL_CALORIES.defaultDinner :
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');

        const workoutCal = ArrayUtils.sum(AppState.workouts, 'calories');
        const cardioCal = ArrayUtils.sum(AppState.cardioWorkouts, 'calories');
        const bmrCal = CalorieCalculator.calculateBMR();

        chartContainer.innerHTML = `
            <div style="width: 100%; height: 300px;">
                <canvas id="dailyCompositionCanvas"></canvas>
            </div>
        `;

        const ctx = DOM.get('dailyCompositionCanvas').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['섭취', '소모'],
                datasets: [
                    {
                        label: '아침',
                        data: [breakfastCal, 0],
                        backgroundColor: '#fbbf24'
                    },
                    {
                        label: '점심',
                        data: [lunchCal, 0],
                        backgroundColor: '#3b82f6'
                    },
                    {
                        label: '저녁',
                        data: [dinnerCal, 0],
                        backgroundColor: '#8b5cf6'
                    },
                    {
                        label: '기초대사',
                        data: [0, bmrCal],
                        backgroundColor: '#06b6d4'
                    },
                    {
                        label: '웨이트 운동',
                        data: [0, workoutCal],
                        backgroundColor: '#10b981'
                    },
                    {
                        label: '유산소 운동',
                        data: [0, cardioCal],
                        backgroundColor: '#f59e0b'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '오늘의 칼로리 구성'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 운동별 소모 칼로리 비교 막대그래프
    static renderWorkoutComparisonChart() {
        const chartContainer = DOM.get('workoutComparisonChart');
        if (!chartContainer) return;

        // 운동별 칼로리 집계
        const workoutStats = {};
        
        // 웨이트 운동별 집계
        AppState.workouts.forEach(workout => {
            const name = workout.exercise;
            if (!workoutStats[name]) {
                workoutStats[name] = { calories: 0, count: 0, type: '웨이트' };
            }
            workoutStats[name].calories += workout.calories;
            workoutStats[name].count++;
        });

        // 유산소 운동별 집계
        AppState.cardioWorkouts.forEach(cardio => {
            const name = cardio.type;
            if (!workoutStats[name]) {
                workoutStats[name] = { calories: 0, count: 0, type: '유산소' };
            }
            workoutStats[name].calories += cardio.calories;
            workoutStats[name].count++;
        });

        const sortedWorkouts = Object.entries(workoutStats)
            .sort(([,a], [,b]) => b.calories - a.calories)
            .slice(0, 8); // 상위 8개만 표시

        if (sortedWorkouts.length === 0) {
            chartContainer.innerHTML = '<div class="empty-state">운동 기록이 없습니다</div>';
            return;
        }

        chartContainer.innerHTML = `
            <div style="width: 100%; height: 300px;">
                <canvas id="workoutComparisonCanvas"></canvas>
            </div>
        `;

        const ctx = DOM.get('workoutComparisonCanvas').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedWorkouts.map(([name]) => name),
                datasets: [{
                    label: '소모 칼로리',
                    data: sortedWorkouts.map(([, stats]) => stats.calories),
                    backgroundColor: sortedWorkouts.map(([, stats]) => 
                        stats.type === '웨이트' ? '#6366f1' : '#10b981'
                    ),
                    borderColor: sortedWorkouts.map(([, stats]) => 
                        stats.type === '웨이트' ? '#4f46e5' : '#059669'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '운동별 소모 칼로리 (오늘)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 월별 운동 일수 트렌드 선그래프
    static renderMonthlyTrendChart() {
        const chartContainer = DOM.get('monthlyTrendChart');
        if (!chartContainer) return;

        // 월별 데이터가 있는 경우에만 표시
        if (!AppState.monthlyData || 
            AppState.monthlyData.workouts.length === 0 && 
            AppState.monthlyData.cardio.length === 0) {
            chartContainer.innerHTML = '<div class="empty-state">월간 데이터를 먼저 불러주세요</div>';
            return;
        }

        // 일별 운동 데이터 집계
        const dailyStats = ChartManager.calculateDailyStats();
        const sortedDates = Object.keys(dailyStats).sort();

        chartContainer.innerHTML = `
            <div style="width: 100%; height: 300px;">
                <canvas id="monthlyTrendCanvas"></canvas>
            </div>
        `;

        const ctx = DOM.get('monthlyTrendCanvas').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates.map(date => DateUtils.formatShortDate(date)),
                datasets: [
                    {
                        label: '칼로리 수지',
                        data: sortedDates.map(date => dailyStats[date].balance),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '운동 칼로리',
                        data: sortedDates.map(date => dailyStats[date].workoutCalories),
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '이번 달 운동 트렌드'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 최근 7일 데이터 생성 (현재 + 가상 데이터)
    static getLast7DaysData() {
        const today = new Date();
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            if (i === 0) {
                // 오늘 데이터는 실제 데이터 사용
                const breakfastCal = DOM.get('useDefaultBreakfast').checked ?
                    MEAL_CALORIES.breakfast :
                    ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
                const lunchCal = DOM.get('useDefaultLunch').checked ?
                    MEAL_CALORIES.lunch[AppState.selectedLunchType] :
                    ArrayUtils.sum(AppState.customLunchItems, 'calories');
                const dinnerCal = DOM.get('useDefaultDinner').checked ?
                    MEAL_CALORIES.defaultDinner :
                    ArrayUtils.sum(AppState.customDinnerItems, 'calories');

                const workoutCal = ArrayUtils.sum(AppState.workouts, 'calories');
                const cardioCal = ArrayUtils.sum(AppState.cardioWorkouts, 'calories');
                const bmrCal = CalorieCalculator.calculateBMR();

                data.push({
                    date: date,
                    foodCalories: breakfastCal + lunchCal + dinnerCal,
                    burnCalories: bmrCal + workoutCal + cardioCal
                });
            } else {
                // 과거 데이터는 임시 데이터 (실제로는 Supabase에서 가져와야 함)
                data.push({
                    date: date,
                    foodCalories: 900 + Math.random() * 200,
                    burnCalories: 2000 + Math.random() * 300
                });
            }
        }
        
        return data;
    }

    // 월별 일일 통계 계산
    static calculateDailyStats() {
        const dailyStats = {};

        // 운동 데이터 집계
        [...AppState.monthlyData.workouts, ...AppState.monthlyData.cardio].forEach(item => {
            const date = item.workout_date;
            if (!dailyStats[date]) {
                dailyStats[date] = { workoutCalories: 0, foodCalories: 0, balance: 0 };
            }
            dailyStats[date].workoutCalories += item.calories || 0;
        });

        // 식사 데이터 집계
        AppState.monthlyData.meals.forEach(meal => {
            const date = meal.meal_date;
            if (!dailyStats[date]) {
                dailyStats[date] = { workoutCalories: 0, foodCalories: 0, balance: 0 };
            }
            dailyStats[date].foodCalories += meal.total_calories || 0;
        });

        // 칼로리 수지 계산
        Object.keys(dailyStats).forEach(date => {
            const bmr = AppState.userWeight * 24;
            const totalBurn = bmr + dailyStats[date].workoutCalories;
            dailyStats[date].balance = dailyStats[date].foodCalories - totalBurn;
        });

        return dailyStats;
    }

    // 모든 차트 렌더링
    static renderAllCharts() {
        ChartManager.renderCalorieBalanceChart();
        ChartManager.renderDailyCalorieComposition();
        ChartManager.renderWorkoutComparisonChart();
        ChartManager.renderMonthlyTrendChart();
    }

// 차트 업데이트 (데이터 변경시 호출)
    static updateCharts() {
        // 약간의 지연을 두고 차트 업데이트 (DOM 업데이트 완료 후)
        setTimeout(() => {
            ChartManager.renderAllCharts();
        }, 100);
    }

    // 차트 전환 함수 (새로 추가)
    static switchChart(chartType) {
        // 모든 탭 버튼 비활성화
        DOM.getAll('[data-chart]').forEach(btn => {
            DOM.removeClass(btn, 'active');
        });
        
        // 선택된 탭 활성화
        const selectedBtn = document.querySelector(`[data-chart="${chartType}"]`);
        if (selectedBtn) {
            DOM.addClass(selectedBtn, 'active');
        }
        
        // 모든 차트 숨기기
        DOM.getAll('.chart-section').forEach(section => {
            DOM.addClass(section, 'hidden');
        });
        
        // 선택된 차트만 보이기
        let targetChartId;
        switch(chartType) {
            case 'balance':
                targetChartId = 'calorieBalanceChart';
                break;
            case 'composition':
                targetChartId = 'dailyCompositionChart';
                break;
            case 'workout':
                targetChartId = 'workoutComparisonChart';
                break;
            case 'trend':
                targetChartId = 'monthlyTrendChart';
                break;
        }
        
        const targetChart = DOM.get(targetChartId);
        if (targetChart) {
            DOM.removeClass(targetChart, 'hidden');
            // 해당 차트 렌더링
            ChartManager.renderSpecificChart(chartType);
        }
    }

    // 특정 차트만 렌더링
    static renderSpecificChart(chartType) {
        switch(chartType) {
            case 'balance':
                ChartManager.renderCalorieBalanceChart();
                break;
            case 'composition':
                ChartManager.renderDailyCalorieComposition();
                break;
            case 'workout':
                ChartManager.renderWorkoutComparisonChart();
                break;
            case 'trend':
                ChartManager.renderMonthlyTrendChart();
                break;
        }
    }
}

// 날짜 유틸리티 확장
DateUtils.formatShortDate = (date) => {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

