window.onload = () => {
  deadlinejs.main_color = '#90C7FF';
  deadlinejs.parseAll(document);
};
window.onresize = () => {
  deadlinejs.repositionPopups();
};
