export async function copyTextToClipboard(text) {
    if (navigator?.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall back to execCommand below
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);
    }
    return copied;
}

function formatCurrency(val) {
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(val || 0))} đ`;
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
}

const DAY_TYPE_SHORT = {
    NORMAL: 'Thường',
    WEEKLY_OFF: 'CN 200%',
    HOLIDAY: 'Lễ 200-300%',
};

export function buildPayslipSummary({
    user,
    month,
    year,
    dashboardMonth,
    schedules = [],
    includeDailyDetails = false,
}) {
    const mStr = String(month).padStart(2, '0');
    const empTag = user?.employee_code ? ` (${user.employee_code})` : '';
    const shiftIncome = dashboardMonth?.shiftIncome ?? dashboardMonth?.income ?? 0;
    const allowances = dashboardMonth?.allowances ?? 0;
    const deductions = dashboardMonth?.deductions ?? 0;
    const netSalary = dashboardMonth?.netSalary ?? shiftIncome + allowances - deductions;
    const expense = dashboardMonth?.expense ?? 0;
    const balance = dashboardMonth?.balance ?? netSalary - expense;

    const shiftSummary =
        dashboardMonth?.shiftBreakdown?.length > 0
            ? dashboardMonth.shiftBreakdown.map((s) => `${s.code} x${s.count} (${s.hours}h)`).join(', ')
            : 'Chưa có ca trực';

    const lines = [
        `BẢNG CÔNG & LƯƠNG THÁNG ${mStr}/${year}`,
        `Nhân viên: ${user?.name || 'Bảo vệ Long Hải'}${empTag}`,
        '--------------------------------',
        `- Ngày làm: ${dashboardMonth?.workDays ?? 0} ngày | Tổng giờ: ${dashboardMonth?.totalHours ?? 0}h`,
        `- Chi tiết ca: ${shiftSummary}`,
        `- Lương ca trực: ${formatCurrency(shiftIncome)}`,
    ];

    if (allowances > 0) {
        lines.push(`- Phụ cấp / Thưởng: +${formatCurrency(allowances)}`);
    }
    if (deductions > 0) {
        lines.push(`- Tạm ứng / Khấu trừ: -${formatCurrency(deductions)}`);
    }

    lines.push(`=> THỰC NHẬN DỰ KIẾN: ${formatCurrency(netSalary)}`);
    lines.push('--------------------------------');
    lines.push(`Chi tiêu cá nhân: -${formatCurrency(expense)} | Còn lại: ${formatCurrency(balance)}`);

    if (includeDailyDetails && schedules.length > 0) {
        lines.push('');
        lines.push('CHI TIẾT TỪNG NGÀY:');
        schedules.forEach((s) => {
            const typeLabel = DAY_TYPE_SHORT[s.day_type] || '';
            const notePart = s.notes ? ` (${s.notes})` : '';
            lines.push(
                `${formatDateShort(s.work_date)}: Ca ${s.shift_code} (${s.shift_hours}h - ${typeLabel}) -> ${formatCurrency(
                    s.estimated_salary
                )}${notePart}`
            );
        });
    }

    return lines.join('\n');
}
