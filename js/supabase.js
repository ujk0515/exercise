// Supabase 관리 클래스
class SupabaseManager {
    constructor() {
        this.client = window.supabase.createClient(
            SUPABASE_CONFIG.URL, 
            SUPABASE_CONFIG.ANON_KEY
        );
    }

    // 사용자 데이터 저장/업데이트
    async saveUser(weight) {
        try {
            const { error } = await this.client
                .from('users')
                .upsert({ 
                    id: SUPABASE_CONFIG.USER_ID,
                    weight: weight 
                }, { onConflict: 'id' });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('사용자 저장 오류:', error);
            return { success: false, error };
        }
    }

    // 웨이트 운동 저장
    async saveWorkouts(workouts, selectedDate) {
        if (workouts.length === 0) return { success: true };

        try {
            const workoutData = workouts.map(workout => ({
                user_id: SUPABASE_CONFIG.USER_ID,
                workout_date: selectedDate,
                category: workout.category,
                exercise_name: workout.exercise,
                total_weight: parseFloat(workout.totalWeight),
                reps: parseInt(workout.reps),
                sets: parseInt(workout.sets),
                calories: parseInt(workout.calories)
            }));

            const { error } = await this.client
                .from('workouts')
                .insert(workoutData);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('웨이트 운동 저장 오류:', error);
            return { success: false, error };
        }
    }

    // 유산소 운동 저장
    async saveCardio(cardioWorkouts, selectedDate) {
        if (cardioWorkouts.length === 0) return { success: true };

        try {
            const cardioData = cardioWorkouts.map(cardio => ({
                user_id: SUPABASE_CONFIG.USER_ID,
                workout_date: selectedDate,
                exercise_type: cardio.type,
                incline: parseInt(cardio.incline),
                speed: parseFloat(cardio.speed),
                duration: parseInt(cardio.duration),
                calories: parseInt(cardio.calories)
            }));

            const { error } = await this.client
                .from('cardio_workouts')
                .insert(cardioData);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('유산소 운동 저장 오류:', error);
            return { success: false, error };
        }
    }

    // 식사 데이터 저장
    async saveMeals(selectedDate, useDefaultBreakfast, useDefaultLunch, useDefaultDinner, customBreakfastItems, customLunchItems, customDinnerItems) {
        try {
            const breakfastCal = useDefaultBreakfast ? 
                MEAL_CALORIES.breakfast : 
                ArrayUtils.sum(customBreakfastItems, 'calories');
            const lunchCal = useDefaultLunch ? 
                MEAL_CALORIES.lunch : 
                ArrayUtils.sum(customLunchItems, 'calories');
            const dinnerCal = useDefaultDinner ? 
                MEAL_CALORIES.defaultDinner : 
                ArrayUtils.sum(customDinnerItems, 'calories');

            const mealData = [
                {
                    user_id: SUPABASE_CONFIG.USER_ID,
                    meal_date: selectedDate,
                    meal_type: 'breakfast',
                    is_custom: !useDefaultBreakfast,
                    total_calories: breakfastCal,
                    menu_items: useDefaultBreakfast ? 
                        '단백질 쉐이크 1잔, 에사비 콤부차 1잔' : 
                        customBreakfastItems.map(f => f.name).join(', ')
                },
                {
                    user_id: SUPABASE_CONFIG.USER_ID,
                    meal_date: selectedDate,
                    meal_type: 'lunch',
                    is_custom: !useDefaultLunch,
                    total_calories: lunchCal,
                    menu_items: useDefaultLunch ? 
                        '펜네 스파게티 100g, 저당 소스, 작은 소시지 4개' : 
                        customLunchItems.map(f => f.name).join(', ')
                },
                {
                    user_id: SUPABASE_CONFIG.USER_ID,
                    meal_date: selectedDate,
                    meal_type: 'dinner',
                    is_custom: !useDefaultDinner,
                    total_calories: dinnerCal,
                    menu_items: useDefaultDinner ? 
                        '쌀밥 150g, 작은 소시지 4개' : 
                        customDinnerItems.map(f => f.name).join(', ')
                }
            ];

            const { error } = await this.client
                .from('meals')
                .insert(mealData);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('식사 데이터 저장 오류:', error);
            return { success: false, error };
        }
    }

    // 기존 데이터 삭제 (중복 방지)
    async deleteExistingData(selectedDate) {
        try {
            const deletePromises = [
                this.client.from('workouts').delete()
                    .eq('user_id', SUPABASE_CONFIG.USER_ID)
                    .eq('workout_date', selectedDate),
                this.client.from('cardio_workouts').delete()
                    .eq('user_id', SUPABASE_CONFIG.USER_ID)
                    .eq('workout_date', selectedDate),
                this.client.from('meals').delete()
                    .eq('user_id', SUPABASE_CONFIG.USER_ID)
                    .eq('meal_date', selectedDate)
            ];

            await Promise.all(deletePromises);
            return { success: true };
        } catch (error) {
            console.error('기존 데이터 삭제 오류:', error);
            return { success: false, error };
        }
    }

    // 전체 데이터 저장
    async saveAllData(selectedDate, workouts, cardioWorkouts, useDefaultBreakfast, useDefaultLunch, useDefaultDinner, customBreakfastItems, customLunchItems, customDinnerItems, userWeight) {
        const saveBtn = DOM.get('saveToSupabase');
        
        try {
            saveBtn.textContent = '💾 저장 중...';
            saveBtn.disabled = true;

            // 1. 기존 데이터 삭제
            const deleteResult = await this.deleteExistingData(selectedDate);
            if (!deleteResult.success) throw deleteResult.error;

            // 2. 사용자 정보 저장
            const userResult = await this.saveUser(userWeight);
            if (!userResult.success) throw userResult.error;

            // 3. 웨이트 운동 저장
            const workoutResult = await this.saveWorkouts(workouts, selectedDate);
            if (!workoutResult.success) throw workoutResult.error;

            // 4. 유산소 운동 저장
            const cardioResult = await this.saveCardio(cardioWorkouts, selectedDate);
            if (!cardioResult.success) throw cardioResult.error;

            // 5. 식사 데이터 저장
            const mealResult = await this.saveMeals(selectedDate, useDefaultBreakfast, useDefaultLunch, useDefaultDinner, customBreakfastItems, customLunchItems, customDinnerItems);
            if (!mealResult.success) throw mealResult.error;

            NotificationUtils.alert(
                `${selectedDate} 데이터가 성공적으로 저장되었습니다!\n웨이트: ${workouts.length}개, 유산소: ${cardioWorkouts.length}개`
            );

        } catch (error) {
            console.error('저장 오류:', error);
            NotificationUtils.alert('저장 실패: ' + error.message);
        } finally {
            saveBtn.textContent = '💾 Supabase 저장';
            saveBtn.disabled = false;
        }
    }

    // 월별 데이터 조회
    async loadMonthlyData(year, month) {
        try {
            const { startDate, endDate } = DateUtils.getMonthRange(year, month);
            
            console.log('조회 기간:', startDate, '~', endDate);
            
            // 웨이트 운동 조회
            const { data: workoutsData, error: workoutsError } = await this.client
                .from('workouts')
                .select('*')
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .gte('workout_date', startDate)
                .lte('workout_date', endDate)
                .order('workout_date', { ascending: true });
            
            if (workoutsError) throw workoutsError;
            
            // 유산소 운동 조회
            const { data: cardioData, error: cardioError } = await this.client
                .from('cardio_workouts')
                .select('*')
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .gte('workout_date', startDate)
                .lte('workout_date', endDate)
                .order('workout_date', { ascending: true });
            
            if (cardioError) throw cardioError;
            
            // 식사 데이터 조회
            const { data: mealsData, error: mealsError } = await this.client
                .from('meals')
                .select('*')
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .gte('meal_date', startDate)
                .lte('meal_date', endDate)
                .order('meal_date', { ascending: true });
            
            if (mealsError) throw mealsError;
            
            console.log('조회 결과:', {
                workouts: workoutsData?.length || 0,
                cardio: cardioData?.length || 0,
                meals: mealsData?.length || 0
            });
            
            return {
                success: true,
                data: {
                    workouts: workoutsData || [],
                    cardio: cardioData || [],
                    meals: mealsData || []
                }
            };
        } catch (error) {
            console.error('월별 데이터 조회 오류:', error);
            return { success: false, error };
        }
    }
}

// 전역 Supabase 매니저 인스턴스
const supabaseManager = new SupabaseManager();