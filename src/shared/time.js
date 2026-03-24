export const inSegment = (currentTime, segment) =>
  currentTime >= segment.segment[0] && currentTime < segment.segment[1];

export const findActiveSegment = (currentTime, segments) =>
  segments.find((segment) => inSegment(currentTime, segment));
