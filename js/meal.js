// 식사 관리 클래스
class MealManager {
    // 아침 메뉴 토글
    static toggleBreakfastMenu() {
        const useDefault = DOM.get('useDefaultBreakfast').checked;
        const defaultBreakfast = DOM.get('defaultBreakfast');
        const customBreakfast = DOM.get('customBreakfast');

        if (useDefault) {
            DOM.show(defaultBreakfast);
            DOM.hide(customBreakfast);
        } else {
            DOM.hide(defaultBreakfast);
            DOM.show(customBreakfast);
        }
    }

    // 점심 메뉴 토글
    static toggleLunchMenu() {
        const useDefault = DOM.get('useDefaultLunch').checked;
        const defaultLunch = DOM.get('defaultLunch');
        const customLunch = DOM.get('customLunch');

        if (useDefault) {
            DOM.show(defaultLunch);
            DOM.hide(customLunch);
        } else {
            DOM.hide(defaultLunch);
            DOM.show(customLunch);
        }
    }

    // 저녁 메뉴 토글
    static toggleDinnerMenu() {
        const useDefault = DOM.get('useDefaultDinner').checked;
        const defaultDinner = DOM.get('defaultDinner');
        const customDinner = DOM.get('customDinner');

        if (useDefault) {
            DOM.show(defaultDinner);
            DOM.hide(customDinner);
        } else {
            DOM.hide(defaultDinner);
            DOM.show(customDinner);
        }
    }

    // 커스텀 아침 음식 추가
    static addCustomBreakfast() {
        const name = DOM.getValue('newBreakfastName').trim();
        const calories = parseInt(DOM.getValue('newBreakfastCalories'));

        if (!name || !calories) return;

        const food = {
            id: Date.now(),
            name,
            calories
        };

        AppState.customBreakfastItems.push(food);
        MealManager.renderCustomBreakfast();

        // 폼 리셋
        DOM.setValue('newBreakfastName', '');
        DOM.setValue('newBreakfastCalories', '');
    }

    // 커스텀 점심 음식 추가
    static addCustomLunch() {
        const name = DOM.getValue('newLunchName').trim();
        const calories = parseInt(DOM.getValue('newLunchCalories'));

        if (!name || !calories) return;

        const food = {
            id: Date.now(),
            name,
            calories
        };

        AppState.customLunchItems.push(food);
        MealManager.renderCustomLunch();

        // 폼 리셋
        DOM.setValue('newLunchName', '');
        DOM.setValue('newLunchCalories', '');
    }

    // 커스텀 음식 추가
    static addCustomFood() {
        const name = DOM.getValue('newFoodName').trim();
        const calories = parseInt(DOM.getValue('newFoodCalories'));

        if (!name || !calories) return;

        const food = {
            id: Date.now(),
            name,
            calories
        };

        AppState.customDinnerItems.push(food);
        MealManager.renderCustomFoods();

        // 폼 리셋
        FormUtils.resetCustomFoodForm();
    }

    // 커스텀 아침 목록 렌더링
    static renderCustomBreakfast() {
        const container = DOM.get('customBreakfastItems');
        const listContainer = DOM.get('customBreakfastList');
        const emptyState = DOM.get('emptyCustomBreakfast');
        const totalElement = DOM.get('customBreakfastTotalCalories');

        if (AppState.customBreakfastItems.length === 0) {
            DOM.hide(listContainer);
            DOM.show(emptyState);
            return;
        }

        DOM.show(listContainer);
        DOM.hide(emptyState);
        container.innerHTML = '';

        let total = 0;
        AppState.customBreakfastItems.forEach(food => {
            total += food.calories;
            const div = document.createElement('div');
            div.className = 'custom-food-item';
            div.innerHTML = `
                <span>• ${food.name} - ${food.calories}kcal</span>
                <button class="btn btn-danger" onclick="MealManager.removeCustomBreakfast(${food.id})" style="padding: 2px 6px; font-size: 10px;">🗑️</button>
            `;
            container.appendChild(div);
        });

        DOM.setText('customBreakfastTotalCalories', total);
    }

    // 커스텀 점심 목록 렌더링
    static renderCustomLunch() {
        const container = DOM.get('customLunchItems');
        const listContainer = DOM.get('customLunchList');
        const emptyState = DOM.get('emptyCustomLunch');
        const totalElement = DOM.get('customLunchTotalCalories');

        if (AppState.customLunchItems.length === 0) {
            DOM.hide(listContainer);
            DOM.show(emptyState);
            return;
        }

        DOM.show(listContainer);
        DOM.hide(emptyState);
        container.innerHTML = '';

        let total = 0;
        AppState.customLunchItems.forEach(food => {
            total += food.calories;
            const div = document.createElement('div');
            div.className = 'custom-food-item';
            div.innerHTML = `
                <span>• ${food.name} - ${food.calories}kcal</span>
                <button class="btn btn-danger" onclick="MealManager.removeCustomLunch(${food.id})" style="padding: 2px 6px; font-size: 10px;">🗑️</button>
            `;
            container.appendChild(div);
        });

        DOM.setText('customLunchTotalCalories', total);
    }

    // 커스텀 음식 목록 렌더링
    static renderCustomFoods() {
        const container = DOM.get('customFoodItems');
        const listContainer = DOM.get('customFoodList');
        const emptyState = DOM.get('emptyCustomFood');
        const totalElement = DOM.get('customTotalCalories');

        if (AppState.customDinnerItems.length === 0) {
            DOM.hide(listContainer);
            DOM.hide(emptyState);
            return;
        }

        DOM.show(listContainer);
        DOM.hide(emptyState);
        container.innerHTML = '';

        let total = 0;
        AppState.customDinnerItems.forEach(food => {
            total += food.calories;
            const div = document.createElement('div');
            div.className = 'custom-food-item';
            div.innerHTML = `
                <span>• ${food.name} - ${food.calories}kcal</span>
                <button class="btn btn-danger" onclick="MealManager.removeCustomFood(${food.id})" style="padding: 2px 6px; font-size: 10px;">🗑️</button>
            `;
            container.appendChild(div);
        });

        DOM.setText('customTotalCalories', total);
    }

    // 커스텀 아침 음식 삭제
    static removeCustomBreakfast(id) {
        AppState.customBreakfastItems = ArrayUtils.removeById(AppState.customBreakfastItems, id);
        MealManager.renderCustomBreakfast();
        SummaryManager.updateSummary();
    }

    // 커스텀 점심 음식 삭제
    static removeCustomLunch(id) {
        AppState.customLunchItems = ArrayUtils.removeById(AppState.customLunchItems, id);
        MealManager.renderCustomLunch();
        SummaryManager.updateSummary();
    }

    // 커스텀 음식 삭제
    static removeCustomFood(id) {
        AppState.customDinnerItems = ArrayUtils.removeById(AppState.customDinnerItems, id);
        MealManager.renderCustomFoods();
        SummaryManager.updateSummary();
    }

    // 점심 타입 변경 함수 (수정된 버전 - 안정성 강화)
    static changeLunchType() {
        const selectedRadio = document.querySelector('input[name="lunchType"]:checked');
        
        if (selectedRadio) {
            AppState.selectedLunchType = selectedRadio.value;
        } else {
            // 만약 선택된 라디오 버튼이 없다면, 기본값으로 되돌림
            AppState.selectedLunchType = 'galbi'; 
        }
        
        const calories = MEAL_CALORIES.lunch[AppState.selectedLunchType] || 0;
        DOM.setText('selectedLunchCalories', calories);
        
        SummaryManager.updateSummary();
    }

    // 점심 칼로리 계산 함수 (수정된 버전)
    static getLunchCalories() {
        const useDefault = DOM.get('useDefaultLunch');
        if (useDefault && useDefault.checked) {
            // 실제 선택된 라디오 버튼의 값을 확인
            const selectedRadio = document.querySelector('input[name="lunchType"]:checked');
            if (selectedRadio) {
                return MEAL_CALORIES.lunch[selectedRadio.value] || MEAL_CALORIES.lunch.galbi;
            }
            return MEAL_CALORIES.lunch[AppState.selectedLunchType] || MEAL_CALORIES.lunch.galbi;
        } else {
            return ArrayUtils.sum(AppState.customLunchItems, 'calories');
        }
    }

    // 식사 데이터 초기화
    static resetMealData() {
        AppState.customBreakfastItems = [];
        AppState.customLunchItems = [];
        AppState.customDinnerItems = [];

        const useDefaultBreakfast = DOM.get('useDefaultBreakfast');
        const useDefaultLunch = DOM.get('useDefaultLunch');
        const useDefaultDinner = DOM.get('useDefaultDinner');

        if (useDefaultBreakfast) useDefaultBreakfast.checked = true;
        if (useDefaultLunch) useDefaultLunch.checked = true;
        if (useDefaultDinner) useDefaultDinner.checked = true;

        MealManager.toggleBreakfastMenu();
        MealManager.toggleLunchMenu();
        MealManager.toggleDinnerMenu();

        // 점심 라디오 버튼 초기화 (수정된 부분)
        AppState.selectedLunchType = 'galbi';
        const galbiRadio = document.querySelector('input[name="lunchType"][value="galbi"]');
        if (galbiRadio) {
            galbiRadio.checked = true;
        }
        const selectedLunchCaloriesElement = DOM.get('selectedLunchCalories');
        if (selectedLunchCaloriesElement) {
            DOM.setText('selectedLunchCalories', '480');
        }

        DOM.setValue('newBreakfastName', '');
        DOM.setValue('newBreakfastCalories', '');
        DOM.setValue('newLunchName', '');
        DOM.setValue('newLunchCalories', '');
        FormUtils.resetCustomFoodForm();

        MealManager.renderCustomBreakfast();
        MealManager.renderCustomLunch();
        MealManager.renderCustomFoods();
    }
}