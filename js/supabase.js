// Supabase 관리 클래스 (기존 방식 유지 + 개별 저장 기능 추가)
class SupabaseManager {
    constructor() {
        // 🔄 기존 방식으로 되돌림 (Edge Function 사용 안함)
        this.client = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
    }

    // === 새로 추가된 개별 저장 함수들 ===

    // 웨이트 운동만 저장
    async saveWorkoutsOnly() {
        const selectedDate = DOM.getValue('selectedDate');
        
        try {
            // 기존 웨이트 운동 데이터 삭제
            const { error: deleteError } = await this.client
                .from('workouts')
                .delete()
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .eq('workout_date', selectedDate);

            if (deleteError) throw deleteError;

            // 새 데이터 삽입 (있는 경우에만)
            if (AppState.workouts && AppState.workouts.length > 0) {
                const workoutData = AppState.workouts.map(workout => ({
                    user_id: SUPABASE_CONFIG.USER_ID,
                    workout_date: selectedDate,
                    category: workout.category,
                    exercise_name: workout.exercise,
                    total_weight: parseFloat(workout.totalWeight),
                    reps: parseInt(workout.reps),
                    sets: parseInt(workout.sets),
                    calories: parseInt(workout.calories)
                }));

                const { error: insertError } = await this.client
                    .from('workouts')
                    .insert(workoutData);

                if (insertError) throw insertError;
            }

            NotificationUtils.showSuccessPopup('웨이트 운동이 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('웨이트 운동 저장 오류:', error);
            NotificationUtils.alert('웨이트 운동 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // 유산소 운동만 저장
    async saveCardioOnly() {
        const selectedDate = DOM.getValue('selectedDate');
        
        try {
            // 기존 유산소 운동 데이터 삭제
            const { error: deleteError } = await this.client
                .from('cardio_workouts')
                .delete()
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .eq('workout_date', selectedDate);

            if (deleteError) throw deleteError;

            // 새 데이터 삽입 (있는 경우에만)
            if (AppState.cardioWorkouts && AppState.cardioWorkouts.length > 0) {
                const cardioData = AppState.cardioWorkouts.map(cardio => ({
                    user_id: SUPABASE_CONFIG.USER_ID,
                    workout_date: selectedDate,
                    exercise_type: cardio.type,
                    incline: cardio.incline || null,
                    speed: cardio.speed || null,
                    intensity: cardio.intensity || null,
                    rpm: cardio.rpm || null,
                    duration: parseInt(cardio.duration),
                    calories: parseInt(cardio.calories)
                }));

                const { error: insertError } = await this.client
                    .from('cardio_workouts')
                    .insert(cardioData);

                if (insertError) throw insertError;
            }

            NotificationUtils.showSuccessPopup('유산소 운동이 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('유산소 운동 저장 오류:', error);
            NotificationUtils.alert('유산소 운동 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // 아침 식사만 저장
    async saveBreakfastOnly() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefault = DOM.get('useDefaultBreakfast').checked;
        
        const totalCalories = useDefault ? 
            MEAL_CALORIES.breakfast : 
            ArrayUtils.sum(AppState.customBreakfastItems, 'calories');
        
        const menuItems = useDefault ? 
            '단백질 쉐이크 1잔, 에사비 콤부차 1잔' : 
            AppState.customBreakfastItems.map(f => f.name).join(', ');

        try {
            // 기존 아침 데이터 삭제
            const { error: deleteError } = await this.client
                .from('meals')
                .delete()
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .eq('meal_date', selectedDate)
                .eq('meal_type', 'breakfast');

            if (deleteError) throw deleteError;

            // 새 데이터 삽입
            const mealData = {
                user_id: SUPABASE_CONFIG.USER_ID,
                meal_date: selectedDate,
                meal_type: 'breakfast',
                is_custom: !useDefault,
                total_calories: totalCalories,
                menu_items: menuItems
            };

            const { error: insertError } = await this.client
                .from('meals')
                .insert([mealData]);

            if (insertError) throw insertError;

            NotificationUtils.showSuccessPopup('아침 식사가 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('아침 식사 저장 오류:', error);
            NotificationUtils.alert('아침 식사 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // 점심 식사만 저장
    async saveLunchOnly() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefault = DOM.get('useDefaultLunch').checked;
        
        const totalCalories = useDefault ? 
            MEAL_CALORIES.lunch[AppState.selectedLunchType] : 
            ArrayUtils.sum(AppState.customLunchItems, 'calories');
        
        const menuItems = useDefault ? 
            `파이어트 볶음밥 ${AppState.selectedLunchType === 'galbi' ? '숯불갈비맛' : 
                AppState.selectedLunchType === 'kakdugi' ? '매콤깍두기' : '간장계란'}` : 
            AppState.customLunchItems.map(f => f.name).join(', ');

        try {
            // 기존 점심 데이터 삭제
            const { error: deleteError } = await this.client
                .from('meals')
                .delete()
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .eq('meal_date', selectedDate)
                .eq('meal_type', 'lunch');

            if (deleteError) throw deleteError;

            // 새 데이터 삽입
            const mealData = {
                user_id: SUPABASE_CONFIG.USER_ID,
                meal_date: selectedDate,
                meal_type: 'lunch',
                is_custom: !useDefault,
                total_calories: totalCalories,
                menu_items: menuItems
            };

            const { error: insertError } = await this.client
                .from('meals')
                .insert([mealData]);

            if (insertError) throw insertError;

            NotificationUtils.showSuccessPopup('점심 식사가 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('점심 식사 저장 오류:', error);
            NotificationUtils.alert('점심 식사 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // 저녁 식사만 저장
    async saveDinnerOnly() {
        const selectedDate = DOM.getValue('selectedDate');
        const useDefault = DOM.get('useDefaultDinner').checked;
        
        const totalCalories = useDefault ? 
            MEAL_CALORIES.defaultDinner : 
            ArrayUtils.sum(AppState.customDinnerItems, 'calories');
        
        const menuItems = useDefault ? 
            '쌀밥 150g, 작은 소시지 4개' : 
            AppState.customDinnerItems.map(f => f.name).join(', ');

        try {
            // 기존 저녁 데이터 삭제
            const { error: deleteError } = await this.client
                .from('meals')
                .delete()
                .eq('user_id', SUPABASE_CONFIG.USER_ID)
                .eq('meal_date', selectedDate)
                .eq('meal_type', 'dinner');

            if (deleteError) throw deleteError;

            // 새 데이터 삽입
            const mealData = {
                user_id: SUPABASE_CONFIG.USER_ID,
                meal_date: selectedDate,
                meal_type: 'dinner',
                is_custom: !useDefault,
                total_calories: totalCalories,
                menu_items: menuItems
            };

            const { error: insertError } = await this.client
                .from('meals')
                .insert([mealData]);

            if (insertError) throw insertError;

            NotificationUtils.showSuccessPopup('저녁 식사가 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('저녁 식사 저장 오류:', error);
            NotificationUtils.alert('저녁 식사 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // 사용자 정보만 저장
    async saveUserInfoOnly() {
        try {
            const { error } = await this.client
                .from('users')
                .upsert({
                    id: SUPABASE_CONFIG.USER_ID,
                    weight: AppState.userWeight
                }, { onConflict: 'id' });

            if (error) throw error;

            NotificationUtils.showSuccessPopup('사용자 정보가 저장되었습니다!');
            return { success: true };
        } catch (error) {
            console.error('사용자 정보 저장 오류:', error);
            NotificationUtils.alert('사용자 정보 저장 실패: ' + error.message);
            return { success: false, error };
        }
    }

    // === 기존 함수들 (그대로 유지) ===

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
                incline: cardio.incline || null,
                speed: cardio.speed || null,
                intensity: cardio.intensity || null,
                rpm: cardio.rpm || null,
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
                MEAL_CALORIES.lunch[AppState.selectedLunchType] :
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
                        `파이어트 볶음밥 ${AppState.selectedLunchType === 'galbi' ? '숯불갈비맛' : 
                            AppState.selectedLunchType === 'kakdugi' ? '매콤깍두기' : '간장계란'}` :
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

            NotificationUtils.showSuccessPopup(
                `✅ ${selectedDate} 데이터가 성공적으로 저장되었습니다!`
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

    // 연간 데이터 조회
    async loadYearlyData(year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            console.log('연간 조회 기간:', startDate, '~', endDate);

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

            console.log('연간 조회 결과:', {
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
            console.error('연간 데이터 조회 오류:', error);
            return { success: false, error };
        }
    }

    // 특정 날짜 데이터 삭제
    async deleteDataByDate(selectedDate) {
        try {
            console.log(`${selectedDate} 데이터 삭제 시작...`);

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

            const results = await Promise.all(deletePromises);
            
            // 에러 확인
            results.forEach(result => {
                if (result.error) throw result.error;
            });

            console.log(`${selectedDate} 데이터 삭제 완료`);
            return { success: true };
        } catch (error) {
            console.error('데이터 삭제 오류:', error);
            return { success: false, error };
        }
    }
}

// 전역 Supabase 매니저 인스턴스
const supabaseManager = new SupabaseManager();