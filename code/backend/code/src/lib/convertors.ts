export function convertToCSV<T>(data: T[], columns: (keyof T)[]) {
  let dataCSV: string = '';
  for (const column of columns) {
    dataCSV += `${String(column)},`;
  }
  dataCSV = dataCSV.slice(0, -1) + '\r\n';

  for (const item of data) {
    let row = '';
    for (const column of columns) {
      row += `"${item[column]}",`;
    }
    row = row.slice(0, -1) + '\r\n';
    dataCSV += row;
  }

  return dataCSV;
}
