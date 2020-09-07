module.exports = {
  numDaysBetween: (d1, d2) => {
    var diff = Math.abs(d1.getTime() - d2.getTime())
    return diff / (1000 * 60 * 60 * 24)
  }
} 