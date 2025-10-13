// 勤務日の構造
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

// 給与内訳の構造
class PayBreakdown {
  constructor() {
    this.baseWage = 0;
    this.nightAllowance = 0;
    this.earlyAllowance = 0;
    this.overtimeAllowance = 0;
    this.mealAllowance = 0;
    this.transportation = 700;
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
  const breakdown = new PayBreakdown();
  
  // 基本給
  breakdown.baseWage = (workingMinutes / 60.0) * hourlyWage;
  
  // 深夜勤務手当 (22:00-5:00) 46%増し
  const nightStart = 22 * 60;  // 22:00
  const nightEnd = 5 * 60;     // 5:00 (翌日)
  
  // 早朝勤務手当 (5:00-8:00) 25%増し
  const earlyStart = 5 * 60;   // 5:00
  const earlyEnd = 8 * 60;     // 8:00
  
  // 時間外労働手当 (8時間超過) 25%増し
  const overtimeMinutes = Math.max(0, workingMinutes - 480);  // 8時間超過分
  
  // 深夜勤務時間計算
  let nightMinutes = 0;
  
  // 22:00-24:00の部分
  if (endMinutes > nightStart) {
    const nightWorkStart = Math.max(startMinutes, nightStart);
    const nightWorkEnd = Math.min(endMinutes, 24 * 60);  // 24:00まで
    nightMinutes += Math.max(0, nightWorkEnd - nightWorkStart);
  }
  
  // 0:00-5:00の部分（日跨ぎを考慮）
  if (startMinutes < nightEnd || endMinutes > 24 * 60) {
    let adjustedStartMinutes = startMinutes;
    let adjustedEndMinutes = endMinutes;
    
    // 日跨ぎの場合の調整
    if (endMinutes > 24 * 60) {
      adjustedStartMinutes = Math.max(0, startMinutes);
      adjustedEndMinutes = Math.min(endMinutes - 24 * 60, nightEnd);
      if (adjustedEndMinutes > adjustedStartMinutes) {
        nightMinutes += adjustedEndMinutes - adjustedStartMinutes;
      }
    } else if (startMinutes < nightEnd && endMinutes <= 24 * 60) {
      // 同日で早朝の深夜時間帯
      const nightWorkStart = Math.max(startMinutes, 0);
      const nightWorkEnd = Math.min(endMinutes, nightEnd);
      nightMinutes += Math.max(0, nightWorkEnd - nightWorkStart);
    }
  }
  
  // 早朝勤務時間計算
  let earlyMinutes = 0;
  
  // 日跨ぎを考慮した早朝勤務計算
  if (endMinutes > 24 * 60) {
    // 日跨ぎの場合、翌日の5:00-8:00を計算
    const nextDayStart = Math.max(0, startMinutes - 24 * 60);
    const nextDayEnd = endMinutes - 24 * 60;
    if (nextDayStart < earlyEnd && nextDayEnd > earlyStart) {
      const earlyWorkStart = Math.max(nextDayStart, earlyStart);
      const earlyWorkEnd = Math.min(nextDayEnd, earlyEnd);
      earlyMinutes = Math.max(0, earlyWorkEnd - earlyWorkStart);
    }
  } else {
    // 同日の早朝勤務
    if (startMinutes < earlyEnd && endMinutes > earlyStart) {
      const earlyWorkStart = Math.max(startMinutes, earlyStart);
      const earlyWorkEnd = Math.min(endMinutes, earlyEnd);
      earlyMinutes = Math.max(0, earlyWorkEnd - earlyWorkStart);
    }
  }
  
  // 各手当計算
  breakdown.nightAllowance = (nightMinutes / 60.0) * hourlyWage * 0.46;  // 深夜勤務手当
  breakdown.earlyAllowance = (earlyMinutes / 60.0) * hourlyWage * 0.25;  // 早朝勤務手当
  breakdown.overtimeAllowance = (overtimeMinutes / 60.0) * hourlyWage * 0.25; // 時間外労働手当
  breakdown.mealAllowance = calculateMealAllowance(workingMinutes, month, day); // 食事手当
  
  return breakdown;
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
  document.getElementById('hourlyWage').value = '1200';
  document.getElementById('totalWorkDays').value = '3';
  document.getElementById('overnightStays').value = '1';
  
  generateWorkDayInputs();
  
  // 少し待ってからサンプルデータを入力
  setTimeout(() => {
    // 勤務日1: 10月15日 09:00-18:00
    document.getElementById('month_0').value = '10';
    updateDayOptions('month_0');
    setTimeout(() => {
      document.getElementById('day_0').value = '15';
    }, 50);
    document.getElementById('start_hour_0').value = '9';
    document.getElementById('start_minute_0').value = '0';
    document.getElementById('end_hour_0').value = '18';
    document.getElementById('end_minute_0').value = '0';
    
    // 勤務日2: 10月16日 22:00-06:00（深夜勤務）
    document.getElementById('month_1').value = '10';
    updateDayOptions('month_1');
    setTimeout(() => {
      document.getElementById('day_1').value = '16';
    }, 50);
    document.getElementById('start_hour_1').value = '22';
    document.getElementById('start_minute_1').value = '0';
    document.getElementById('end_hour_1').value = '6';
    document.getElementById('end_minute_1').value = '0';
    
    // 勤務日3: 10月31日 06:00-15:00（通常・早朝勤務）
    document.getElementById('month_2').value = '10';
    updateDayOptions('month_2');
    setTimeout(() => {
      document.getElementById('day_2').value = '31';
    }, 50);
    document.getElementById('start_hour_2').value = '6';
    document.getElementById('start_minute_2').value = '0';
    document.getElementById('end_hour_2').value = '15';
    document.getElementById('end_minute_2').value = '0';
  }, 100);
}

// 給与計算メイン関数
function calculateSalary() {
  const hourlyWage = parseInt(document.getElementById('hourlyWage').value);
  const totalWorkDays = parseInt(document.getElementById('totalWorkDays').value);
  const overnightStays = parseInt(document.getElementById('overnightStays').value) || 0;
  
  if (!hourlyWage || !totalWorkDays) {
    alert('時給と総勤務回数を入力してください');
    return;
  }
  
  const workSchedule = [];
  const monthlyWorkCount = {};
  
  // 各勤務日のデータを取得
  for (let i = 0; i < totalWorkDays; i++) {
    const month = parseInt(document.getElementById(`month_${i}`).value);
    const day = parseInt(document.getElementById(`day_${i}`).value);
    const startHour = parseInt(document.getElementById(`start_hour_${i}`).value);
    const startMinute = parseInt(document.getElementById(`start_minute_${i}`).value);
    const endHour = parseInt(document.getElementById(`end_hour_${i}`).value);
    const endMinute = parseInt(document.getElementById(`end_minute_${i}`).value);
    
    // 入力値のチェック
    if (!month || !day || startHour === '' || startMinute === '' || endHour === '' || endMinute === '') {
      alert(`勤務日${i + 1}の情報を全て選択してください`);
      return;
    }
    
    // NaN チェック
    if (isNaN(month) || isNaN(day) || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      alert(`勤務日${i + 1}の入力が正しくありません`);
      return;
    }
    
    // 日付の妥当性チェック
    const maxDay = getDaysInMonth(month);
    if (day > maxDay) {
      alert(`勤務日${i + 1}の日付が正しくありません（${month}月は${maxDay}日まで）`);
      return;
    }
    
    workSchedule.push(new WorkDay(month, day, startHour, startMinute, endHour, endMinute));
    monthlyWorkCount[month] = (monthlyWorkCount[month] || 0) + 1;
  }
  
  // 宿泊手当と夜食利用を計算
  const accommodationAllowance = overnightStays * 850;  // 宿泊手当：1回850円
  const nightMealAllowance = overnightStays * 350;    // 夜食利用：1回350円
  
  // 総計用変数
  let totalBaseWage = 0;
  let totalNightAllowance = 0;
  let totalEarlyAllowance = 0;
  let totalOvertimeAllowance = 0;
  let totalMealAllowance = 0;
  let totalTransportation = 0;
  
  const today = new Date();
  const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  
  let resultHTML = `<div class="result">
    <h2 style="text-align: center; color: #333; margin-bottom: 20px;">給与計算結果</h2>
    <p style="text-align: center; color: #666; margin-bottom: 20px;">計算日: ${dateString}</p>
    <div style="border-bottom: 2px solid #ddd; margin-bottom: 15px;"></div>
  `;
  
  // 各勤務日の計算
  for (let i = 0; i < totalWorkDays; i++) {
    const work = workSchedule[i];
    
    let startMinutes = timeToMinutes(work.startHour, work.startMinute);
    let endMinutes = timeToMinutes(work.endHour, work.endMinute);
    
    // 日跨ぎ処理
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const workingMinutes = calculateWorkingMinutes(startMinutes, endMinutes);
    const breakdown = calculateDetailedPay(hourlyWage, startMinutes, endMinutes, workingMinutes, work.month, work.day);
    
    resultHTML += `<p><strong>勤務日${i + 1} (${work.month}/${work.day}):</strong> 実働${Math.floor(workingMinutes / 60)}時間${workingMinutes % 60}分</p>`;
    resultHTML += `<small>勤務時間: ${String(work.startHour).padStart(2, '0')}:${String(work.startMinute).padStart(2, '0')} - ${String(work.endHour).padStart(2, '0')}:${String(work.endMinute).padStart(2, '0')}</small>`;
    resultHTML += `<ul>`;
    resultHTML += `<li>日勤手当: ${Math.round(breakdown.baseWage)}円</li>`;
    
    if (breakdown.earlyAllowance > 0) {
      resultHTML += `<li>早朝勤務手当: ${Math.round(breakdown.earlyAllowance)}円</li>`;
    }
    if (breakdown.nightAllowance > 0) {
      resultHTML += `<li>深夜勤務手当: ${Math.round(breakdown.nightAllowance)}円</li>`;
    }
    if (breakdown.overtimeAllowance > 0) {
      resultHTML += `<li>時間外労働手当: ${Math.round(breakdown.overtimeAllowance)}円</li>`;
    }
    
    resultHTML += `<li>通勤費: ${breakdown.transportation}円</li>`;
    
    if (breakdown.mealAllowance > 0) {
      resultHTML += `<li>食事手当: ${breakdown.mealAllowance}円</li>`;
    }
    resultHTML += `</ul>`;
    
    // 総計に加算
    totalBaseWage += breakdown.baseWage;
    totalNightAllowance += breakdown.nightAllowance;
    totalEarlyAllowance += breakdown.earlyAllowance;
    totalOvertimeAllowance += breakdown.overtimeAllowance;
    totalMealAllowance += breakdown.mealAllowance;
    totalTransportation += breakdown.transportation;
  }
  
  // 総計表示
  resultHTML += '<h3>総計</h3>';
  resultHTML += `<p>日勤手当: ${Math.round(totalBaseWage)}円</p>`;
  
  if (totalEarlyAllowance > 0) {
    resultHTML += `<p>早朝勤務手当: ${Math.round(totalEarlyAllowance)}円</p>`;
  }
  if (totalNightAllowance > 0) {
    resultHTML += `<p>深夜勤務手当: ${Math.round(totalNightAllowance)}円</p>`;
  }
  if (totalOvertimeAllowance > 0) {
    resultHTML += `<p>時間外労働手当: ${Math.round(totalOvertimeAllowance)}円</p>`;
  }
  
  resultHTML += `<p>通勤費: ${totalTransportation}円</p>`;
  
  if (totalMealAllowance > 0) {
    resultHTML += `<p>食事手当: ${totalMealAllowance}円</p>`;
  }
  if (overnightStays > 0) {
    resultHTML += `<p>宿泊手当: ${accommodationAllowance}円</p>`;
    resultHTML += `<p>夜食利用: ${nightMealAllowance}円</p>`;
  }
  
  const grossSalary = Math.round(totalBaseWage + totalNightAllowance + totalEarlyAllowance + totalOvertimeAllowance) + totalMealAllowance + totalTransportation + accommodationAllowance + nightMealAllowance;
  
  resultHTML += `<div class="total">総支給額: ${grossSalary}円</div>`;
  resultHTML += '</div>';
  
  // スクリーンショット・印刷ボタンを追加
  const actionButtonsHTML = `
    <div style="text-align: center; margin-top: 15px;">
      <button class="screenshot-button" onclick="captureResult()">📸 結果をキャプチャ</button>
      <button class="print-button" onclick="printResult()">🖨️ 印刷</button>
      <button class="screenshot-button" onclick="copyResultText()">📋 テキストをコピー</button>
    </div>
  `;
  
  document.getElementById('result').innerHTML = 
    `<div class="screenshot-area" id="screenshotArea">${resultHTML}</div>${actionButtonsHTML}`;
}

// 結果をキャプチャする関数
async function captureResult() {
  try {
    // html2canvas ライブラリが読み込まれているかチェック
    if (typeof html2canvas === 'undefined') {
      // ライブラリを動的に読み込み
      await loadHtml2Canvas();
    }
    
    const element = document.getElementById('screenshotArea');
    if (!element) {
      alert('キャプチャする領域が見つかりません');
      return;
    }
    
    // キャプチャオプション
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