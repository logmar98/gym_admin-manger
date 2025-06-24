import React from 'react';
import dayjs from 'dayjs';
import './CalendarHeatmap.css';

const CalendarHeatmap = ({ attendanceData, year = dayjs().year() }) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateCalendarData = () => {
    const calendar = [];
    const startDate = dayjs(`${year}-01-01`);
    const endDate = dayjs(`${year}-12-31`);

    let currentDate = startDate.startOf('year').startOf('week');
    const lastDate = endDate.endOf('year').endOf('week');

    while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = currentDate.add(i, 'day');
        const dateString = date.format('YYYY-MM-DD');
        const isCurrentYear = date.year() === year;
        const hasAttendance = attendanceData.includes(dateString);
        
        week.push({
          date: dateString,
          day: date.date(),
          month: date.month(),
          year: date.year(),
          isCurrentYear,
          hasAttendance
        });
      }
      calendar.push(week);
      currentDate = currentDate.add(7, 'day');
    }

    return calendar;
  };

  const getAttendanceColor = (hasAttendance, isCurrentYear) => {
    if (!isCurrentYear) return '#f0f0f0';
    if (hasAttendance) return '#27ae60';
    return '#e8f5e8';
  };

  const calendarData = generateCalendarData();

  return (
    <div className="calendar-heatmap">
      <div className="calendar-header">
        <h3>Attendance Calendar - {year}</h3>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#27ae60' }}></div>
            <span>Present</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#e8f5e8' }}></div>
            <span>Absent</span>
          </div>
        </div>
      </div>

      <div className="calendar-container">
        <div className="month-labels">
          {months.map((month, index) => (
            <div key={month} className="month-label">
              {month}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          <div className="day-labels">
            {daysOfWeek.map(day => (
              <div key={day} className="day-label">
                {day}
              </div>
            ))}
          </div>

          <div className="weeks-container">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="week">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="day"
                    style={{
                      backgroundColor: getAttendanceColor(day.hasAttendance, day.isCurrentYear)
                    }}
                    title={`${day.date} - ${day.hasAttendance ? 'Present' : 'Absent'}`}
                  >
                    {day.isCurrentYear && day.day}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap; 