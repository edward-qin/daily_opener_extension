// Time utility functions

const timeVal = (timeString) => {
  return (
    parseInt(timeString.substring(0, 2)) * 60 +
    parseInt(timeString.substring(3))
  );
};

const timeStr = (timeValue) => {
  return (
    Math.floor(timeValue / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (timeValue % 60).toString().padStart(2, "0")
  );
};

export { timeVal, timeStr };
