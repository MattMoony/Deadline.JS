const deadlinejs = {
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

      let cal = document.createElement('div');
      cal.classList.add('deadlinejs-cal');

      deadlinejs.getCurrentMonthsEvents(cid, token)
      .then(data => {
        console.log(data.items.map(v => v.summary));
      });


    });
  },
};

(() => {
  let style = document.createElement('style');
  style.type = 'text/css';

  let tags = `
    .deadlinejs-cal {
    }
  `;

  if (style.styleSheet) style.styleSheet.cssText = tags;
  else style.appendChild(document.createTextNode(tags));

  document.body.appendChild(style);
})();
