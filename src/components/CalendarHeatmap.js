import React from 'react';
import dayjs from 'dayjs';
import './CalendarHeatmap.css';

const CalendarHeatmap = ({ attendanceData, year = dayjs().year() }) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count attendance per day
  const attendanceCount = attendanceData.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // For 2-color mode: 0 = no attendance, 1+ = present
  const colorLevels = [
    'var(--gh-dark-0)', // no attendance
    'var(--gh-dark-4)'  // present
  ];
  const getColorLevel = (count) => (count > 0 ? 1 : 0);

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
        const count = attendanceCount[dateString] || 0;
        week.push({
          date: dateString,
          day: date.date(),
          month: date.month(),
          year: date.year(),
          isCurrentYear,
          count
        });
      }
      calendar.push(week);
      currentDate = currentDate.add(7, 'day');
    }
    return calendar;
  };

  const calendarData = generateCalendarData();

  // Group weeks by month: include any week that contains at least one day in the month
  const weeksByMonth = {};
  calendarData.forEach((week) => {
    // For each month, if any day in the week belongs to that month, include the week
    for (let m = 0; m < 12; m++) {
      if (week.some(day => day.month === m && day.isCurrentYear)) {
        if (!weeksByMonth[m]) weeksByMonth[m] = [];
        weeksByMonth[m].push(week);
      }
    }
  });

  return (
    <div className="calendar-heatmap">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Attendance Calendar - {year}</h3>
        <div className="calendar-legend-row" style={{ display: 'flex', alignItems: 'center', marginLeft: 16 }}>
          <span style={{ fontSize: '1.1em', color: '#8b949e', marginRight: 8 }}>Not Attend</span>
          {colorLevels.map((color, idx) => (
            <div key={color} className="legend-color" style={{ backgroundColor: color, margin: '0 2px' }}></div>
          ))}
          <span style={{ fontSize: '1.1em', color: '#8b949e', marginLeft: 8 }}>Attend</span>
        </div>
      </div>
      <div className="calendar-container" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.keys(weeksByMonth).map(monthIdx => (
          <div className="column" key={monthIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8 }}>
            <span className="monthname" style={{ color: '#c9d1d9', fontWeight: 500, fontSize: '1rem', marginBottom: 4 }}>{months[monthIdx]}</span>
            <div className="month" style={{ display: 'flex', flexDirection: 'row' }}>
              {weeksByMonth[monthIdx].map((week, weekIndex) => (
                <div key={weekIndex} className="week" style={{ display: 'flex', flexDirection: 'column' }}>
                  {week.map((day, dayIndex) => (
                    day.month === parseInt(monthIdx) ? (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="day"
                        style={{
                          backgroundColor: day.count > 0 ? colorLevels[1] : '#fff',
                          borderRadius: 2,
                          border: '1px solid #21262d',
                          width: 'var(--cell-size, 2.2vw)',
                          height: 'var(--cell-size, 2.2vw)',
                          minWidth: 14,
                          minHeight: 14,
                          maxWidth: 22,
                          maxHeight: 22,
                          margin: 'var(--cell-gap, 1.5px)',
                          padding: 0
                        }}
                        title={`${day.date} - ${day.count > 0 ? `${day.count} attendance` : 'No attendance'}`}
                      >
                        {/* No number, just color block */}
                      </div>
                    ) : (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        style={{
                          width: 'var(--cell-size, 2.2vw)',
                          height: 'var(--cell-size, 2.2vw)',
                          minWidth: 14,
                          minHeight: 14,
                          maxWidth: 22,
                          maxHeight: 22,
                          margin: 'var(--cell-gap, 1.5px)',
                          padding: 0,
                          background: 'transparent',
                          border: 'none'
                        }}
                      />
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeatmap; 