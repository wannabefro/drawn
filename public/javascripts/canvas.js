var path;

onMouseDown = function(event) {
  path = new Path();
  path.strokeColor = 'black';
  path.strokeWidth = 20;
  path.strokeCap = 'round';
  path.add(event.point);
}

onMouseDrag = function(event) {
  path.add(event.point);
}
