const deadlinejs = {
  days_short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  days_full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  time_steps: [1000, 60, 60, 24, 7, 12],
  time_units: ['second(s)', 'minute(s)', 'hour(s)', 'day(s)', 'week(s)', 'month(s)', 'year(s)'],
  timezone_offset: 1,

  getEvents: (cid, token, args) => {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${cid}/events?key=${token}`;
    args = args || {};

    for (let k in args) {
      url += `&${k}=${args[k]}`;
    }

    return fetch(url)
           .then(res => res.json());
  },
  getCurrentMonthsEvents: (cid, token) => {
    let mStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        mEnd    = new Date(new Date().getFullYear(), new Date().getMonth()+1, 1).toISOString();
    return deadlinejs.getEvents(cid, token, {timeMin:mStart, timeMax:mEnd});
  },
  getCalendar: (year, month) => {
    year = year || new Date().getFullYear();
    month = month || new Date().getMonth();

    let mStart  = new Date(year, month, 1);

    let cal_wr = document.createElement('div');
    cal_wr.classList.add('deadlinejs-cal-wrapper');

    cal_wr.innerHTML = `
      <header class="deadlinejs-cal-header">
        <div>
          <h1 class="deadlinejs-cal-title"></h1>
          <p class="deadlinejs-cal-description"></p>
        </div>
        <div>
          <p class="deadlinejs-cal-last-edit-container">
            <span class="deadlinejs-cal-last-edit-prefix">last edited ... </span>
            <span class="deadlinejs-cal-last-edited"></span>
          </p>
        </div>
      </header>
    `;

    let cal = document.createElement('div');
    cal.classList.add('deadlinejs-cal');
    cal_wr.appendChild(cal);

    let createWeek = cal => {
      let week = document.createElement('div');
      week.classList.add('deadlinejs-week');
      cal.appendChild(week);
      return week;
    };

    let createDay = (week, date) => {
      let day = document.createElement('div');
      day.classList.add('deadlinejs-date');
      day.classList.add(`d-${date.getFullYear()}-${date.getMonth()+1<10?'0'+(date.getMonth()+1):date.getMonth()+1}-${date.getDate()<10?'0'+date.getDate():date.getDate()}`);
      week.appendChild(day);

      let content = document.createElement('div');
      content.classList.add('deadlinejs-date-content');
      content.classList.add(`dc-${date.getFullYear()}-${date.getMonth()+1<10?'0'+(date.getMonth()+1):date.getMonth()+1}-${date.getDate()<10?'0'+date.getDate():date.getDate()}`);
      day.appendChild(content);

      let w = document.createElement('div');
      w.classList.add('deadlinejs-week-day');
      w.innerHTML = deadlinejs.days_short[date.getDay()];
      content.appendChild(w);

      let d = document.createElement('div');
      d.classList.add('deadlinejs-date-number');
      d.innerHTML = date.getDate();
      content.appendChild(d);
    };

    let week = createWeek(cal);
    let cindex = 0;

    for (let i = 0; i < mStart.getDay()-1; i++, cindex++) {
      let e_day = document.createElement('div');
      e_day.classList.add('deadlinejs-date');
      e_day.classList.add('deadlinejs-not-month');
      week.appendChild(e_day);
    }

    for (let i = 0; i < new Date(year, month+1, 0).getDate(); i++, cindex++) {
      createDay(week, new Date(year, month, i+1));

      if ((cindex+1)%7===0)
        week = createWeek(cal);
    }

    for (; cindex < 35; cindex++) {
      let e_day = document.createElement('div');
      e_day.classList.add('deadlinejs-date');
      e_day.classList.add('deadlinejs-not-month');
      week.appendChild(e_day);

      if ((cindex+1)%7===0)
        week = createWeek(cal);
    }

    return cal_wr;
  },
  createEventFrame: () => {
    let e = document.createElement('div');
    e.classList.add('deadlinejs-event');
    return e;
  },
  parseAll: parent => {
    parent = parent || document;

    new Array(...parent.getElementsByTagName('deadline-cal')).forEach(c => {
      let cid = c.getAttribute('c-id'),
          token = c.getAttribute('api-token');

      let cal = deadlinejs.getCalendar();
      c.parentNode.insertBefore(cal, c);
      c.parentNode.removeChild(c);

      deadlinejs.getCurrentMonthsEvents(cid, token)
      .then(data => {
        cal.getElementsByClassName('deadlinejs-cal-title')[0].innerHTML = data.summary;
        cal.getElementsByClassName('deadlinejs-cal-description')[0].innerHTML = data.description;

        let lastEdited = (new Date()-new Date(new Date(data.updated).setHours(new Date(data.updated).getHours()+
          (-1)*deadlinejs.timezone_offset))),
            le_out = cal.getElementsByClassName('deadlinejs-cal-last-edited')[0];

        (() => {
          for (let i = 0; i < deadlinejs.time_steps.length; i++) {
            lastEdited /= deadlinejs.time_steps[i];
            if (lastEdited < deadlinejs.time_steps[i+1]) {
              le_out.innerHTML = Math.floor(lastEdited) + ' ' + deadlinejs.time_units[i];
              return;
            }
          }
          le_out.innerHTML = Math.floor(lastEdited) + ' ' + deadlinejs.time_units[deadlinejs.time_units.length-1];
        })();

        data.items.forEach(i => {
          let e = deadlinejs.createEventFrame();
          let start = (i.start.date||i.start.dateTime);

          if (start.length > 10) {
            e.classList.add('deadlinejs-timed-event');
            e.innerHTML = '<span class="deadlinejs-timed-event-time">' + start.substr(11, 5) + '</span> ' + i.summary;
          } else {
            e.classList.add('deadlinejs-day-event');
            e.innerHTML = i.summary;
          }
          cal.getElementsByClassName("dc-" + start.substr(0, 10))[0].appendChild(e);
        });
      });
    });
  },
};

(() => {
  let style = document.createElement('style');
  style.type = 'text/css';

  let tags = `
    .deadlinejs-cal-wrapper {
      overflow-x: auto;
    }
    .deadlinejs-cal-header {
      text-align: left;
      display: table;
      width: 100%;
    }
    .deadlinejs-cal-header > div {
      display: table-cell;
    }
    .deadlinejs-cal-header > div:last-child {
      text-align: right;
    }
    .deadlinejs-cal-title {
      font-family: sans-serif;
      margin: 0;
    }
    .deadlinejs-cal-description {
      font-family: monospace;
      margin: 0;
      letter-spacing: 1.15px;
      margin-bottom: 15px;
    }
    .deadlinejs-cal-last-edit-container {
      font-family: monospace;
      font-size: 12.5px;
    }
    .deadlinejs-cal-last-edit-prefix {
      font-size: 11px;
    }
    .deadlinejs-cal {
      box-sizing: border-box;
      width: 100%;
      display: table;
      table-layout: fixed;
      border: 2.5px solid #f2f2f2;
      border-collapse: collapse;
    }
    .deadlinejs-week {
      display: table-row;
    }
    .deadlinejs-date {
      display: table-cell;
      width: 14.285714%;
      padding: 10px 5px;
      font-family: sans-serif;
      border: 1.5px solid #f2f2f2;
    }
    .deadlinejs-not-month {
    }
    .deadlinejs-date-content {
      box-sizing: border-box;
      min-height: 75px;
    }
    .deadlinejs-date-number {
      text-align: center;
      font-size: 12.5px;
      margin-bottom: 15px;
    }
    .deadlinejs-week-day {
      text-align: center;
      font-weight: bold;
    }
    .deadlinejs-event {
      display: block;
      border-radius: 5px;
      padding: 5px;
      font-size: 12.5px;
      margin: 2.5px 0;
      overflow: auto;
    }
    .deadlinejs-timed-event {
      color: #FF749E;
    }
    .deadlinejs-day-event {
      background-color: #FF749E;
    }
    .deadlinejs-timed-event-time {
      font-weight: bold;
      font-size: 11px;
    }
  `;

  if (style.styleSheet) style.styleSheet.cssText = tags;
  else style.appendChild(document.createTextNode(tags));

  document.body.appendChild(style);
})();
