import type { PresentationJSON } from 'tlsn-js/build/types';

export const formatDataPreview = (data: PresentationJSON) => {
  if (!data) return '';
  return Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}: ${JSON.stringify(value, null, 2)}`;
      } else if (key === 'data') {
        const maxLength = 160;
        const previewData = value.toString().substring(0, maxLength);
        const formattedData = previewData.match(/.{1,20}/g)?.join('\n');
        return `${key}: ${formattedData}... ${value.length} more`;
      } else {
        return `${key}: ${value}`;
      }
    })
    .join('\n');
};
