export function validateRange(from: string, to: string) {
  if (
    !from ||
    !to ||
    from > to ||
    !Number.isFinite(Date.parse(from)) ||
    !Number.isFinite(Date.parse(to))
  )
    throw new Error('表示開始日と終了日を確認してください。');
  if ((Date.parse(to) - Date.parse(from)) / 86400000 > 366)
    throw new Error('一度に表示できる期間は最大367日です。');
}
