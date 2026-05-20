const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/["\n,]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const toCsv = (rows, headers) => {
  const headerLine = headers.join(',');
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsv(row[header])).join(',')
  );
  return [headerLine, ...lines].join('\n');
};

module.exports = {
  toCsv,
};
