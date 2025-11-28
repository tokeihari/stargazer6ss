// 選択された勤務日を格納（時刻情報付き）
let selectedWorkDays = [];

// 勤務日クラス（時刻情報付き）
class WorkDayWithTime {
  constructor(year, month, day, startHour = null, startMinute = null, endHour = null, endMinute = null) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.startHour = startHour;
    this.startMinute = startMinute;
    this.endHour = endHour;
    this.endMinute = endMinute;
  }
  
  get isTimeSet() {
    return this.startHour !== null && this.startMinute !== null && 
           this.endHour !== null && this.endMinute !== null;
  }
  
  get timeDisplay() {
    if (!this.isTimeSet) return '';
    return `${String(this.startHour).padStart(2, '0')}:${String(this.startMinute).padStart(2, '0')}-${String(this.endHour).padStart(2, '0')}:${String(this.endMinute).padStart(2, '0')}`;
  }
  
  get dateKey() {
    return `${this.year}-${this.month}-${this.day}`;
  }
}

// 現在の給与計算期間を取得（n月給与 = n-1月16日〜n月15日）
function getPayrollPeriod(targetYear, targetMonth) {
  const startYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const startMonth = targetMonth === 1 ? 12 : targetMonth - 1;
  const startDay = 16;
  
  const endYear = targetYear;
  const endMonth = targetMonth;
  const endDay = 15;
  
  return {
    start: { year: startYear, month: startMonth, day: startDay },
    end: { year: endYear, month: endMonth, day: endDay }
  };
}

// ページ読み込み時に年・月のオプションを設定
document.addEventListener('DOMContentLoaded', function() {
  populateYearOptions();
  populateMonthOptions();
});

// 年のオプションを生成
function populateYearOptions() {
  const yearSelect = document.getElementById('targetYear');
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = `${year}年`;
    if (year === currentYear) {
      option.selected = true;
    }
    yearSelect.appendChild(option);
  }
}

// 月のオプションを生成
function populateMonthOptions() {
  const monthSelect = document.getElementById('targetMonth');
  
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = `${month}月`;
    monthSelect.appendChild(option);
  }
  
  // 現在の月を選択
  const currentMonth = new Date().getMonth() + 1;
  monthSelect.value = currentMonth;
}

// カレンダーを生成
function generateCalendar() {
  const year = parseInt(document.getElementById('targetYear').value);
  const month = parseInt(document.getElementById('targetMonth').value);
  
  if (!year || !month) {
    alert('年と月を選択してください');
    return;
  }
  
  selectedWorkDays = [];
  
  const calendarContainer = document.getElementById('calendarContainer');
  const calendarHeader = document.getElementById('calendarHeader');
  const calendar = document.getElementById('calendar');
  
  // 給与計算期間を表示
  const payrollPeriod = getPayrollPeriod(year, month);
  calendarHeader.innerHTML = `
    <div>${year}年${month}月給与</div>
    <div style="font-size: 14px; color: #888; margin-top: 5px;">
      対象期間: ${payrollPeriod.start.year}/${payrollPeriod.start.month}/${payrollPeriod.start.day} 〜 ${payrollPeriod.end.year}/${payrollPeriod.end.month}/${payrollPeriod.end.day}
    </div>
  `;
  calendarContainer.style.display = 'block';
  
  // カレンダーをクリア
  calendar.innerHTML = '';
  
  // 曜日ヘッダー
  const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
  dayHeaders.forEach((day, index) => {
    const dayElement = document.createElement('div');
    dayElement.textContent = day;
    dayElement.className = `day-header ${index === 0 ? 'weekend' : ''} ${index === 6 ? 'saturday' : ''}`;
    calendar.appendChild(dayElement);
  });
  
  // 給与期間のカレンダーを生成
  generatePayrollCalendar(calendar, payrollPeriod);
  
  // 計算ボタンの表示制御
  updateCalculateButton();
  
  // カレンダースクリーンショットボタンを表示
  const calendarScreenshotBtn = document.getElementById('calendarScreenshotBtn');
  if (calendarScreenshotBtn) {
    calendarScreenshotBtn.style.display = 'inline-block';
  }
}

// 給与期間のカレンダー生成
function generatePayrollCalendar(calendar, payrollPeriod) {
  const startDate = new Date(payrollPeriod.start.year, payrollPeriod.start.month - 1, payrollPeriod.start.day);
  const endDate = new Date(payrollPeriod.end.year, payrollPeriod.end.month - 1, payrollPeriod.end.day);
  
  // 開始日の週の最初から表示するため調整
  const calendarStart = new Date(startDate);
  calendarStart.setDate(startDate.getDate() - startDate.getDay());
  
  // 終了日の週の最後まで表示するため調整
  const calendarEnd = new Date(endDate);
  calendarEnd.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const currentDate = new Date(calendarStart);
  
  while (currentDate <= calendarEnd) {
    const dayElement = document.createElement('div');
    const isInPeriod = currentDate >= startDate && currentDate <= endDate;
    const dayOfWeek = currentDate.getDay();
    
    dayElement.textContent = currentDate.getDate();
    dayElement.className = 'calendar-day';
    
    if (!isInPeriod) {
      dayElement.className += ' other-month';
    } else {
      // 土日の色分け
      if (dayOfWeek === 0) {
        dayElement.className += ' weekend';
      } else if (dayOfWeek === 6) {
        dayElement.className += ' saturday';
      }
      
      // 給与期間内の日付にクリックイベント
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      
      dayElement.addEventListener('click', () => openTimeModal(year, month, day, dayElement));
    }
    
    calendar.appendChild(dayElement);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

// 時刻入力モーダルを開く
function openTimeModal(year, month, day, dayElement) {
  // 既存の勤務日を検索
  const existingWorkDay = selectedWorkDays.find(wd => 
    wd.year === year && wd.month === month && wd.day === day
  );
  
  const modalHTML = `
    <div id="timeModal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; 
      justify-content: center; z-index: 1000;">
      <div style="
        background: white; padding: 30px; border-radius: 16px; 
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); max-width: 400px; width: 90%;">
        <h3 style="margin: 0 0 20px 0; text-align: center; color: #6b5b73;">
          ${year}年${month}月${day}日の勤務時間
        </h3>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 10px; font-weight: 500;">開始時刻:</label>
          <div style="display: flex; gap: 10px;">
            <select id="modalStartHour" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">
              ${generateHourOptions(existingWorkDay?.startHour)}
            </select>
            <span style="align-self: center;">:</span>
            <select id="modalStartMinute" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">
              ${generateMinuteOptions(existingWorkDay?.startMinute)}
            </select>
          </div>
        </div>
        <div style="margin-bottom: 30px;">
          <label style="display: block; margin-bottom: 10px; font-weight: 500;">終了時刻:</label>
          <div style="display: flex; gap: 10px;">
            <select id="modalEndHour" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">
              ${generateHourOptions(existingWorkDay?.endHour)}
            </select>
            <span style="align-self: center;">:</span>
            <select id="modalEndMinute" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">
              ${generateMinuteOptions(existingWorkDay?.endMinute)}
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="saveWorkTime(${year}, ${month}, ${day})" style="
            background: linear-gradient(135deg, #00b894, #00a085); 
            color: white; padding: 12px 24px; border: none; border-radius: 8px; 
            cursor: pointer; font-weight: 500; font-family: 'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', sans-serif;">
            保存
          </button>
          <button onclick="removeWorkDay(${year}, ${month}, ${day})" style="
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
            color: white; padding: 12px 24px; border: none; border-radius: 8px; 
            cursor: pointer; font-weight: 500; font-family: 'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', sans-serif;">
            削除
          </button>
          <button onclick="closeTimeModal()" style="
            background: linear-gradient(135deg, #95a5a6, #7f8c8d); color: white; padding: 12px 24px; border: none; 
            border-radius: 8px; cursor: pointer; font-weight: 500; font-family: 'Segoe UI', 'Yu Gothic UI', 'Meiryo UI', sans-serif;">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 時間オプション生成
function generateHourOptions(selectedHour = null) {
  let options = '<option value="">時</option>';
  for (let i = 0; i <= 23; i++) {
    const selected = selectedHour === i ? ' selected' : '';
    options += `<option value="${i}"${selected}>${i}時</option>`;
  }
  return options;
}

// 分オプション生成
function generateMinuteOptions(selectedMinute = null) {
  let options = '<option value="">分</option>';
  for (let i = 0; i < 60; i += 15) {
    const selected = selectedMinute === i ? ' selected' : '';
    options += `<option value="${i}"${selected}>${i}分</option>`;
  }
  return options;
}

// 勤務時間を保存
function saveWorkTime(year, month, day) {
  const startHour = parseInt(document.getElementById('modalStartHour').value);
  const startMinute = parseInt(document.getElementById('modalStartMinute').value);
  const endHour = parseInt(document.getElementById('modalEndHour').value);
  const endMinute = parseInt(document.getElementById('modalEndMinute').value);
  
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    alert('全ての時間を入力してください');
    return;
  }
  
  // 既存の勤務日を削除
  selectedWorkDays = selectedWorkDays.filter(wd => 
    !(wd.year === year && wd.month === month && wd.day === day)
  );
  
  // 新しい勤務日を追加
  const workDay = new WorkDayWithTime(year, month, day, startHour, startMinute, endHour, endMinute);
  selectedWorkDays.push(workDay);
  
  // カレンダーの表示を更新
  updateCalendarDisplay();
  
  // モーダルを閉じる
  closeTimeModal();
  
  // 計算ボタンの表示制御
  updateCalculateButton();
}

// 勤務日を削除
function removeWorkDay(year, month, day) {
  selectedWorkDays = selectedWorkDays.filter(wd => 
    !(wd.year === year && wd.month === month && wd.day === day)
  );
  
  updateCalendarDisplay();
  closeTimeModal();
  updateCalculateButton();
}

// モーダルを閉じる
function closeTimeModal() {
  const modal = document.getElementById('timeModal');
  if (modal) {
    modal.remove();
  }
}

// カレンダー表示を更新
function updateCalendarDisplay() {
  const calendar = document.getElementById('calendar');
  const dayElements = calendar.querySelectorAll('.calendar-day:not(.day-header)');
  
  dayElements.forEach(element => {
    element.classList.remove('selected');
    
    // 時間表示をクリア
    const timeDisplay = element.querySelector('.time-display');
    if (timeDisplay) {
      timeDisplay.remove();
    }
  });
  
  // 選択された勤務日を表示
  selectedWorkDays.forEach(workDay => {
    const dayElement = Array.from(dayElements).find(el => {
      const dayText = parseInt(el.textContent);
      return dayText === workDay.day && !el.classList.contains('other-month');
    });
    
    if (dayElement && workDay.isTimeSet) {
      dayElement.classList.add('selected');
      
      // 時間表示を追加
      const timeDiv = document.createElement('div');
      timeDiv.className = 'time-display';
      timeDiv.style.cssText = `
        font-size: 10px; 
        background: rgba(255, 255, 255, 0.9); 
        padding: 2px 4px; 
        border-radius: 4px; 
        margin-top: 2px; 
        line-height: 1.2;
      `;
      timeDiv.textContent = workDay.timeDisplay;
      dayElement.appendChild(timeDiv);
    }
  });
}

// 計算ボタンの表示制御
function updateCalculateButton() {
  const calculateBtn = document.getElementById('calculateBtn');
  const hasWorkDays = selectedWorkDays.some(wd => wd.isTimeSet);
  
  if (hasWorkDays) {
    calculateBtn.style.display = 'block';
    calculateBtn.textContent = `給与を計算 (${selectedWorkDays.length}日)`;
  } else {
    calculateBtn.style.display = 'none';
  }
}

// 計算ボタンの表示制御
function updateCalculateButton() {
  const calculateBtn = document.getElementById('calculateBtn');
  const hasWorkDays = selectedWorkDays.some(wd => wd.isTimeSet);
  
  if (hasWorkDays) {
    calculateBtn.style.display = 'block';
    calculateBtn.textContent = `給与を計算 (${selectedWorkDays.length}日)`;
  } else {
    calculateBtn.style.display = 'none';
  }
}

// 給与内訳の構造
class PayBreakdown {
  constructor(baseWage = 0, nightAllowance = 0, earlyAllowance = 0, overtimeAllowance = 0, 
              mealAllowance = 0, transportation = 700,
              baseMinutes = 0, nightMinutes = 0, earlyMinutes = 0, overtimeMinutes = 0) {
    this.baseWage = baseWage;
    this.nightAllowance = nightAllowance;
    this.earlyAllowance = earlyAllowance;
    this.overtimeAllowance = overtimeAllowance;
    this.mealAllowance = mealAllowance;
    this.transportation = transportation;
    // 時間（分）の内訳を追加
    this.baseMinutes = baseMinutes;
    this.nightMinutes = nightMinutes;
    this.earlyMinutes = earlyMinutes;
    this.overtimeMinutes = overtimeMinutes;
  }
}

// 勤務日クラス（従来形式との互換性用）
class WorkDay {
  constructor(month, day, startHour, startMinute, endHour, endMinute) {
    this.month = month;
    this.day = day;
    this.startHour = startHour;
    this.startMinute = startMinute;
    this.endHour = endHour;
    this.endMinute = endMinute;
  }
}

// 時間を分に変換
function timeToMinutes(hour, minute) {
  return hour * 60 + minute;
}

// 実働時間を計算（休憩時間を除く）
function calculateWorkingMinutes(startMinutes, endMinutes) {
  const totalMinutes = endMinutes - startMinutes;
  let breakMinutes = 0;
  
  if (totalMinutes > 270 && totalMinutes <= 390) {  // 4時間超え、6時間以下
    breakMinutes = 30;
  } else if (totalMinutes > 390 && totalMinutes <= 525) {  // 6時間超え、8時間以下
    breakMinutes = 45;
  } else if (totalMinutes > 525) {  // 8時間超え
    breakMinutes = 60;
  }
  
  return totalMinutes - breakMinutes;
}

// 食事手当を計算
function calculateMealAllowance(workingMinutes, month, day) {
  const workingHours = workingMinutes / 60.0;
  
  // 年末年始判定（12/31-1/3）
  const isYearEnd = (month === 12 && day === 31) || (month === 1 && day <= 3);
  
  if (isYearEnd) {
    if (workingHours >= 4) {
      const extraHours = Math.max(0, Math.floor(workingHours - 4));
      return 1600 + extraHours * 400;
    }
  } else {
    if (workingHours >= 8) {
      return 300;
    } else if (workingHours >= 4) {
      return 150;
    }
  }
  
  return 0;
}

// 詳細な賃金計算
function calculateDetailedPay(hourlyWage, startMinutes, endMinutes, workingMinutes, month, day) {
  let totalMinutes = endMinutes - startMinutes;
  
  // 休憩時間を差し引く
  if (workingMinutes >= 6 * 60) {
    totalMinutes -= 60; // 1時間休憩
  }
  
  // 各時間帯の分数を追跡
  let baseMinutes = 0;
  let nightMinutes = 0;
  let earlyMinutes = 0;
  
  let currentMinutes = startMinutes;
  while (currentMinutes < endMinutes) {
    if (workingMinutes >= 6 * 60 && 
        currentMinutes >= startMinutes + 3 * 60 && 
        currentMinutes < startMinutes + 4 * 60) {
      // 休憩時間はスキップ
      currentMinutes++;
      continue;
    }
    
    let hour = Math.floor(currentMinutes / 60) % 24;
    
    if (hour >= 22 || hour < 5) {
      nightMinutes++;
    } else if (hour >= 5 && hour < 8) {
      earlyMinutes++;
    } else {
      // 8:00-22:00は基本時間（日勤+時間外含む）
      baseMinutes++;
    }
    
    currentMinutes++;
  }
  
  // 時間外労働は実働8時間超の分（時間帯に関係なく）
  const regularMinutes = Math.min(workingMinutes, 8 * 60);  // 8時間まで
  const overtimeMinutes = Math.max(0, workingMinutes - 8 * 60);  // 8時間超過分
  
  // 各手当を計算（目安として）
  const baseWage = Math.ceil((regularMinutes / 60) * hourlyWage);
  
  // 深夜勤務手当の詳細計算（個別計算用 - 表示のみ）
  const nightHours = nightMinutes / 60;
  const nightRate = hourlyWage * 0.46;
  const nightCalculation = Math.round((nightHours * nightRate) * 100) / 100; // 精度向上
  const nightAllowance = nightCalculation; // 切り上げは総計算で実施
  
  const earlyAllowance = Math.ceil((earlyMinutes / 60) * (hourlyWage * 0.25));
  const overtimeAllowance = Math.ceil((overtimeMinutes / 60) * (hourlyWage * 1.25));
  
  const transportation = 700; // 1日あたり700円
  let mealAllowance = 0;
  
  // 食事手当: 実働4時間以上で150円、8時間以上で300円
  if (workingMinutes >= 8 * 60) {
    mealAllowance = 300;  // 8時間以上
  } else if (workingMinutes >= 4 * 60) {
    mealAllowance = 150;  // 4時間以上8時間未満
  }
  
  return new PayBreakdown(
    baseWage, nightAllowance, earlyAllowance, 
    overtimeAllowance, mealAllowance, transportation,
    regularMinutes, nightMinutes, earlyMinutes, overtimeMinutes  // 時間（分）も返す
  );
}

// 求職受付手数料を計算
function calculateJobFee(workDaysInMonth) {
  if (workDaysInMonth >= 3) {
    return 2130;  // 3日以上は一律
  } else {
    return workDaysInMonth * 710;  // 3日未満は日数×710円
  }
}

// 月の日数を取得
function getDaysInMonth(month) {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1];
}

// 月のプルダウンを生成
function createMonthSelect(id) {
  let options = '<option value="">月</option>';
  for (let i = 1; i <= 12; i++) {
    options += `<option value="${i}">${i}月</option>`;
  }
  return `<select id="${id}" onchange="updateDayOptions('${id}')">${options}</select>`;
}

// 日のプルダウンを生成
function createDaySelect(id) {
  return `<select id="${id}"><option value="">日</option></select>`;
}

// 時のプルダウンを生成
function createHourSelect(id) {
  let options = '<option value="">時</option>';
  for (let i = 0; i <= 24; i++) {
    options += `<option value="${i}">${String(i).padStart(2, '0')}</option>`;
  }
  return `<select id="${id}">${options}</select>`;
}

// 分のプルダウンを生成
function createMinuteSelect(id) {
  let options = '<option value="">分</option>';
  const minutes = [0, 15, 30, 45];
  for (let minute of minutes) {
    options += `<option value="${minute}">${String(minute).padStart(2, '0')}</option>`;
  }
  return `<select id="${id}">${options}</select>`;
}

// 日の選択肢を更新
function updateDayOptions(monthSelectId) {
  const monthSelect = document.getElementById(monthSelectId);
  const daySelectId = monthSelectId.replace('month', 'day');
  const daySelect = document.getElementById(daySelectId);
  
  const selectedMonth = parseInt(monthSelect.value);
  
  if (!selectedMonth) {
    daySelect.innerHTML = '<option value="">日</option>';
    return;
  }
  
  const daysInMonth = getDaysInMonth(selectedMonth);
  let options = '<option value="">日</option>';
  
  for (let i = 1; i <= daysInMonth; i++) {
    options += `<option value="${i}">${i}日</option>`;
  }
  
  daySelect.innerHTML = options;
}

// 勤務日入力フォームを生成
function generateWorkDayInputs() {
  const totalWorkDays = parseInt(document.getElementById('totalWorkDays').value);
  
  if (!totalWorkDays || totalWorkDays <= 0) {
    alert('総勤務回数を正しく入力してください');
    return;
  }
  
  const container = document.getElementById('workDaysContainer');
  container.innerHTML = '';
  
  for (let i = 0; i < totalWorkDays; i++) {
    const workDayDiv = document.createElement('div');
    workDayDiv.className = 'work-day';
    workDayDiv.innerHTML = `
      <h4>勤務日 ${i + 1}</h4>
      <div style="margin-bottom: 15px;">
        <label>日付:</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          ${createMonthSelect(`month_${i}`)}
          ${createDaySelect(`day_${i}`)}
        </div>
      </div>
      <div style="display: flex; gap: 30px;">
        <div style="flex: 1;">
          <label>開始時刻:</label>
          <div class="time-inputs">
            <div class="time-group">
              <label>時</label>
              ${createHourSelect(`start_hour_${i}`)}
            </div>
            <div class="time-group">
              <label>分</label>
              ${createMinuteSelect(`start_minute_${i}`)}
            </div>
          </div>
        </div>
        <div style="flex: 1;">
          <label>終了時刻:</label>
          <div class="time-inputs">
            <div class="time-group">
              <label>時</label>
              ${createHourSelect(`end_hour_${i}`)}
            </div>
            <div class="time-group">
              <label>分</label>
              ${createMinuteSelect(`end_minute_${i}`)}
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(workDayDiv);
  }
  
  document.getElementById('calculateBtn').style.display = 'block';
}

// サンプルデータを入力
function fillSampleData() {
  // 基本情報を入力
  document.getElementById('hourlyWage').value = '1200';
  document.getElementById('overnightStays').value = '1';
  
  // 現在の年月を設定
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  document.getElementById('targetYear').value = currentYear;
  document.getElementById('targetMonth').value = currentMonth;
  
  // カレンダーを生成
  generateCalendar();
  
  // サンプル勤務日を自動追加（新形式）
  setTimeout(() => {
    // 給与期間内のサンプル日を追加
    const payrollPeriod = getPayrollPeriod(currentYear, currentMonth);
    
    // サンプル勤務日データ（期間内の日付で調整）
    const sampleWorkDays = [
      { day: 16, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 }, // 前月16日
      { day: 20, startHour: 22, startMinute: 0, endHour: 6, endMinute: 0 }, // 前月20日（深夜勤務）
      { day: 15, startHour: 6, startMinute: 0, endHour: 15, endMinute: 0 }  // 当月15日（早朝勤務）
    ];
    
    sampleWorkDays.forEach((sample, index) => {
      const workYear = index === 2 ? currentYear : payrollPeriod.start.year;
      const workMonth = index === 2 ? currentMonth : payrollPeriod.start.month;
      
      const workDay = new WorkDayWithTime(
        workYear, 
        workMonth, 
        sample.day, 
        sample.startHour, 
        sample.startMinute, 
        sample.endHour, 
        sample.endMinute
      );
      
      selectedWorkDays.push(workDay);
    });
    
    // カレンダー表示を更新
    updateCalendarDisplay();
  }, 100);
}

// 給与計算メイン関数（カレンダー対応）
function calculateSalary() {
  const hourlyWage = parseInt(document.getElementById('hourlyWage').value);
  const overnightStays = parseInt(document.getElementById('overnightStays').value) || 0;
  
  if (!hourlyWage) {
    alert('時給を入力してください');
    return;
  }
  
  if (selectedWorkDays.length === 0) {
    alert('勤務日を選択してください');
    return;
  }
  
  // 時刻が設定されていない勤務日をチェック
  const incompleteDays = selectedWorkDays.filter(wd => !wd.isTimeSet);
  if (incompleteDays.length > 0) {
    alert(`以下の日の勤務時間が未入力です:\n${incompleteDays.map(wd => `${wd.month}/${wd.day}`).join(', ')}`);
    return;
  }
  
  const workSchedule = [];
  const monthlyWorkCount = {};
  
  // 各勤務日のデータを取得（新形式）
  selectedWorkDays.forEach(workDay => {
    workSchedule.push(new WorkDay(workDay.month, workDay.day, workDay.startHour, workDay.startMinute, workDay.endHour, workDay.endMinute));
    monthlyWorkCount[workDay.month] = (monthlyWorkCount[workDay.month] || 0) + 1;
  });
  
  // 宿泊手当と夜食利用を計算
  const accommodationAllowance = overnightStays * 850;  // 宿泊手当：1回850円
  const nightMealAllowance = overnightStays * 350;    // 夜食利用：1回350円
  
  // 時間集計用変数（各手当の合計時間を計算）
  let totalRegularMinutes = 0;   // 基本労働時間の合計（8時間まで）
  let totalNightMinutes = 0;     // 深夜時間の合計
  let totalEarlyMinutes = 0;     // 早朝時間の合計
  let totalOvertimeMinutes = 0;  // 時間外時間の合計（8時間超過分）
  let totalMealAllowance = 0;    // 食事手当（回数ベース）
  let totalTransportation = 0;  // 通勤費（回数ベース）
  
  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  let resultHTML = `<div class="result">
  `;
  
  // 各勤務日の時間集計のみを行う（表示なし）
  for (let i = 0; i < selectedWorkDays.length; i++) {
    const work = workSchedule[i];
    
    let startMinutes = timeToMinutes(work.startHour, work.startMinute);
    let endMinutes = timeToMinutes(work.endHour, work.endMinute);
    
    // 日跨ぎ処理
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const workingMinutes = calculateWorkingMinutes(startMinutes, endMinutes);
    const breakdown = calculateDetailedPay(hourlyWage, startMinutes, endMinutes, workingMinutes, work.month, work.day);
    
    // 時間集計に加算（分単位）
    totalRegularMinutes += breakdown.baseMinutes || 0;
    totalNightMinutes += breakdown.nightMinutes || 0;
    totalEarlyMinutes += breakdown.earlyMinutes || 0;
    totalOvertimeMinutes += breakdown.overtimeMinutes || 0;
    totalMealAllowance += breakdown.mealAllowance;
    totalTransportation += breakdown.transportation;
  }
  
  // 総計表示
  resultHTML += '<h3>総計</h3>';
  
  // 合計時間から手当を計算
  const finalBaseWage = Math.ceil((totalRegularMinutes / 60) * hourlyWage);
  
  // 深夜勤務手当の詳細計算
  const totalNightHours = totalNightMinutes / 60;
  const nightRate = hourlyWage * 0.46;
  const finalNightCalculation = Math.round((totalNightHours * nightRate) * 100) / 100; // 精度向上
  const finalNightAllowance = Math.ceil(finalNightCalculation);
  
  const finalEarlyAllowance = Math.ceil((totalEarlyMinutes / 60) * (hourlyWage * 0.25));
  const finalOvertimeAllowance = Math.ceil((totalOvertimeMinutes / 60) * (hourlyWage * 1.25));
  
  resultHTML += `<p>日勤手当: ${finalBaseWage}円 <small>(${(totalRegularMinutes / 60).toFixed(2)}時間)</small></p>`;
  
  if (totalEarlyMinutes > 0) {
    resultHTML += `<p>早朝勤務手当: ${finalEarlyAllowance}円 <small>(${(totalEarlyMinutes / 60).toFixed(2)}時間)</small></p>`;
  }
  if (totalNightMinutes > 0) {
    resultHTML += `<p>深夜勤務手当: ${finalNightAllowance}円 <small>(${(totalNightMinutes / 60).toFixed(2)}時間)</small></p>`;
  }
  if (totalOvertimeMinutes > 0) {
    resultHTML += `<p>時間外労働手当: ${finalOvertimeAllowance}円 <small>(${(totalOvertimeMinutes / 60).toFixed(2)}時間)</small></p>`;
  }
  
  resultHTML += `<p>通勤費: ${totalTransportation}円</p>`;
  
  if (totalMealAllowance > 0) {
    resultHTML += `<p>食事手当: ${totalMealAllowance}円</p>`;
  }
  if (overnightStays > 0) {
    resultHTML += `<p>宿泊手当: ${accommodationAllowance}円</p>`;
  }
  
  const grossSalary = finalBaseWage + finalNightAllowance + finalEarlyAllowance + finalOvertimeAllowance + totalMealAllowance + totalTransportation + accommodationAllowance;
  
  resultHTML += `<div class="total">
    総支給額: ${grossSalary}円
    <small style="display: block; text-align: right; margin-top: 8px; font-size: 14px; font-weight: 400; opacity: 0.9;">${dateString}</small>
  </div>`;
  resultHTML += '</div>';
  
  // スクリーンショット・印刷ボタンを追加
  const actionButtonsHTML = `
    <div style="text-align: center; margin-top: 15px;">
      <button class="screenshot-button" onclick="captureResult()">📸 結果をスクリーンショット</button>
      <button class="print-button" onclick="printResult()">🖨️ 印刷</button>
      <button class="screenshot-button" onclick="copyResultText()">📋 テキストをコピー</button>
    </div>
  `;
  
  document.getElementById('result').innerHTML = 
    `<div class="screenshot-area" id="screenshotArea">${resultHTML}</div>${actionButtonsHTML}`;
}

// 結果をスクリーンショットする関数
async function captureResult() {
  try {
    // html2canvas ライブラリが読み込まれているかチェック
    if (typeof html2canvas === 'undefined') {
      // ライブラリを動的に読み込み
      await loadHtml2Canvas();
    }
    
    const element = document.getElementById('screenshotArea');
    if (!element) {
      alert('スクリーンショットする領域が見つかりません');
      return;
    }
    
    // スクリーンショットオプション
    const options = {
      backgroundColor: '#ffffff',
      scale: 2, // 高画質
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
    
    const canvas = await html2canvas(element, options);
    
    // 画像をダウンロード
    const link = document.createElement('a');
    link.download = `給与計算結果_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
  } catch (error) {
    console.error('スクリーンショットエラー:', error);
    alert('スクリーンショットに失敗しました。代わりに印刷機能をお試しください。');
  }
}

// 印刷する関数
function printResult() {
  window.print();
}

// 結果をテキストでコピーする関数
async function copyResultText() {
  const element = document.getElementById('screenshotArea');
  if (!element) {
    alert('コピーする内容が見つかりません');
    return;
  }
  
  // HTMLからテキストを抽出
  const textContent = element.innerText;
  
  try {
    await navigator.clipboard.writeText(textContent);
    alert('結果をクリップボードにコピーしました！');
  } catch (err) {
    // フォールバック: テキストエリアを作成してコピー
    const textArea = document.createElement('textarea');
    textArea.value = textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('結果をクリップボードにコピーしました！');
  }
}

// html2canvas ライブラリを動的に読み込む
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="html2canvas"]')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 年または月が変更されたときにカレンダーを再生成
function onDateChange() {
  selectedWorkDays = [];
  generateCalendar();
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  // 年・月のオプション生成
  populateYearOptions();
  populateMonthOptions();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  document.getElementById('targetYear').value = currentYear;
  document.getElementById('targetMonth').value = currentMonth;
  
  // 年月変更時のイベント追加
  document.getElementById('targetYear').addEventListener('change', onDateChange);
  document.getElementById('targetMonth').addEventListener('change', onDateChange);
  
  // 初回カレンダー生成
  generateCalendar();
});

// 手順アコーディオン
function toggleSteps() {
  const content = document.getElementById('stepsContent');
  const arrow = document.querySelector('.steps-arrow');
  
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    arrow.classList.remove('rotated');
  } else {
    content.classList.add('open');
    arrow.classList.add('rotated');
  }
}

// 注意事項アコーディオン
function toggleNotice() {
  const content = document.getElementById('noticeContent');
  const arrow = document.querySelector('.notice-arrow');
  
  if (content.classList.contains('open')) {
    content.classList.remove('open');
    arrow.classList.remove('rotated');
  } else {
    content.classList.add('open');
    arrow.classList.add('rotated');
  }
}

// カレンダー専用スクリーンショット機能
async function screenshotCalendar() {
  try {
    // html2canvas ライブラリが読み込まれているかチェック
    if (typeof html2canvas === 'undefined') {
      // ライブラリを動的に読み込み
      await loadHtml2Canvas();
    }
    
    const element = document.getElementById('calendarContainer');
    const buttonContainer = document.querySelector('.button-notice-container');
    
    if (!element) {
      alert('カレンダーが見つかりません');
      return;
    }
    
    // スクリーンショット前にボタンコンテナを非表示
    const originalDisplay = buttonContainer ? buttonContainer.style.display : 'flex';
    if (buttonContainer) {
      buttonContainer.style.display = 'none';
    }
    
    // スクリーンショットオプション
    const options = {
      backgroundColor: '#ffffff',
      scale: 2, // 高画質
      useCORS: true,
      allowTaint: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    };
    
    // スクリーンショットを作成
    const canvas = await html2canvas(element, options);
    
    // ボタンコンテナを再表示
    if (buttonContainer) {
      buttonContainer.style.display = originalDisplay;
    }
    
    // 画像として保存
    const link = document.createElement('a');
    link.download = `calendar_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('カレンダーのスクリーンショットを保存しました');
  } catch (error) {
    console.error('スクリーンショットに失敗しました:', error);
    alert('スクリーンショットに失敗しました。ブラウザの設定を確認してください。');
    
    // エラー時もボタンコンテナを再表示
    const buttonContainer = document.querySelector('.button-notice-container');
    if (buttonContainer) {
      buttonContainer.style.display = 'flex';
    }
  }
}
