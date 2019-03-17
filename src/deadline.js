const deadlinejs = {
  days_short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  days_full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  time_steps: [1000, 60, 60, 24, 7, 12],
  time_units: ['second(s)', 'minute(s)', 'hour(s)', 'day(s)', 'week(s)', 'month(s)', 'year(s)'],
  timezone_offset: 1,


  createCalendarFrame: (year = new Date().getFullYear(), month = new Date().getMonth()) => {
    let mStart  = new Date(year, month, 1),
        cal_wr = document.createElement('div');

    cal_wr.classList.add('deadlinejs-cal-wrapper');
    cal_wr.innerHTML = deadlinejs.createCalendarHeaderFrame();

    let cal = document.createElement('div');
    cal.classList.add('deadlinejs-cal');
    cal_wr.appendChild(cal);

    let week = deadlinejs.createWeek(cal);
    let cindex = 0;

    for (let i = 0; i < mStart.getDay()-1; i++, cindex++) {
      let e_day = document.createElement('div');
      e_day.classList.add('deadlinejs-date');
      e_day.classList.add('deadlinejs-not-month');
      week.appendChild(e_day);
    }

    for (let i = 0; i < new Date(year, month+1, 0).getDate(); i++, cindex++) {
      deadlinejs.createDay(week, new Date(year, month, i+1));

      if ((cindex+1)%7===0)
        week = deadlinejs.createWeek(cal);
    }

    for (; cindex < 35; cindex++) {
      let e_day = document.createElement('div');
      e_day.classList.add('deadlinejs-date');
      e_day.classList.add('deadlinejs-not-month');
      week.appendChild(e_day);
    }

    return cal_wr;
  },
  createCalendarHeaderFrame: () => {
    return `
      <header class="deadlinejs-cal-header">
        <div>
          <h1 class="deadlinejs-cal-title"></h1>
          <p class="deadlinejs-cal-description"></p>
        </div>
        <div>
          <p class="deadlinejs-cal-last-edit-container">
            <span class="deadlinejs-cal-last-edit-prefix">last edit ... </span>
            <span class="deadlinejs-cal-last-edited"></span>
            <span class="deadlinejs-cal-last-edit-suffix"> ago</span>
          </p>
        </div>
      </header>
    `;
  },
  createWeek: cal => {
    let week = document.createElement('div');
    week.classList.add('deadlinejs-week');
    cal.appendChild(week);
    return week;
  },
  createDay: (week, date) => {
    let day = document.createElement('div');
    day.classList.add('deadlinejs-date');
    day.classList.add(`d-${date.getFullYear()}-${date.getMonth()+1<10?'0'+(date.getMonth()+1):date.getMonth()+1}-${date.getDate()<10?'0'+date.getDate():date.getDate()}`);
    if (new Date(date).setHours(0,0,0,0)===new Date().setHours(0,0,0,0))
      day.classList.add('deadlinejs-today');
    week.appendChild(day);

    let content = document.createElement('div');
    content.classList.add('deadlinejs-date-content');
    content.classList.add(`dc-${date.getFullYear()}-${date.getMonth()+1<10?'0'+(date.getMonth()+1):date.getMonth()+1}-${date.getDate()<10?'0'+date.getDate():date.getDate()}`);
    day.appendChild(content);

    let d_header = document.createElement('div');
    d_header.classList.add('deadlinejs-date-header');
    content.appendChild(d_header);

    let w = document.createElement('div');
    w.classList.add('deadlinejs-week-day');
    w.innerHTML = deadlinejs.days_short[date.getDay()];
    d_header.appendChild(w);

    let d = document.createElement('div');
    d.classList.add('deadlinejs-date-number');
    d.innerHTML = date.getDate();
    d_header.appendChild(d);
  },
  createEventFrame: () => {
    let e = document.createElement('div');
    e.classList.add('deadlinejs-event');
    return e;
  },
  createEventPopupFrame: ev => {
    let p = document.createElement('div');
    p.classList.add('deadlinejs-info-popup');
    let e_rect = ev.getBoundingClientRect();

    p.style.left = e_rect.left + e_rect.width/2 + "px";
    p.style.top = e_rect.top + e_rect.height+10 + "px";

    p.innerHTML = `
      <div class="deadlinejs-info-popup-heading">
        <div class="deadlinejs-info-popup-summary"></div>
        <div class="deadlinejs-info-popup-datetime"></div>
      </div>
      <div class="deadlinejs-info-popup-body">
        <div class="deadlinejs-info-popup-location"></div>
        <p class="deadlinejs-info-popup-description"></p>
      </div>
    `;

    return p;
  },



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



  parseAll: parent => {
    parent = parent || document;

    new Array(...parent.getElementsByTagName('deadline-cal')).forEach(c => {
      let cid = c.getAttribute('c-id'),
          token = c.getAttribute('api-token');

      let cal = deadlinejs.createCalendarFrame();
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

          let pop = deadlinejs.createEventPopupFrame(e);
          let startD = new Date(start);

          pop.getElementsByClassName('deadlinejs-info-popup-summary')[0].innerHTML = i.summary;
          if (start.length > 10) {
            pop.getElementsByClassName('deadlinejs-info-popup-datetime')[0].innerHTML =
              `${startD.getDate()<10?'0'+startD.getDate():startD.getDate()}.${
                startD.getMonth()+1<10?'0'+(startD.getMonth()+1):startD.getMonth()+1}.${startD.getFullYear()} - ${
                startD.getHours()<10?'0'+startD.getHours():startD.getHours()}:${
                startD.getMinutes()<10?'0'+startD.getMinutes():startD.getMinutes()}`;
          } else {
            pop.getElementsByClassName('deadlinejs-info-popup-datetime')[0].innerHTML =
              `${startD.getDate()<10?'0'+startD.getDate():startD.getDate()}.${
                startD.getMonth()+1<10?'0'+(startD.getMonth()+1):startD.getMonth()+1}.${startD.getFullYear()}`;
          }
          if (i.location) {
            pop.getElementsByClassName('deadlinejs-info-popup-location')[0].innerHTML = i.location;
          } else {
            pop.getElementsByClassName('deadlinejs-info-popup-location')[0].style.display = 'none';
          }
          if (i.description) {
            pop.getElementsByClassName('deadlinejs-info-popup-description')[0].innerHTML = i.description;
          } else {
            pop.getElementsByClassName('deadlinejs-info-popup-description')[0].style.display = 'none';
          }

          document.body.appendChild(pop);

          e.onclick = () => {

          };
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
      width: 100%;
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
    .deadlinejs-cal-last-edit-prefix, .deadlinejs-cal-last-edit-suffix {
      font-size: 11px;
    }
    .deadlinejs-cal {
      width: 100%;
      display: table;
      table-layout: fixed;
      border: 2.5px solid #f2f2f2;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
    }
    .deadlinejs-week {
      display: table-row;
    }
    .deadlinejs-date {
      display: table-cell;
      width: 14.285714%;
      padding: 10px 5px;
      font-family: sans-serif;
      border: 1.25px solid #f2f2f2;
    }
    .deadlinejs-today .deadlinejs-date-header {
      background-color: rgba(252, 255, 137, .8);
      border-radius: 40% 25% 35% 15%;
      width: 50%;
      margin: 0 auto;
      margin-bottom: 10px;
    }
    .deadlinejs-not-month {
    }
    .deadlinejs-date-header {
      padding: 10px;
      margin: 0;
      margin-bottom: 10px;
    }
    .deadlinejs-date-content {
      box-sizing: border-box;
      min-height: 75px;
    }
    .deadlinejs-date-number {
      text-align: center;
      font-size: 12.5px;
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
      transition: .25s ease;
    }
    .deadlinejs-event:hover {
      cursor: pointer;
      opacity: .8;
      box-shadow: 0 0 1.5px dimgray;
    }
    .deadlinejs-timed-event {
      color: #FF749E;
      font-size: 13px;
    }
    .deadlinejs-day-event {
      color: #fff;
      background-color: #FF749E;
    }
    .deadlinejs-timed-event-time {
      font-weight: bold;
      font-size: 11px;
    }
    .deadlinejs-info-popup {
      position: absolute;
      z-index: 100;
      background-color: #fff;
      border: 2.5px solid #FF749E;
      box-shadow: 0 0 1.5px dimgray;
      border-radius: 5px;
      padding: 15px;
      font-family: sans-serif;
    }
    .deadlinejs-info-popup-heading {
      padding-bottom: 7.5px;
      border-bottom: 1.25px solid #f2f2f2;
    }
    .deadlinejs-info-popup-summary {
      font-size: 1.25em;
      font-weight: bold;
      margin-bottom: 2.5px;
    }
    .deadlinejs-info-popup-datetime {
      text-align: right;
      font-family: monospace;
      font-size: 11.5px;
      letter-spacing: 1.5px;
    }
    .deadlinejs-info-popup-body {
      margin-top: 10px;
    }
    .deadlinejs-info-popup-location {
      font-style: italic;
      font-size: 12.5px;
    }
    .deadlinejs-info-popup-description {
      border-left: 2.5px solid #f8f8f8;
      padding-left: 10px;
      font-size: 14px;
    }
  `;

  if (style.styleSheet) style.styleSheet.cssText = tags;
  else style.appendChild(document.createTextNode(tags));

  document.body.appendChild(style);
})();
