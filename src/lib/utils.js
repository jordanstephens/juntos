export function pick(obj, props) {
  return props.reduce(function(o, k) {
    o[k] = obj[k]; return o;
  }, {});
}
